import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockElectedOfficial } from '@/__tests__/fixtures/test-data';

describe('/api/v1/representatives', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - List representatives', () => {
    it('should return paginated list of representatives', async () => {
      // Seed database with two officials
      await prisma.electedOfficial.createMany({
        data: [
          mockElectedOfficial,
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', name: 'Jane Smith' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.officials).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
    });

    it('should filter by level', async () => {
      // Seed officials at different levels
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, level: 'federal' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', level: 'state', name: 'State Rep' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?level=federal');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials).toHaveLength(1);
      expect(data.data.officials[0].level).toBe('federal');
    });

    it('should filter by chamber', async () => {
      // Seed officials in different chambers
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, chamber: 'senate' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', chamber: 'house', name: 'House Rep' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?chamber=senate');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials).toHaveLength(1);
      expect(data.data.officials[0].chamber).toBe('senate');
    });

    it('should filter by state', async () => {
      // Seed officials from different states
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, jurisdiction: 'Colorado' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', jurisdiction: 'California', name: 'CA Rep' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?state=Colorado');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials).toHaveLength(1);
      expect(data.data.officials[0].jurisdiction).toContain('Colorado');
    });

    it('should filter by party', async () => {
      // Seed officials from different parties
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, party: 'Democratic' },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', party: 'Republican', name: 'GOP Rep' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?party=Democratic');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials).toHaveLength(1);
      expect(data.data.officials[0].party).toContain('Democratic');
    });

    it('should only show current officials by default', async () => {
      // Seed both current and former officials
      await prisma.electedOfficial.createMany({
        data: [
          { ...mockElectedOfficial, isCurrentOfficial: true },
          { ...mockElectedOfficial, id: '507f1f77bcf86cd799439020', isCurrentOfficial: false, name: 'Former Rep' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials).toHaveLength(1);
      expect(data.data.officials[0].isCurrentOfficial).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      // Seed 100 officials for pagination testing
      const officials = Array.from({ length: 100 }, (_, i) => ({
        ...mockElectedOfficial,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        name: `Official ${i}`,
      }));
      await prisma.electedOfficial.createMany({ data: officials });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?page=3&limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.page).toBe(3);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.totalPages).toBe(10);
      expect(data.data.pagination.hasMore).toBe(true);
      expect(data.data.officials).toHaveLength(10);
    });

    it('should enforce maximum limit of 100', async () => {
      // Seed one official
      await prisma.electedOfficial.create({ data: mockElectedOfficial });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives?limit=200');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // The limit should be capped at 100, but since we only have 1 official, we get 1
      expect(data.data.pagination.limit).toBe(100);
    });

    it('should return 500 for unexpected errors', async () => {
      // Close the database connection to force an error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/representatives');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching representatives');
    });
  });
});
