import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockPetition, mockPetitionSignature } from '@/__tests__/fixtures/test-data';

describe('/api/v1/petitions', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - List petitions', () => {
    it('should return active petitions by default', async () => {
      // Seed active petitions
      await prisma.petition.createMany({
        data: [
          { ...mockPetition, status: 'active' },
          { ...mockPetition, id: '507f1f77bcf86cd799439016', title: 'Petition 2', status: 'active' },
          { ...mockPetition, id: '507f1f77bcf86cd799439017', title: 'Closed Petition', status: 'closed' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.petitions).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
      expect(data.data.petitions.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should filter petitions by category', async () => {
      // Seed petitions with different categories
      await prisma.petition.createMany({
        data: [
          { ...mockPetition, category: 'budget' },
          { ...mockPetition, id: '507f1f77bcf86cd799439016', title: 'Healthcare Petition', category: 'healthcare' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions?category=budget');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.petitions).toHaveLength(1);
      expect(data.data.petitions[0].category).toBe('budget');
    });

    it('should filter petitions by targetLevel', async () => {
      // Seed petitions with different target levels
      await prisma.petition.createMany({
        data: [
          { ...mockPetition, targetLevel: 'federal' },
          { ...mockPetition, id: '507f1f77bcf86cd799439016', title: 'State Petition', targetLevel: 'state' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions?targetLevel=federal');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.petitions).toHaveLength(1);
      expect(data.data.petitions[0].targetLevel).toBe('federal');
    });

    it('should exclude petitions user has already signed', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const signedPetitionId = '507f1f77bcf86cd799439014';
      const unsignedPetitionId = '507f1f77bcf86cd799439016';

      // Seed petitions
      await prisma.petition.createMany({
        data: [
          { ...mockPetition, id: signedPetitionId, title: 'Signed Petition' },
          { ...mockPetition, id: unsignedPetitionId, title: 'Unsigned Petition' },
        ],
      });

      // Seed a signature for the user
      await prisma.petitionSignature.create({
        data: {
          ...mockPetitionSignature,
          userId,
          petitionId: signedPetitionId,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/petitions?userId=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.petitions).toHaveLength(1);
      expect(data.data.petitions[0].id).toBe(unsignedPetitionId);
    });

    it('should handle pagination correctly', async () => {
      // Seed 50 petitions
      const petitions = Array.from({ length: 50 }, (_, i) => ({
        ...mockPetition,
        id: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
        title: `Petition ${i}`,
      }));
      await prisma.petition.createMany({ data: petitions });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions?page=2&limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(50);
      expect(data.data.pagination.totalPages).toBe(5);
      expect(data.data.pagination.hasMore).toBe(true);
      expect(data.data.petitions).toHaveLength(10);
    });

    it('should limit maximum page size to 100', async () => {
      // Seed one petition
      await prisma.petition.create({ data: mockPetition });

      const request = new NextRequest('http://localhost:3000/api/v1/petitions?limit=200');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.limit).toBe(100);
    });

    it('should return 500 for unexpected errors', async () => {
      // Close database connection to force error
      await prisma.$disconnect();

      const request = new NextRequest('http://localhost:3000/api/v1/petitions');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching petitions');
    });
  });
});
