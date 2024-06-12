import type { SearchResult } from '@/stores/search';
import type { Admin } from '@/domain/admins';
import { queueExec } from '@/db/db';
import type { Event } from '@/domain/event';
import type { Student } from '@/domain/student';
import { jaroWinkler } from 'jaro-winkler-typescript';
import { sort } from 'remeda';
import { getMultipleStudents, getTicketsForStudents } from '@/db/students';
import { getMultipleAdmins } from '@/db/admins';
import { getMultipleEvents } from '@/db/events';

type AdminRawSearchResult = Admin & { type: 'admin'; jaroWinklerScore: number };
type EventRawSearchResult = Omit<
  Event,
  'maxTickets' | 'ticketSold' | 'studentCount' | 'ticketsRedeemed'
> & {
  type: 'event';
  jaroWinklerScore: number;
};
type StudentRawSearchResult = Omit<Student, 'ticketsRedeemed' | 'ticketSold'> & {
  type: 'student';
  jaroWinklerScore: number;
};

const getEventWithScores = (
  searchTerm: string,
): ((event: Omit<EventRawSearchResult, 'jaroWinklerScore'>) => EventRawSearchResult) => {
  return (event) => ({ ...event, jaroWinklerScore: jaroWinkler(event.name!, searchTerm) });
};

const getAdminWithScores = (
  searchTerm: string,
): ((admin: Omit<AdminRawSearchResult, 'jaroWinklerScore'>) => AdminRawSearchResult) => {
  return (admin) => ({ ...admin, jaroWinklerScore: jaroWinkler(admin.name!, searchTerm) });
};

const getStudentWithScores = (
  searchTerm: string,
): ((student: Omit<StudentRawSearchResult, 'jaroWinklerScore'>) => StudentRawSearchResult) => {
  return (student) => {
    const sidScore = jaroWinkler(student.sid, searchTerm);
    let nameScore = 0;
    if (student.name) {
      nameScore = jaroWinkler(student.name, searchTerm);
    }
    const jaroWinklerScore = Math.max(sidScore, nameScore);
    return { ...student, jaroWinklerScore };
  };
};

export const search = async (searchTerm: string, eventId: string): Promise<SearchResult[]> => {
  if (!searchTerm) {
    return [];
  }
  const [events, students, admins] = await Promise.all([
    searchEvents(searchTerm),
    searchStudents(searchTerm, eventId),
    searchAdmins(searchTerm, eventId),
  ]);

  const allSortedByScore = sort(
    [...events, ...students, ...admins],
    (a, b) => b.jaroWinklerScore - a.jaroWinklerScore,
  );

  const top10 = allSortedByScore.slice(0, 10);
  const studentsResults = top10.filter(
    (result) => result.type === 'student',
  ) as StudentRawSearchResult[];
  const studentSearchResults = await getAndMergeStudents(studentsResults);
  const adminsResults = top10.filter((result) => result.type === 'admin') as AdminRawSearchResult[];
  const adminSearchResults = await getAndMergeAdmins(adminsResults);
  const eventsResults = top10.filter((result) => result.type === 'event') as EventRawSearchResult[];
  const eventSearchResults = await getAndMergeEvents(eventsResults);
  const allResults = [...studentSearchResults, ...adminSearchResults, ...eventSearchResults];
  return sort(allResults, (a, b) => b.jaroWinklerScore - a.jaroWinklerScore);
};

const searchAdmins = async (
  searchTerm: string,
  eventId: string,
): Promise<AdminRawSearchResult[]> => {
  if (!searchTerm) {
    return [];
  }

  const adminSearchSQL = `
      SELECT id, name, eventId, tombstone, 'admin' as type
      FROM admins
      WHERE eventId = ?
        AND name LIKE '%' || ? || '%'
      LIMIT 100
  `;
  return queueExec(async (exec) => {
    const res = await exec(adminSearchSQL, [eventId, searchTerm]);
    const results =
      (res.result?.resultRows as Omit<AdminRawSearchResult, 'jaroWinklerScore'>[]) || [];
    return results.map(getAdminWithScores(searchTerm));
  });
};

