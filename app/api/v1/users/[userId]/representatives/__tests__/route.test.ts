import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockUser, mockElectedOfficial } from '@/__tests__/fixtures/test-data';

describe('/api/v1/users/[userId]/representatives', () => {
  const validUserId = '507f1f77bcf86cd799439012';
  const validOfficialId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST - Add representative', () => {
    it('should successfully add a representative', async () => {
      // Seed official and user
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });
      await prisma.user.create({ data: { ...mockUser, id: validUserId, representatives: [] } });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Representative added to your profile');
      expect(data.data.representative).toBeDefined();
      expect(data.data.totalRepresentatives).toBe(1);
    });

    it('should return 400 for invalid user ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/users/invalid/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should return 400 for missing official ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Official ID is required');
    });

    it('should return 404 for non-existent official', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Official not found');
    });

    it('should return 404 for non-existent user', async () => {
      // Seed official but not user
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 409 for duplicate representative', async () => {
      // Seed official and user with representative already added
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });
      await prisma.user.create({
        data: {
          ...mockUser,
          id: validUserId,
          representatives: [{ officialId: validOfficialId }],
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Representative already in your profile');
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/representatives', {
        method: 'POST',
        body: JSON.stringify({ officialId: validOfficialId }),
      });

      const response = await POST(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while adding representative');
    });
  });

  describe('DELETE - Remove representative', () => {
    it('should successfully remove a representative', async () => {
      // Seed user with two representatives
      await prisma.user.create({
        data: {
          ...mockUser,
          id: validUserId,
          representatives: [
            { officialId: validOfficialId },
            { officialId: '507f1f77bcf86cd799439020' },
          ],
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/users/${validUserId}/representatives?officialId=${validOfficialId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Representative removed from your profile');
      expect(data.data.totalRepresentatives).toBe(1);
    });

    it('should return 400 for invalid user ID format', async () => {
      const request = new NextRequest(`http://localhost:3000/api/v1/users/invalid/representatives?officialId=${validOfficialId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should return 400 for missing official ID', async () => {
      const request = new NextRequest(`http://localhost:3000/api/v1/users/${validUserId}/representatives`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Official ID is required');
    });

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/v1/users/${validUserId}/representatives?officialId=${validOfficialId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 404 when representative not in profile', async () => {
      // Seed user without the representative we're trying to remove
      await prisma.user.create({ data: { ...mockUser, id: validUserId, representatives: [] } });

      const request = new NextRequest(`http://localhost:3000/api/v1/users/${validUserId}/representatives?officialId=${validOfficialId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Representative not found in your profile');
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest(`http://localhost:3000/api/v1/users/${validUserId}/representatives?officialId=${validOfficialId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while removing representative');
    });
  });
});
