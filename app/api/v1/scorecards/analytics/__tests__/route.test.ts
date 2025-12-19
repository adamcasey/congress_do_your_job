import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockElectedOfficial, mockScorecard } from '@/__tests__/fixtures/test-data';

describe('/api/v1/scorecards/analytics', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - Scorecard analytics', () => {
    it('should return comprehensive analytics', async () => {
      //Seed three officials with different scores
      await prisma.electedOfficial.createMany({
        data: [
          mockElectedOfficial,
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'Official 2', currentScore: 85, chamber: 'house' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439021', name: 'Official 3', currentScore: 65, party: 'Republican' },
        ],
      });

      // Seed scorecards
      await prisma.scorecard.create({ data: { ...mockScorecard, officialId: mockElectedOfficial.id } });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.topPerformers).toBeDefined();
      expect(data.data.bottomPerformers).toBeDefined();
      expect(data.data.averagesByLevel).toBeDefined();
      expect(data.data.averagesByChamber).toBeDefined();
      expect(data.data.averagesByParty).toBeDefined();
      expect(data.data.categoryAverages).toBeDefined();
      expect(data.data.scoreDistribution).toBeDefined();
      expect(data.data.totalOfficials).toBe(3);
    });

    it('should filter by level', async () => {
      // Seed officials at different levels
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, level: 'federal' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'State Official', level: 'state' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics?level=federal');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalOfficials).toBe(1);
      expect(data.data.topPerformers[0].level).toBe('federal');
    });

    it('should filter by chamber', async () => {
      // Seed officials in different chambers
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, chamber: 'senate' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'House Official', chamber: 'house' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics?chamber=senate');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalOfficials).toBe(1);
      expect(data.data.topPerformers[0].chamber).toBe('senate');
    });

    it('should calculate top performers correctly', async () => {
      // Seed officials with different scores
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439011', name: 'Top Performer', currentScore: 90 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'Second Best', currentScore: 85 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439021', name: 'Third Best', currentScore: 80 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics?limit=2');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.topPerformers).toHaveLength(2);
      expect(data.data.topPerformers[0].currentScore).toBe(90);
      expect(data.data.topPerformers[0].rank).toBe(1);
      expect(data.data.topPerformers[1].currentScore).toBe(85);
      expect(data.data.topPerformers[1].rank).toBe(2);
    });

    it('should calculate averages by level', async () => {
      // Seed officials at different levels with different scores
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439011', level: 'federal', currentScore: 80 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', level: 'federal', currentScore: 90 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439021', level: 'state', currentScore: 70 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.averagesByLevel.federal).toBe(85); // (80 + 90) / 2
      expect(data.data.averagesByLevel.state).toBe(70);
    });

    it('should calculate score distribution', async () => {
      // Seed officials across all score ranges
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439011', currentScore: 95 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', currentScore: 85 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439021', currentScore: 75 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439022', currentScore: 65 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439023', currentScore: 55 },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439024', currentScore: 45 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      const distribution = data.data.scoreDistribution;
      expect(distribution.find((d: any) => d.range === '90-100')?.count).toBe(1);
      expect(distribution.find((d: any) => d.range === '80-89')?.count).toBe(1);
      expect(distribution.find((d: any) => d.range === '70-79')?.count).toBe(1);
      expect(distribution.find((d: any) => d.range === '60-69')?.count).toBe(1);
      expect(distribution.find((d: any) => d.range === '50-59')?.count).toBe(1);
      expect(distribution.find((d: any) => d.range === '0-49')?.count).toBe(1);
    });

    it('should calculate category averages from scorecards', async () => {
      // Seed officials
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439011' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'Official 2' },
        ],
      });

      // Seed scorecards with component data
      await prisma.scorecard.createMany({
        data: [
          {
            ...mockScorecard,
            id: '507f1f77bcf86cd799439017',
            officialId: '507f1f77bcf86cd799439011',
            components: [
              { category: 'bipartisanship', score: 80, weight: 0.3 },
              { category: 'attendance', score: 90, weight: 0.2 },
            ],
          },
          {
            ...mockScorecard,
            id: '507f1f77bcf86cd799439018',
            officialId: '507f1f77bcf86cd799439020',
            components: [
              { category: 'bipartisanship', score: 70, weight: 0.3 },
              { category: 'attendance', score: 100, weight: 0.2 },
            ],
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      const bipartisanshipAvg = data.data.categoryAverages.find((c: any) => c.category === 'bipartisanship');
      expect(bipartisanshipAvg.averageScore).toBe(75); // (80 + 70) / 2
    });

    it('should handle empty officials list', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.topPerformers).toHaveLength(0);
      expect(data.data.bottomPerformers).toHaveLength(0);
      expect(data.data.totalOfficials).toBe(0);
    });

    it('should enforce maximum limit of 50', async () => {
      // Seed 100 officials
      const officials = Array.from({ length: 100 }, (_, i) => ({
        ...mockElectedOfficial,
        id: `507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`,
        name: `Official ${i}`,
        currentScore: 50 + i,
      }));
      await prisma.electedOfficial.createMany({ data: officials });

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics?limit=100');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.topPerformers.length).toBeLessThanOrEqual(50);
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/scorecards/analytics');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching analytics');
    });
  });
});
