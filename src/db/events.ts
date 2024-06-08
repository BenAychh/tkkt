import type { Event, EventWithHistory } from '@/domain/event';
import { getCRDTMessages, handleCRDTMessages, toMessages } from '@/db/helpers';
import { queueExec } from '@/db/db';
import { isDeepEqual, omit } from 'remeda';
import type { Optional } from 'utility-types';
import { uuidv7 } from 'uuidv7';

export type EventInsert = Pick<Event, 'id' | 'name' | 'maxTickets'> & { creatorName: string };
export type EventUpsert = Pick<Event, 'id'> &
  Optional<Pick<Event, 'name' | 'maxTickets' | 'tombstone'>>;

export const insertEvent = async (eventInsert: EventInsert): Promise<boolean> => {
  const userId = uuidv7();
  const adminCreationMessage = toMessages(
    'admins',
    {
      id: userId,
      name: eventInsert.creatorName,
    },
    eventInsert.id,
    userId,
  );
  const eventMessages = toMessages(
    'events',
    omit(eventInsert, ['creatorName']),
    eventInsert.id,
    userId,
  );
  const adminBelongToEventMessage = toMessages(
    'admins',
    {
      id: userId,
      eventId: eventInsert.id,
    },
    eventInsert.id,
    userId,
  );
  const messages = [...adminCreationMessage, ...eventMessages, ...adminBelongToEventMessage];
  await handleCRDTMessages(messages);
  return true;
};

export const updateEvent = async (eventUpsert: EventUpsert, actorId: string): Promise<boolean> => {
  const existingEvent = await getEvent(eventUpsert.id);
  if (!existingEvent) {
    return false;
  }
  const eventCopy: EventUpsert = { id: eventUpsert.id };
  Object.keys(eventUpsert).forEach((key) => {
    const newValue = eventUpsert[key as keyof EventUpsert];
    const existingValue = existingEvent[key as keyof EventUpsert];
    if (!isDeepEqual<any, any>(newValue, existingValue)) {
      eventCopy[key as keyof EventUpsert] = newValue;
    }
  });
  if (Object.keys(eventCopy).length <= 1) {
    // 1 for the id
    return false;
  }

  const messages = toMessages('events', eventCopy, eventCopy.id, actorId);
  await handleCRDTMessages(messages);
  return true;
};

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
  `;
  const res = await queueExec((execer) => execer(eventSQL, []));
  return (res.result?.resultRows as Event[]) || [];
};

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
  `;
  const res = await queueExec((execer) => execer(eventSQL, [id]));
  if (!res.result) {
    return null;
  }
  const event = res.result.resultRows[0] as Event;
  const history = await getCRDTMessages('events', id);
  return { ...event, history };
};
