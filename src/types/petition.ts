import type { ObjectId } from "mongodb";

export type PetitionStatus = "active" | "closed" | "successful";
export type DeliveryMethod = "email" | "physical_mail";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

/** Raw MongoDB document shape for the `petitions` collection */
export interface PetitionDocument {
  _id: ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  letterTemplate: string;
  targetLevel: string;
  targetOffice?: string;
  status: PetitionStatus;
  goal?: number;
  signatureCount: number;
  lettersDelivered: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

/** Raw MongoDB document shape for the `petition_signatures` collection */
export interface PetitionSignatureDocument {
  _id: ObjectId;
  petitionId: ObjectId;
  clerkUserId: string;
  deliveryMethod: DeliveryMethod;
  deliveredAt?: Date;
  deliveryStatus: DeliveryStatus;
  customMessage?: string;
  signedAt: Date;
}

/** Compact representation for petition list views */
export interface PetitionSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: PetitionStatus;
  signatureCount: number;
  goal?: number;
  progressPercentage: number;
}

/** Full petition data for detail pages */
export interface PetitionDetail extends PetitionSummary {
  letterTemplate: string;
  targetLevel: string;
  targetOffice?: string;
  lettersDelivered: number;
  createdAt: string;
  closedAt?: string;
}

/** Request body for signing a petition */
export interface SignPetitionRequest {
  deliveryMethod: DeliveryMethod;
  customMessage?: string;
}
