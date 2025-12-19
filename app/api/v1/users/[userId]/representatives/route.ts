/**
 * User Representatives Management API
 *
 * POST /api/v1/users/[userId]/representatives
 * - Adds a representative to user's profile
 *
 * DELETE /api/v1/users/[userId]/representatives?officialId=<id>
 * - Removes a representative from user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function POST(
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

    const body = await request.json();
    const { officialId } = body;

    if (!officialId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Official ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch the official to get full details
    const official = await prisma.electedOfficial.findUnique({
      where: {
        id: officialId,
      },
      select: {
        id: true,
        fullName: true,
        office: true,
        level: true,
        chamber: true,
        party: true,
        contactEmail: true,
        contactPhone: true,
        photoUrl: true,
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

    // Fetch user and check if representative already exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
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

    // Check for duplicates
    const existingReps = user.representatives as any[] || [];
    const alreadyExists = existingReps.some(
      (rep: any) => rep.officialId === officialId
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Representative already in your profile',
        },
        { status: 409 }
      );
    }

    // Add representative to user's profile
    const newRepresentative = {
      officialId: official.id,
      name: official.fullName,
      office: official.office,
      level: official.level,
      chamber: official.chamber,
      party: official.party,
      contactEmail: official.contactEmail,
      contactPhone: official.contactPhone,
      photoUrl: official.photoUrl,
      addedAt: new Date(),
    };

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        representatives: {
          push: newRepresentative,
        },
      },
      select: {
        id: true,
        representatives: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Representative added to your profile',
        representative: newRepresentative,
        totalRepresentatives: (updatedUser.representatives as any[])?.length || 0,
      },
    });
  } catch (error) {
    console.error('Add representative error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while adding representative',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const searchParams = request.nextUrl.searchParams;
    const officialId = searchParams.get('officialId');

    if (!officialId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Official ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
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

    // Filter out the representative to remove
    const existingReps = user.representatives as any[] || [];
    const updatedReps = existingReps.filter(
      (rep: any) => rep.officialId !== officialId
    );

    if (existingReps.length === updatedReps.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Representative not found in your profile',
        },
        { status: 404 }
      );
    }

    // Update user with filtered representatives
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        representatives: updatedReps,
      },
      select: {
        id: true,
        representatives: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Representative removed from your profile',
        totalRepresentatives: (updatedUser.representatives as any[])?.length || 0,
      },
    });
  } catch (error) {
    console.error('Remove representative error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while removing representative',
      },
      { status: 500 }
    );
  }
}