const searchEvents = async (searchTerm: string): Promise<EventRawSearchResult[]> => {
  if (!searchTerm) {
    return [];
  }

  const eventSearchSQL = `
      SELECT id, name, tombstone, 'event' as type
      FROM events
      WHERE name LIKE '%' || ? || '%'
      LIMIT 100
  `;
  return queueExec(async (exec) => {
    const res = await exec(eventSearchSQL, [searchTerm]);
    const results =
      (res.result?.resultRows as Omit<EventRawSearchResult, 'jaroWinklerScore'>[]) || [];
    return results.map(getEventWithScores(searchTerm));
  });
};

const searchStudents = async (
  searchTerm: string,
  eventId: string,
): Promise<StudentRawSearchResult[]> => {
  if (!searchTerm) {
    return [];
  }

  const studentSearchSQL = `
      SELECT sid, name, eventId, tombstone, 'student' as type
      FROM students
      WHERE eventId = ?
        AND (name LIKE '%' || ? || '%' OR sid LIKE '%' || ? || '%')
      LIMIT 100
  `;
  return queueExec(async (exec) => {
    const res = await exec(studentSearchSQL, [eventId, searchTerm, searchTerm]);
    const results =
      (res.result?.resultRows as Omit<StudentRawSearchResult, 'jaroWinklerScore'>[]) || [];
    return results.map(getStudentWithScores(searchTerm));
  });
};

const getAndMergeStudents = async (
  rawStudents: StudentRawSearchResult[],
): Promise<SearchResult[]> => {
  if (rawStudents.length === 0) {
    return [];
  }
  const sids = rawStudents.map((student) => student.sid);
  const eventId = rawStudents[0].eventId;
  const students = await getMultipleStudents(eventId, sids);
  const studentTickets = await getTicketsForStudents(eventId, sids);
  const onlyFoundStudents = rawStudents.filter((rawStudent) => students[rawStudent.sid]);
  return onlyFoundStudents.map((rawStudents) => {
    const student = students[rawStudents.sid];
    const uniqueId = `${student.sid}_${student.eventId}`;
    return {
      type: 'student',
      uniqueId,
      student: {
        ...student,
        tickets: studentTickets[student.sid] || [],
      },
      jaroWinklerScore: rawStudents.jaroWinklerScore,
    };
  });
};

const getAndMergeAdmins = async (rawAdmins: AdminRawSearchResult[]): Promise<SearchResult[]> => {
  if (rawAdmins.length === 0) {
    return [];
  }
  const adminIds = rawAdmins.map((admin) => admin.id);
  const admins = await getMultipleAdmins(adminIds);
  const onlyFoundAdmins = rawAdmins.filter((rawAdmin) => admins[rawAdmin.id]);
  return onlyFoundAdmins.map((rawAdmin) => {
    const admin = admins[rawAdmin.id];
    return {
      type: 'admin',
      uniqueId: admin.id,
      admin,
      jaroWinklerScore: rawAdmin.jaroWinklerScore,
    };
  });
};

const getAndMergeEvents = async (rawEvents: EventRawSearchResult[]): Promise<SearchResult[]> => {
  if (rawEvents.length === 0) {
    return [];
  }
  const eventIds = rawEvents.map((event) => event.id);
  const events = await getMultipleEvents(eventIds);
  const onlyFoundEvents = rawEvents.filter((rawEvent) => events[rawEvent.id]);
  return onlyFoundEvents.map((rawEvent) => {
    const event = events[rawEvent.id];
    return {
      type: 'event',
      event,
      uniqueId: event.id,
      jaroWinklerScore: rawEvent.jaroWinklerScore,
    };
  });
};
