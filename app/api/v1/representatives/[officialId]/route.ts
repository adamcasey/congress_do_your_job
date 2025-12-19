/**
 * Single Official Detail API
 *
 * GET /api/v1/representatives/[officialId]
 *
 * Returns detailed information about a specific elected official including their scorecard history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

interface RouteContext {
  params: {
    officialId: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { officialId } = context.params;

    // Validate officialId format (MongoDB ObjectId is 24 hex characters)
    if (!officialId || !/^[a-f\d]{24}$/i.test(officialId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid official ID format',
        },
        { status: 400 }
      );
    }

    // Fetch official with their scorecards
    const official = await prisma.electedOfficial.findUnique({
      where: {
        id: officialId,
      },
    });

    if (!official) {
      return NextResponse.json(
        {
          success: false,
          error: 'Official not found',
        },
        { status: 404 }
      );
    }

    // Fetch scorecard history
    const scorecards = await prisma.scorecard.findMany({
      where: {
        officialId: officialId,
      },
      orderBy: {
        periodEnd: 'desc',
      },
      take: 12, // Last 12 periods (approximately 3 months if weekly)
    });

    // Calculate scorecard statistics
    const scorecardStats = scorecards.length > 0 ? {
      currentScore: official.currentScore,
      averageScore: scorecards.reduce((sum, sc) => sum + sc.totalScore, 0) / scorecards.length,
      highestScore: Math.max(...scorecards.map(sc => sc.totalScore)),
      lowestScore: Math.min(...scorecards.map(sc => sc.totalScore)),
      trend: scorecards.length >= 2
        ? scorecards[0].totalScore - scorecards[scorecards.length - 1].totalScore
        : 0,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        official,
        scorecards,
        scorecardStats,
      },
    });
  } catch (error) {
    console.error('Official detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching official details',
      },
      { status: 500 }
    );
  }
}
