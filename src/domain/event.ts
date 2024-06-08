import type { CRDTMessage } from '@/db/helpers'

export type EventID = string

export interface Event {
  id: EventID
  name: string | null
  ticketSold: number
  ticketsRedeemed: number
  maxTickets: number | null
  studentCount: number
  tombstone: boolean
}

export interface EventWithHistory extends Event {
  history: CRDTMessage[]
}
