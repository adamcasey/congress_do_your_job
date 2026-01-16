export interface FieldOffice {
  phone: string
  city: string
}

export interface Representative {
  id: string
  name: string
  phone: string
  url?: string
  photoURL: string
  party: string
  state: string
  district?: string
  reason: string
  area: string // "US House" or "US Senate"
  field_offices: FieldOffice[]
}

export interface RepresentativeResponse {
  location: string
  lowAccuracy: boolean
  state: string
  district: string
  representatives: Representative[]
}
