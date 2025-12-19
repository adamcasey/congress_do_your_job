import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/src/lib/db';
import { cleanDatabase, disconnectDatabase } from '@/__tests__/utils/test-db';
import { mockElectedOfficial, mockGoogleCivicResponse } from '@/__tests__/fixtures/test-data';

global.fetch = jest.fn();

describe('/api/v1/representatives/lookup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase();
    process.env.GOOGLE_API_KEY = 'test_api_key';
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET - Lookup representatives by address', () => {
    it('should successfully lookup representatives', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGoogleCivicResponse,
      });

      // Seed database with an official
      await prisma.electedOfficial.create({
        data: mockElectedOfficial,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=123%20Main%20St,%20Denver,%20CO');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.address).toBe('123 Main St, Denver, CO');
      expect(data.data.officials).toHaveProperty('federal');
      expect(data.data.officials).toHaveProperty('state');
      expect(data.data.officials).toHaveProperty('local');
      expect(data.data.totalCount).toBeGreaterThan(0);
    });

    it('should return 400 when address parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Address parameter is required');
    });

    it('should return 500 when Google API key is not configured', async () => {
      delete process.env.GOOGLE_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=123%20Main%20St');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Google API key not configured');
    });

    it('should handle Google API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid address' } }),
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=invalid');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid address');
    });

    it('should enrich data with database scores when official is found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGoogleCivicResponse,
      });

      // Seed database with an official
      await prisma.electedOfficial.create({
        data: mockElectedOfficial,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=123%20Main%20St');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials.federal[0]).toHaveProperty('currentScore');
      expect(data.data.officials.federal[0]).toHaveProperty('inDatabase', true);
      expect(data.data.officials.federal[0]).toHaveProperty('dbId');
    });

    it('should handle officials not in database', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGoogleCivicResponse,
      });

      // No need to seed - cleanDatabase ensures officials won't be found

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=123%20Main%20St');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.officials.federal[0]).toHaveProperty('inDatabase', false);
      expect(data.data.officials.federal[0].currentScore).toBeUndefined();
    });

    it('should return 500 for unexpected errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/v1/representatives/lookup?address=123%20Main%20St');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while fetching representatives');
    });
  });
});
