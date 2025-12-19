import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockUser, mockElectedOfficial, mockScorecard, mockPetition, mockPetitionSignature } from '@/__tests__/fixtures/test-data';

describe('/api/v1/users/[userId]/dashboard', () => {
  const validUserId = '507f1f77bcf86cd799439012';

  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - User dashboard', () => {
    it('should return complete dashboard data', async () => {
      // Seed official first
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed user with representative
      await prisma.user.create({
        data: {
          ...mockUser,
          id: validUserId,
          representatives: [
            {
              officialId: mockElectedOfficial.id,
              name: mockElectedOfficial.fullName,
              office: mockElectedOfficial.office,
              level: mockElectedOfficial.level,
            },
          ],
        },
      });

      // Seed scorecard
      await prisma.scorecard.create({
        data: { ...mockScorecard, officialId: mockElectedOfficial.id },
      });

      // Seed petition
      await prisma.petition.create({ data: mockPetition });

      // Seed petition signature
      await prisma.petitionSignature.create({
        data: {
          ...mockPetitionSignature,
          userId: validUserId,
          petitionId: mockPetition.id,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.representatives).toHaveLength(1);
      expect(data.data.recentScorecards).toHaveLength(1);
      expect(data.data.activePetitions).toHaveLength(1);
      expect(data.data.userSignatures).toHaveLength(1);
      expect(data.data.stats).toBeDefined();
    });

    it('should return 400 for invalid user ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/users/invalid/dashboard');

      const response = await GET(request, { params: { userId: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle user with no representatives', async () => {
      // Seed user without representatives
      await prisma.user.create({ data: { ...mockUser, id: validUserId, representatives: [] } });

      // Seed petition
      await prisma.petition.create({ data: mockPetition });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.representatives).toHaveLength(0);
      expect(data.data.recentScorecards).toHaveLength(0);
      expect(data.data.stats.representativeCount).toBe(0);
    });

    it('should calculate statistics correctly', async () => {
      // Seed two officials
      await prisma.electedOfficial.createMany({
        data: [
          mockElectedOfficial,
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'Official 2', currentScore: 85 },
        ],
      });

      // Seed user with both representatives
      await prisma.user.create({
        data: {
          ...mockUser,
          id: validUserId,
          representatives: [
            { officialId: mockElectedOfficial.id },
            { officialId: '507f1f77bcf86cd799439020' },
          ],
        },
      });

      // Seed petition signatures
      await prisma.petition.create({ data: mockPetition });
      await prisma.petitionSignature.createMany({
        data: [
          { ...mockPetitionSignature, id: '507f1f77bcf86cd799439015', userId: validUserId, petitionId: mockPetition.id, letterSent: false },
          { ...mockPetitionSignature, id: '507f1f77bcf86cd799439021', userId: validUserId, petitionId: mockPetition.id, letterSent: true },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(data.data.stats.representativeCount).toBe(2);
      expect(data.data.stats.averageScore).toBe(80.25); // (75.5 + 85) / 2
      expect(data.data.stats.petitionsSigned).toBe(2);
      expect(data.data.stats.lettersSent).toBe(1);
    });

    it('should limit active petitions to 5', async () => {
      // Seed user
      await prisma.user.create({ data: { ...mockUser, id: validUserId } });

      // Seed 10 petitions
      const petitions = Array.from({ length: 10 }, (_, i) => ({
        ...mockPetition,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        title: `Petition ${i}`,
      }));
      await prisma.petition.createMany({ data: petitions });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(data.data.activePetitions).toHaveLength(5);
    });

    it('should limit recent scorecards to 20', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed user with representative
      await prisma.user.create({
        data: {
          ...mockUser,
          id: validUserId,
          representatives: [{ officialId: mockElectedOfficial.id }],
        },
      });

      // Seed 25 scorecards
      const scorecards = Array.from({ length: 25 }, (_, i) => ({
        ...mockScorecard,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        officialId: mockElectedOfficial.id,
        periodStart: new Date(2024, 0, i + 1),
        periodEnd: new Date(2024, 0, i + 7),
      }));
      await prisma.scorecard.createMany({ data: scorecards });

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(data.data.recentScorecards).toHaveLength(20);
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/users/' + validUserId + '/dashboard');

      const response = await GET(request, { params: { userId: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching dashboard data');
    });
  });
});
