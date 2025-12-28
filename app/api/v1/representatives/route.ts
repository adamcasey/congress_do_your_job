/**
 * Representatives List API
 *
 * GET /api/v1/representatives?page=1&limit=20&level=federal&chamber=senate&state=Colorado
 *
 * Returns a paginated list of elected officials with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { defaultOfficials } from '@/components/landing/data';

const DB_TIMEOUT_MS = 1500;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Filter parameters
    const level = searchParams.get('level'); // federal, state, local
    const chamber = searchParams.get('chamber'); // senate, house
    const state = searchParams.get('state');
    const jurisdiction = searchParams.get('jurisdiction');
    const party = searchParams.get('party');
    const currentOnly = searchParams.get('currentOnly') !== 'false'; // Default true

    // Build where clause
    const where: any = {};

    if (level) {
      where.level = level.toLowerCase();
    }

    if (chamber) {
      where.chamber = chamber.toLowerCase();
    }

    if (state) {
      where.jurisdiction = {
        contains: state,
        mode: 'insensitive',
      };
    }

    if (jurisdiction) {
      where.jurisdiction = {
        contains: jurisdiction,
        mode: 'insensitive',
      };
    }

    if (party) {
      where.party = {
        contains: party,
        mode: 'insensitive',
      };
    }

    if (currentOnly) {
      where.isCurrentOfficial = true;
    }

    // Execute query with pagination
    const hasDb = Boolean(process.env.MONGODB_URI);

    if (hasDb) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), DB_TIMEOUT_MS));
        const dbQuery = Promise.all([
          prisma.electedOfficial.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
              { level: 'asc' },
              { chamber: 'asc' },
              { lastName: 'asc' },
            ],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              office: true,
              level: true,
              jurisdiction: true,
              chamber: true,
              district: true,
              party: true,
              photoUrl: true,
              contactEmail: true,
              contactPhone: true,
              website: true,
              socialMedia: true,
              bioguideId: true,
              currentScore: true,
              lastScoreUpdate: true,
              termStart: true,
              termEnd: true,
              isCurrentOfficial: true,
            },
          }),
          prisma.electedOfficial.count({ where }),
        ]);

        const [officials, totalCount] = await Promise.race([dbQuery, timeout]);
        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        return NextResponse.json({
          success: true,
          data: {
            officials,
            pagination: {
              page,
              limit,
              total: totalCount,
              totalPages,
              hasMore,
            },
          },
        });
      } catch (dbError) {
        console.warn('Representatives DB unavailable, falling back to defaults.', dbError);
      }
    }

    const fallback = defaultOfficials.slice(skip, skip + limit);
    const totalCount = defaultOfficials.length;
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        officials: fallback,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Representatives list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching representatives',
      },
      { status: 500 }
    );
  }
}
