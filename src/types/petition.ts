import type { ObjectId } from "mongodb";

export type PetitionStatus = "active" | "closed" | "successful";
export type DeliveryMethod = "email" | "physical_mail";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

/** US mailing address used for Lob.com physical letters */
export interface MailAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string; // 2-letter state code (e.g. "DC", "MO")
  zip: string; // 5-digit ZIP or ZIP+4
}

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
  /** Populated when the petition supports physical mail via Lob.com */
  recipientName?: string;
  recipientAddress?: MailAddress;
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
  /** Lob.com letter ID — set after a successful physical mail send */
  lobMailId?: string;
  /** Lob.com letter cost in USD — set after a successful physical mail send */
  lobMailCost?: number;
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
  /** True when the petition has a recipientAddress configured for Lob.com mail */
  hasPhysicalMailOption: boolean;
  createdAt: string;
  closedAt?: string;
}

/** Request body for signing a petition */
export interface SignPetitionRequest {
  deliveryMethod: DeliveryMethod;
  customMessage?: string;
  /** Required when deliveryMethod is "physical_mail" */
  senderAddress?: MailAddress;
}
