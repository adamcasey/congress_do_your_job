/**
 * User Dashboard API
 *
 * GET /api/v1/users/[userId]/dashboard
 *
 * Returns comprehensive dashboard data for a user including their representatives,
 * recent scorecard updates, active petitions, and signature history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = context.params;

    // Validate userId format
    if (!userId || !/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID format',
        },
        { status: 400 }
      );
    }

    // Fetch user with their data
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        congressionalDistrict: true,
        membershipTier: true,
        membershipStatus: true,
        representatives: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Get official IDs from user's representatives
    const representativeIds = user.representatives?.map((rep: any) => rep.officialId).filter(Boolean) || [];

    // Fetch full official details with current scores
    const representatives = representativeIds.length > 0
      ? await prisma.electedOfficial.findMany({
          where: {
            id: {
              in: representativeIds,
            },
          },
          select: {
            id: true,
            fullName: true,
            office: true,
            level: true,
            chamber: true,
            party: true,
            photoUrl: true,
            currentScore: true,
            lastScoreUpdate: true,
            website: true,
            contactEmail: true,
            contactPhone: true,
          },
        })
      : [];

    // Fetch recent scorecards for user's representatives (last 4 weeks)
    const recentScorecards = representativeIds.length > 0
      ? await prisma.scorecard.findMany({
          where: {
            officialId: {
              in: representativeIds,
            },
          },
          orderBy: {
            periodEnd: 'desc',
          },
          take: 20, // Last 20 scorecard entries across all representatives
        })
      : [];

    // Fetch active petitions
    const activePetitions = await prisma.petition.findMany({
      where: {
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        targetLevel: true,
        signatureCount: true,
        goal: true,
        createdAt: true,
      },
    });

    // Fetch user's petition signatures
    const userSignatures = await prisma.petitionSignature.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        signedAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        petitionId: true,
        signedAt: true,
        letterSent: true,
        physicalLetterSent: true,
      },
    });

    // Calculate dashboard statistics
    const stats = {
      representativeCount: representatives.length,
      averageScore: representatives.length > 0
        ? representatives.reduce((sum, rep) => sum + (rep.currentScore || 0), 0) / representatives.length
        : 0,
      petitionsSigned: userSignatures.length,
      lettersSent: userSignatures.filter(sig => sig.letterSent).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          location: {
            address: user.address,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
            congressionalDistrict: user.congressionalDistrict,
          },
          membership: {
            tier: user.membershipTier,
            status: user.membershipStatus,
          },
        },
        representatives,
        recentScorecards,
        activePetitions,
        userSignatures,
        stats,
      },
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching dashboard data',
      },
      { status: 500 }
    );
  }
}
