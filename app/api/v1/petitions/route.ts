/**
 * Petitions List API
 *
 * GET /api/v1/petitions?page=1&limit=20&status=active&category=budget&targetLevel=federal&userId=<id>
 *
 * Returns a paginated list of petitions with optional filters.
 * Defaults to active petitions only.
 * If userId provided, excludes petitions the user has already signed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { defaultCivicActions } from '@/components/landing/data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get('status') || 'active'; // Default to active
    const category = searchParams.get('category');
    const targetLevel = searchParams.get('targetLevel');
    const targetOffice = searchParams.get('targetOffice');
    const userId = searchParams.get('userId');

    // Build where clause
    const where: any = {
      status: status.toLowerCase(),
    };

    if (category) {
      where.category = category.toLowerCase();
    }

    if (targetLevel) {
      where.targetLevel = targetLevel.toLowerCase();
    }

    if (targetOffice) {
      where.targetOffice = {
        contains: targetOffice,
        mode: 'insensitive',
      };
    }

    // If userId provided, get petitions user has already signed
    let signedPetitionIds: string[] = [];
    if (userId) {
      const userSignatures = await prisma.petitionSignature.findMany({
        where: { userId },
        select: { petitionId: true },
      });
      signedPetitionIds = userSignatures.map(sig => sig.petitionId);
    }

    // Exclude petitions user has already signed
    if (signedPetitionIds.length > 0) {
      where.id = {
        notIn: signedPetitionIds,
      };
    }

    try {
      // Execute query with pagination
      const [petitions, totalCount] = await Promise.all([
        prisma.petition.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { createdAt: 'desc' },
          ],
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            category: true,
            targetLevel: true,
            targetOffice: true,
            status: true,
            goal: true,
            signatureCount: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.petition.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasMore = page < totalPages;

      return NextResponse.json({
        success: true,
        data: {
          petitions,
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
      console.warn('Petitions DB unavailable, returning defaults.', dbError);
      const petitions = defaultCivicActions.slice(skip, skip + limit).map((action) => ({
        id: action.id ?? action.slug ?? action.title,
        title: action.title,
        slug: action.slug,
        description: action.summary,
        category: 'general',
        targetLevel: action.level,
        targetOffice: action.level,
        status: 'active',
        goal: 0,
        signatureCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const totalCount = defaultCivicActions.length;
      const totalPages = Math.ceil(totalCount / limit);
      const hasMore = page < totalPages;

      return NextResponse.json({
        success: true,
        data: {
          petitions,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasMore,
          },
        },
      });
    }
  } catch (error) {
    console.error('Petitions list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching petitions',
      },
      { status: 500 }
    );
  }
}
