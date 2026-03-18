import type { PetitionSummary, PetitionDetail } from "@/types/petition";

export interface PetitionCardProps {
  petition: PetitionSummary;
}

export interface PetitionSignFormProps {
  petition: PetitionDetail;
  initialHasSigned: boolean;
}
