/**
 * Petition Sign API
 *
 * POST /api/v1/petitions/[petitionId]/sign
 *
 * Signs a petition. Nothing else.
 *
 * Request body:
 * {
 *   "userId": "user_id"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { Prisma } from '@/generated/prisma';

interface RouteContext {
  params: {
    petitionId: string;
  };
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { petitionId } = context.params;

    if (!petitionId || !/^[a-f\d]{24}$/i.test(petitionId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid petition ID format',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const petition = await prisma.petition.findUnique({
      where: { id: petitionId, status:'active' },
    });

    if (!petition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Petition not found',
        },
        { status: 404 }
      );
    }

    if (petition.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'This petition is no longer accepting signatures',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        city: true,
        state: true,
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

    const signature = await prisma.petitionSignature.create({
      data: {
        petitionId: petitionId,
        userId: userId,
        // signerName: `${user.firstName} ${user.lastName}`,
        // signerEmail: user.email,
        // signerLocation: `${user.city}, ${user.state}`,
      },
    });

    await prisma.petition.update({
      where: { id: petitionId },
      data: {
        signatureCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        signatureId: signature.id,
        signedAt: signature.signedAt,
      },
    });
  } catch (error) {
    console.error('Petition sign error:', error);

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already signed this petition',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while signing the petition',
      },
      { status: 500 }
    );
  }
}
