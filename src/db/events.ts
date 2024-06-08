import type { Event, EventID, EventWithHistory } from '@/domain/event'
import { getCRDTMessages, handleCRDTMessages, toMessages } from '@/db/helpers'
import { queueExec } from '@/db/db'
import { isDeepEqual } from 'remeda'

export interface EventUpsert {
  id: EventID
  name?: string
  maxTickets?: number
  tombstone?: boolean
}

export const upsertEvent = async (eventUpsert: EventUpsert, actor: string): Promise<boolean> => {
  const existingEvent = await getEvent(eventUpsert.id)
  let eventCopy: EventUpsert = { id: eventUpsert.id }
  if (existingEvent) {
    Object.keys(eventUpsert).forEach((key) => {
      const newValue = eventUpsert[key as keyof EventUpsert]
      const existingValue = existingEvent[key as keyof EventUpsert]
      if (!isDeepEqual<any, any>(newValue, existingValue)) {
        eventCopy[key as keyof EventUpsert] = newValue
      }
    })
    if (Object.keys(eventCopy).length <= 1) {
      // 1 for the id
      return false
    }
  } else {
    eventCopy = eventUpsert
  }

  const messages = toMessages('events', eventCopy, eventCopy.id, actor)
  await handleCRDTMessages(messages)
  return true
}

export const getEvents = async (): Promise<Event[]> => {
  const eventSQL = `
      SELECT events.*,
             count(tickets.id)                  as ticketSold,
             coalesce(sum(tickets.redeemed), 0) as ticketsRedeemed,
             count(students.sid)                as studentCount
      FROM events
               LEFT JOIN students ON students.eventId = events.id AND students.tombstone = 0
               LEFT JOIN tickets on tickets.studentSid = students.sid AND tickets.eventId = students.eventId AND
                                    tickets.tombstone = 0
      GROUP BY events.id
  `
  const res = await queueExec((execer) => execer(eventSQL, []))
  return (res.result?.resultRows as Event[]) || []
}

export const getEvent = async (id: string): Promise<EventWithHistory | null> => {
  const eventSQL = `
      SELECT events.*,
             count(tickets.id)                  as ticketSold,
             coalesce(sum(tickets.redeemed), 0) as ticketsRedeemed,
             count(students.sid)                as studentCount
      FROM events
               LEFT JOIN students ON students.eventId = events.id AND students.tombstone = 0
               LEFT JOIN tickets on tickets.studentSid = students.sid AND tickets.eventId = students.eventId AND
                                    tickets.tombstone = 0
      WHERE events.id = ?
      GROUP BY events.id
  `
  const res = await queueExec((execer) => execer(eventSQL, [id]))
  if (!res.result) {
    return null
  }
  const event = res.result.resultRows[0] as Event
  const history = await getCRDTMessages('events', id)
  return { ...event, history }
}
