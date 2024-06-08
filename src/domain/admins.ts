import type { CRDTMessage } from '@/db/helpers'

export interface Admin {
  id: string
  eventId: string
  name: string | null
  tombstone: boolean
}

export interface AdminFull extends Admin {
  history: CRDTMessage<Admin>[]
}
