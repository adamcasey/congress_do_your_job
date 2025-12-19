import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockElectedOfficial, mockScorecard } from '@/__tests__/fixtures/test-data';

describe('/api/v1/representatives/[officialId]', () => {
  const validOfficialId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - Get single official', () => {
    it('should return official with scorecard history', async () => {
      // Seed official and scorecards
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, officialId: validOfficialId },
          { ...mockScorecard, id: '507f1f77bcf86cd799439017', officialId: validOfficialId, totalScore: 80 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.official.id).toBe(validOfficialId);
      expect(data.data.scorecards).toHaveLength(2);
      expect(data.data.scorecardStats).toBeDefined();
      expect(data.data.scorecardStats.currentScore).toBe(75.5);
      expect(data.data.scorecardStats.averageScore).toBe(77.75);
    });

    it('should return 400 for invalid official ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/representatives/invalid');

      const response = await GET(request, { params: { officialId: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid official ID format');
    });

    it('should return 404 for non-existent official', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Official not found');
    });

    it('should handle officials with no scorecards', async () => {
      // Seed official without scorecards
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards).toHaveLength(0);
      expect(data.data.scorecardStats).toBeNull();
    });

    it('should calculate scorecard statistics correctly', async () => {
      // Seed official and scorecards with different scores
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, id: '507f1f77bcf86cd799439091', officialId: validOfficialId, totalScore: 90 },
          { ...mockScorecard, id: '507f1f77bcf86cd799439092', officialId: validOfficialId, totalScore: 80 },
          { ...mockScorecard, id: '507f1f77bcf86cd799439093', officialId: validOfficialId, totalScore: 70 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(data.data.scorecardStats.averageScore).toBe(80);
      expect(data.data.scorecardStats.highestScore).toBe(90);
      expect(data.data.scorecardStats.lowestScore).toBe(70);
      expect(data.data.scorecardStats.trend).toBe(20); // 90 - 70
    });

    it('should limit scorecards to last 12 periods', async () => {
      // Seed official and 15 scorecards
      await prisma.electedOfficial.create({ data: { ...mockElectedOfficial, id: validOfficialId } });
      const scorecards = Array.from({ length: 15 }, (_, i) => ({
        ...mockScorecard,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        officialId: validOfficialId,
        periodStart: new Date(2024, i, 1),
        periodEnd: new Date(2024, i, 7),
      }));
      await prisma.scorecard.createMany({ data: scorecards });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(data.data.scorecards).toHaveLength(12);
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/' + validOfficialId);

      const response = await GET(request, { params: { officialId: validOfficialId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching official details');
    });
  });
});
