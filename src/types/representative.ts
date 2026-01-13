export interface Address {
  line1?: string
  line2?: string
  line3?: string
  city?: string
  state?: string
  zip?: string
}

export interface Channel {
  type: string // e.g., "Facebook", "Twitter", "YouTube"
  id: string
}

export interface Official {
  name: string
  address?: Address[]
  party?: string
  phones?: string[]
  urls?: string[]
  photoUrl?: string
  emails?: string[]
  channels?: Channel[]
}

export interface Office {
  name: string // e.g., "President of the United States", "U.S. Senator"
  divisionId: string
  levels?: string[] // e.g., ["country"], ["administrativeArea1"]
  roles?: string[] // e.g., ["headOfState"], ["legislatorUpperBody"]
  officialIndices: number[] // Indices into the officials array
}

export interface Division {
  name: string
  officeIndices?: number[]
}

export interface RepresentativeResponse {
  kind: string
  normalizedInput: Address
  divisions: Record<string, Division>
  offices: Office[]
  officials: Official[]
}

export interface RepresentativeWithOffice extends Official {
  office: string
  level: string
  division: string
}
