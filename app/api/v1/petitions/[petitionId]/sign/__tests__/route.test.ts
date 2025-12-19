import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockUser, mockPetition } from '@/__tests__/fixtures/test-data';
import { Prisma } from '@/generated/prisma';

describe('/api/v1/petitions/[petitionId]/sign', () => {
  const validPetitionId = '507f1f77bcf86cd799439014';
  const validUserId = '507f1f77bcf86cd799439012';

  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST - Sign petition', () => {
    it('should successfully sign a petition', async () => {
      // Seed petition and user
      await prisma.petition.create({ data: { ...mockPetition, id: validPetitionId, status: 'active' } });
      await prisma.user.create({ data: { ...mockUser, id: validUserId } });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.signatureId).toBeDefined();

      // Verify signature was created
      const signature = await prisma.petitionSignature.findFirst({
        where: { petitionId: validPetitionId, userId: validUserId },
      });
      expect(signature).toBeTruthy();

      // Verify petition signature count was incremented
      const petition = await prisma.petition.findUnique({ where: { id: validPetitionId } });
      expect(petition?.signatureCount).toBe(251); // 250 + 1
    });

    it('should return 400 for invalid petition ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/petitions/invalid/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid petition ID format');
    });

    it('should return 400 for missing userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
    });

    it('should return 404 for non-existent petition', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Petition not found or no longer accepting signatures');
    });

    it('should return 404 for inactive petition', async () => {
      // Seed closed petition
      await prisma.petition.create({ data: { ...mockPetition, id: validPetitionId, status: 'closed' } });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Petition not found or no longer accepting signatures');
    });

    it('should return 404 for non-existent user', async () => {
      // Seed petition but not user
      await prisma.petition.create({ data: { ...mockPetition, id: validPetitionId, status: 'active' } });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 409 for duplicate signature', async () => {
      // Seed petition, user, and existing signature
      await prisma.petition.create({ data: { ...mockPetition, id: validPetitionId, status: 'active' } });
      await prisma.user.create({ data: { ...mockUser, id: validUserId } });
      await prisma.petitionSignature.create({
        data: {
          id: '507f1f77bcf86cd799439015',
          petitionId: validPetitionId,
          userId: validUserId,
          signerName: mockUser.name,
          signerEmail: mockUser.email,
          signerLocation: mockUser.location || 'Denver, CO',
          signedAt: new Date(),
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You have already signed this petition');
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/petitions/' + validPetitionId + '/sign', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      });

      const response = await POST(request, { params: { petitionId: validPetitionId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while signing the petition');
    });
  });
});
