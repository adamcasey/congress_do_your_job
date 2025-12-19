import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockScorecard, mockElectedOfficial } from '@/__tests__/fixtures/test-data';

describe('/api/v1/scorecards', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - List scorecards', () => {
    it('should return paginated list of scorecards with official info', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed scorecards
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, officialId: mockElectedOfficial.id },
          { ...mockScorecard, id: '507f1f77bcf86cd799439018', officialId: mockElectedOfficial.id, totalScore: 80 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.scorecards).toHaveLength(2);
      expect(data.data.scorecards[0].official).toBeDefined();
      expect(data.data.pagination.total).toBe(2);
    });

    it('should filter by official ID', async () => {
      const officialId = '507f1f77bcf86cd799439011';
      const otherOfficialId = '507f1f77bcf86cd799439020';

      // Seed two officials
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, id: officialId },
          { ...mockElectedOfficial, id: otherOfficialId, name: 'Other Official' },
        ],
      });

      // Seed scorecards for both officials
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, id: '507f1f77bcf86cd799439017', officialId },
          { ...mockScorecard, id: '507f1f77bcf86cd799439018', officialId: otherOfficialId },
        ],
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/scorecards?officialId=${officialId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards).toHaveLength(1);
      expect(data.data.scorecards[0].officialId).toBe(officialId);
    });

    it('should filter by period type', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed scorecards with different period types
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, id: '507f1f77bcf86cd799439017', officialId: mockElectedOfficial.id, periodType: 'weekly' },
          { ...mockScorecard, id: '507f1f77bcf86cd799439018', officialId: mockElectedOfficial.id, periodType: 'monthly' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards?periodType=weekly');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards).toHaveLength(1);
      expect(data.data.scorecards[0].periodType).toBe('weekly');
    });

    it('should filter by date range', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed scorecards with different dates
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, id: '507f1f77bcf86cd799439017', officialId: mockElectedOfficial.id, periodEnd: new Date('2024-01-15') },
          { ...mockScorecard, id: '507f1f77bcf86cd799439018', officialId: mockElectedOfficial.id, periodEnd: new Date('2024-02-15') },
        ],
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/scorecards?startDate=${startDate}&endDate=${endDate}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards).toHaveLength(1);
    });

    it('should filter by score range', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed scorecards with different scores
      await prisma.scorecard.createMany({
        data: [
          { ...mockScorecard, id: '507f1f77bcf86cd799439017', officialId: mockElectedOfficial.id, totalScore: 75 },
          { ...mockScorecard, id: '507f1f77bcf86cd799439018', officialId: mockElectedOfficial.id, totalScore: 65 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards?minScore=70&maxScore=90');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards).toHaveLength(1);
      expect(data.data.scorecards[0].totalScore).toBe(75);
    });

    it('should handle pagination correctly', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed 50 scorecards
      const scorecards = Array.from({ length: 50 }, (_, i) => ({
        ...mockScorecard,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        officialId: mockElectedOfficial.id,
        periodStart: new Date(2024, 0, i + 1),
        periodEnd: new Date(2024, 0, i + 7),
      }));
      await prisma.scorecard.createMany({ data: scorecards });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards?page=2&limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(50);
      expect(data.data.pagination.totalPages).toBe(5);
      expect(data.data.pagination.hasMore).toBe(true);
      expect(data.data.scorecards).toHaveLength(10);
    });

    it('should enforce maximum limit of 100', async () => {
      // Seed official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      // Seed one scorecard
      await prisma.scorecard.create({ data: { ...mockScorecard, officialId: mockElectedOfficial.id } });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards?limit=200');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.limit).toBe(100);
    });

    it('should handle scorecards with no officials', async () => {
      // Seed scorecard without an official (orphaned)
      await prisma.scorecard.create({
        data: { ...mockScorecard, officialId: '507f1f77bcf86cd799999999' },
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.scorecards[0].official).toBeNull();
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching scorecards');
    });
  });
});
