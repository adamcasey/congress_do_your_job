/**
 * Scorecard Analytics API
 *
 * GET /api/v1/scorecards/analytics?level=federal&chamber=senate&periodType=weekly&limit=10
 *
 * Returns aggregate analytics and statistics about scorecards including:
 * - Top and bottom performers
 * - Average scores by level, chamber, party
 * - Score trends over time
 * - Category performance breakdowns
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filter parameters
    const level = searchParams.get('level');
    const chamber = searchParams.get('chamber');
    const periodType = searchParams.get('periodType') || 'weekly';
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '10')));

    // Build where clause for officials
    const officialsWhere: any = {
      isCurrentOfficial: true,
    };

    if (level) {
      officialsWhere.level = level.toLowerCase();
    }

    if (chamber) {
      officialsWhere.chamber = chamber.toLowerCase();
    }

    // Fetch current officials matching criteria
    const officials = await prisma.electedOfficial.findMany({
      where: officialsWhere,
      select: {
        id: true,
        fullName: true,
        office: true,
        level: true,
        chamber: true,
        party: true,
        currentScore: true,
        photoUrl: true,
      },
    });

    const officialIds = officials.map(o => o.id);

    if (officialIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          topPerformers: [],
          bottomPerformers: [],
          averagesByLevel: {},
          averagesByChamber: {},
          averagesByParty: {},
          categoryAverages: [],
          scoreDistribution: [],
          totalOfficials: 0,
        },
      });
    }

    // Get the most recent scorecard period end date
    const mostRecentScorecard = await prisma.scorecard.findFirst({
      where: {
        officialId: {
          in: officialIds,
        },
        periodType: periodType,
      },
      orderBy: {
        periodEnd: 'desc',
      },
      select: {
        periodEnd: true,
      },
    });

    // Fetch recent scorecards for these officials
    const scorecards = mostRecentScorecard
      ? await prisma.scorecard.findMany({
          where: {
            officialId: {
              in: officialIds,
            },
            periodType: periodType,
            periodEnd: mostRecentScorecard.periodEnd,
          },
        })
      : [];

    // Create official lookup map
    const officialsMap = new Map(officials.map(o => [o.id, o]));

    // Top performers
    const sortedByScore = [...officials].sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0));
    const topPerformers = sortedByScore.slice(0, limit).map(official => ({
      ...official,
      rank: sortedByScore.indexOf(official) + 1,
    }));

    // Bottom performers
    const bottomPerformers = sortedByScore.slice(-limit).reverse().map(official => ({
      ...official,
      rank: sortedByScore.indexOf(official) + 1,
    }));

    // Calculate averages by level
    const averagesByLevel: Record<string, number> = {};
    const groupedByLevel = officials.reduce((acc, official) => {
      if (!acc[official.level]) acc[official.level] = [];
      acc[official.level].push(official);
      return acc;
    }, {} as Record<string, typeof officials>);

    for (const [level, levelOfficials] of Object.entries(groupedByLevel)) {
      const avg = levelOfficials.reduce((sum, o) => sum + (o.currentScore || 0), 0) / levelOfficials.length;
      averagesByLevel[level] = Math.round(avg * 10) / 10;
    }

    // Calculate averages by chamber
    const averagesByChamber: Record<string, number> = {};
    const groupedByChamber = officials.reduce((acc, official) => {
      const chamberKey = official.chamber || 'none';
      if (!acc[chamberKey]) acc[chamberKey] = [];
      acc[chamberKey].push(official);
      return acc;
    }, {} as Record<string, typeof officials>);

    for (const [chamber, chamberOfficials] of Object.entries(groupedByChamber)) {
      const avg = chamberOfficials.reduce((sum, o) => sum + (o.currentScore || 0), 0) / chamberOfficials.length;
      averagesByChamber[chamber] = Math.round(avg * 10) / 10;
    }

    // Calculate averages by party
    const averagesByParty: Record<string, number> = {};
    const groupedByParty = officials.reduce((acc, official) => {
      const partyKey = official.party || 'Other';
      if (!acc[partyKey]) acc[partyKey] = [];
      acc[partyKey].push(official);
      return acc;
    }, {} as Record<string, typeof officials>);

    for (const [party, partyOfficials] of Object.entries(groupedByParty)) {
      const avg = partyOfficials.reduce((sum, o) => sum + (o.currentScore || 0), 0) / partyOfficials.length;
      averagesByParty[party] = Math.round(avg * 10) / 10;
    }

    // Calculate category averages from recent scorecards
    const categoryTotals: Record<string, { sum: number; count: number }> = {};

    scorecards.forEach(scorecard => {
      const components = scorecard.components as any[] || [];
      components.forEach((component: any) => {
        const category = component.category;
        if (!categoryTotals[category]) {
          categoryTotals[category] = { sum: 0, count: 0 };
        }
        categoryTotals[category].sum += component.score;
        categoryTotals[category].count += 1;
      });
    });

    const categoryAverages = Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      averageScore: Math.round((data.sum / data.count) * 10) / 10,
      sampleSize: data.count,
    }));

    // Score distribution (buckets)
    const scoreDistribution = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '60-69', count: 0 },
      { range: '50-59', count: 0 },
      { range: '0-49', count: 0 },
    ];

    officials.forEach(official => {
      const score = official.currentScore || 0;
      if (score >= 90) scoreDistribution[0].count++;
      else if (score >= 80) scoreDistribution[1].count++;
      else if (score >= 70) scoreDistribution[2].count++;
      else if (score >= 60) scoreDistribution[3].count++;
      else if (score >= 50) scoreDistribution[4].count++;
      else scoreDistribution[5].count++;
    });

    return NextResponse.json({
      success: true,
      data: {
        topPerformers,
        bottomPerformers,
        averagesByLevel,
        averagesByChamber,
        averagesByParty,
        categoryAverages,
        scoreDistribution,
        totalOfficials: officials.length,
        periodType,
        lastUpdated: mostRecentScorecard?.periodEnd || null,
      },
    });
  } catch (error) {
    console.error('Scorecard analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching analytics',
      },
      { status: 500 }
    );
  }
}
