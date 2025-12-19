/**
 * Scorecards List API
 *
 * GET /api/v1/scorecards?page=1&limit=20&officialId=<id>&periodType=weekly
 *
 * Returns a paginated list of scorecards with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Filter parameters
    const officialId = searchParams.get('officialId');
    const periodType = searchParams.get('periodType'); // weekly, monthly, annual
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    // Build where clause
    const where: any = {};

    if (officialId) {
      where.officialId = officialId;
    }

    if (periodType) {
      where.periodType = periodType.toLowerCase();
    }

    if (startDate || endDate) {
      where.periodEnd = {};
      if (startDate) {
        where.periodEnd.gte = new Date(startDate);
      }
      if (endDate) {
        where.periodEnd.lte = new Date(endDate);
      }
    }

    if (minScore || maxScore) {
      where.totalScore = {};
      if (minScore) {
        where.totalScore.gte = parseFloat(minScore);
      }
      if (maxScore) {
        where.totalScore.lte = parseFloat(maxScore);
      }
    }

    // Execute query with pagination
    const [scorecards, totalCount] = await Promise.all([
      prisma.scorecard.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { periodEnd: 'desc' },
          { totalScore: 'desc' },
        ],
      }),
      prisma.scorecard.count({ where }),
    ]);

    // Enrich with official names if scorecards exist
    const officialIds = [...new Set(scorecards.map(sc => sc.officialId))];
    const officials = officialIds.length > 0
      ? await prisma.electedOfficial.findMany({
          where: {
            id: {
              in: officialIds,
            },
          },
          select: {
            id: true,
            fullName: true,
            office: true,
            level: true,
            party: true,
            photoUrl: true,
          },
        })
      : [];

    // Create a map for quick lookup
    const officialsMap = new Map(
      officials.map(official => [official.id, official])
    );

    // Enrich scorecards with official info
    const enrichedScorecards = scorecards.map(scorecard => ({
      ...scorecard,
      official: officialsMap.get(scorecard.officialId) || null,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        scorecards: enrichedScorecards,
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
    console.error('Scorecards list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching scorecards',
      },
      { status: 500 }
    );
  }
}
