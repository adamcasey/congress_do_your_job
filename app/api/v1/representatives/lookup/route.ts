/**
 * Representative Lookup API
 *
 * GET /api/v1/representatives/lookup?address=<address>
 *
 * Finds all elected representatives for a given address using Google Civic Information API
 * and enriches the data with scorecard information from our database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

interface GoogleCivicOfficial {
  name: string;
  party?: string;
  photoUrl?: string;
  urls?: string[];
  emails?: string[];
  phones?: string[];
  channels?: Array<{ type: string; id: string }>;
}

interface GoogleCivicOffice {
  name: string;
  divisionId: string;
  levels?: string[];
  roles?: string[];
  officialIndices: number[];
}

interface GoogleCivicResponse {
  normalizedInput?: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  divisions?: Record<string, { name: string }>;
  offices: GoogleCivicOffice[];
  officials: GoogleCivicOfficial[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    // Validate address parameter
    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address parameter is required',
        },
        { status: 400 }
      );
    }

    // Call Google Civic Information API
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google API key not configured',
        },
        { status: 500 }
      );
    }

    const googleApiUrl = new URL('https://www.googleapis.com/civicinfo/v2/representatives');
    googleApiUrl.searchParams.set('address', address);
    googleApiUrl.searchParams.set('key', googleApiKey);

    const googleResponse = await fetch(googleApiUrl.toString());

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || 'Failed to fetch representatives from Google Civic API',
        },
        { status: googleResponse.status }
      );
    }

    const civicData: GoogleCivicResponse = await googleResponse.json();

    // Transform and enrich the data
    const officials = await Promise.all(
      civicData.offices.flatMap((office) =>
        office.officialIndices.map(async (index) => {
          const official = civicData.officials[index];

          // Determine the level (federal, state, local)
          const level = office.levels?.[0]?.toLowerCase() || 'local';

          // Try to find matching official in our database by name
          // This is a simple match - in production you'd want more sophisticated matching
          const dbOfficial = await prisma.electedOfficial.findFirst({
            where: {
              fullName: {
                contains: official.name,
                mode: 'insensitive',
              },
              level: level === 'country' ? 'federal' : level,
            },
            select: {
              id: true,
              currentScore: true,
              lastScoreUpdate: true,
              bioguideId: true,
            },
          });

          // Build social media links from channels
          const socialMedia: Record<string, string> = {};
          official.channels?.forEach((channel) => {
            if (channel.type.toLowerCase() === 'twitter') {
              socialMedia.twitter = `@${channel.id}`;
            } else if (channel.type.toLowerCase() === 'facebook') {
              socialMedia.facebook = channel.id;
            }
          });

          return {
            // Google Civic data
            name: official.name,
            office: office.name,
            level: level === 'country' ? 'federal' : level,
            party: official.party,
            photoUrl: official.photoUrl,
            contactEmail: official.emails?.[0],
            contactPhone: official.phones?.[0],
            website: official.urls?.[0],
            socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,

            // Enriched data from our database
            dbId: dbOfficial?.id,
            currentScore: dbOfficial?.currentScore,
            lastScoreUpdate: dbOfficial?.lastScoreUpdate,
            inDatabase: !!dbOfficial,
          };
        })
      )
    );

    // Group by level
    const groupedOfficials = {
      federal: officials.filter((o) => o.level === 'federal'),
      state: officials.filter((o) => o.level === 'administrativearea1' || o.level === 'state'),
      local: officials.filter((o) =>
        !['federal', 'administrativearea1', 'state'].includes(o.level)
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        address: address,
        normalizedAddress: civicData.normalizedInput
          ? `${civicData.normalizedInput.line1}, ${civicData.normalizedInput.city}, ${civicData.normalizedInput.state} ${civicData.normalizedInput.zip}`
          : address,
        officials: groupedOfficials,
        totalCount: officials.length,
      },
    });
  } catch (error) {
    console.error('Representative lookup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching representatives',
      },
      { status: 500 }
    );
  }
}
