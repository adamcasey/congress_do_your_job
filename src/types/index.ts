/**
 * Shared TypeScript Types
 *
 * This file contains shared types used throughout the application.
 * Prisma-generated types are automatically available via @prisma/client
 */

// Re-export Prisma types for convenience
export type {
  User,
  ElectedOfficial,
  Scorecard,
  Petition,
  PetitionSignature,
  DigestEdition,
} from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// Representative Lookup types
export interface RepresentativeLookupRequest {
  address: string;
}

export interface RepresentativeLookupResponse {
  representatives: {
    federal: ElectedOfficialSummary[];
    state: ElectedOfficialSummary[];
    local: ElectedOfficialSummary[];
  };
}

export interface ElectedOfficialSummary {
  id: string;
  fullName: string;
  office: string;
  level: string;
  contactEmail?: string;
  contactPhone?: string;
  photoUrl?: string;
  currentScore?: number;
}

// Scorecard types
export interface ScorecardSummary {
  officialId: string;
  officialName: string;
  totalScore: number;
  periodStart: Date;
  periodEnd: Date;
  components: {
    category: string;
    score: number;
    weight: number;
  }[];
}

export interface ScorecardAnalytics {
  averageScore: number;
  topPerformers: ElectedOfficialSummary[];
  bottomPerformers: ElectedOfficialSummary[];
  categoryAverages: {
    [category: string]: number;
  };
}

// Petition types
export interface PetitionSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  signatureCount: number;
  goal?: number;
  progressPercentage: number;
}

export interface CreatePetitionSignatureRequest {
  petitionId: string;
  userId: string;
  deliveryMethod: 'email' | 'physical_mail';
  customMessage?: string;
}

// User Dashboard types
export interface UserDashboard {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    membershipTier?: string;
  };
  representatives: {
    id: string;
    name: string;
    office: string;
    level: string;
    currentScore?: number;
  }[];
  recentActivity: {
    petitionsSigned: number;
    lettersDelivered: number;
  };
}

// Digest types
export interface DigestEditionSummary {
  id: string;
  editionNumber: number;
  weekStart: Date;
  weekEnd: Date;
  headline: string;
  summary: string;
  publishedAt?: Date;
}

// Utility types
export type Level = 'federal' | 'state' | 'county' | 'city' | 'school_board';
export type MembershipTier = 'free' | 'basic' | 'premium';
export type MembershipStatus = 'active' | 'canceled' | 'past_due';
export type PetitionStatus = 'active' | 'closed' | 'successful';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';
