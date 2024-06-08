import type { CRDTMessage } from '@/db/helpers'

export interface Student {
  sid: string
  eventId: string
  name: string | null
  ticketSold: number
  ticketsRedeemed: number
  tombstone: boolean
}

export interface StudentFull extends Student {
  history: CRDTMessage<Student>[]
  tickets: TicketWithHistory[]
}

export interface Ticket {
  id: string
  studentSid: string
  eventId: string
  redeemed: boolean
  tombstone: boolean
}

export interface TicketWithHistory extends Ticket {
  history: CRDTMessage<Student>[]
}

export interface StudentAccess {
  eventId: string
  studentSid: string
  adminId: string
}
