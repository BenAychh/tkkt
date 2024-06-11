import { type CRDTMessage, getCRDTMessages, handleCRDTMessages, toMessages } from '@/db/helpers';
import { type Execer, queueExec } from '@/db/db';
import { flat, isDeepEqual, omit } from 'remeda';
import type { Student, StudentFull, Ticket, TicketWithHistory } from '@/domain/student';
import type { Optional } from 'utility-types';

export type StudentInsert = Pick<Student, 'sid' | 'name' | 'eventId'>;
export type StudentUpdate = Optional<StudentInsert, 'name'>;
export type TicketInsert = Pick<Ticket, 'id' | 'studentSid' | 'eventId'>;
export type TicketUpdate = Optional<
  Pick<Ticket, 'id' | 'redeemed' | 'tombstone'>,
  'redeemed' | 'tombstone'
>;

export const insertStudents = async (
  studentInserts: StudentInsert[],
  actor: string,
): Promise<boolean> => {
  if (studentInserts.length === 0) {
    return false;
  }
  const existingStudents = await getMultipleStudents(
    studentInserts[0].eventId,
    studentInserts.map((student) => student.sid),
  );
  const studentsToInsert = studentInserts.filter((student) => !existingStudents[student.sid]);
  const studentToUpdate = studentInserts.filter((student) => !!existingStudents[student.sid]);
  const insertMessages = flat(studentsToInsert.map((student) => toStudentMessages(student, actor)));
  const updateMessages = flat(
    studentToUpdate.map((student) =>
      getStudentUpdateMessages(student, existingStudents[student.sid], actor),
    ),
  );
  const messages = [...insertMessages, ...updateMessages];
  if (messages.length === 0) {
    return false;
  }
  await handleCRDTMessages(messages);
  return true;
};

const getStudentUpdateMessages = (
  studentUpdate: StudentUpdate,
  existingStudent: Student,
  actor: string,
): CRDTMessage[] => {
  const studentCopy: StudentUpdate = { sid: studentUpdate.sid, eventId: studentUpdate.eventId };
  Object.keys(studentUpdate).forEach((key) => {
    const newValue = studentUpdate[key as keyof StudentUpdate];
    const existingValue = existingStudent[key as keyof StudentUpdate];
    if (!isDeepEqual<any, any>(newValue, existingValue)) {
      studentCopy[key as keyof StudentUpdate] = newValue;
    }
  });
  if (Object.keys(studentCopy).length <= 1) {
    // 1 for the id
    return [];
  }
  return toStudentMessages(studentCopy, actor);
};

export const updateStudent = async (
  studentUpdate: StudentUpdate,
  actor: string,
): Promise<boolean> => {
  const existingStudent = await getStudent(studentUpdate.eventId, studentUpdate.sid);
  if (!existingStudent) {
    return false;
  }
  const messages = getStudentUpdateMessages(studentUpdate, existingStudent, actor);
  await handleCRDTMessages(messages);
  return true;
};

export const toStudentMessages = (
  row: Record<string, any> & {
    sid: string;
    eventId: string;
  },
  actor: string,
): CRDTMessage[] => {
  const id = `${row.eventId}_${row.sid}`;
  const keys = omit(row, ['sid', 'eventId']);
  const newRow = {
    id,
    ...keys,
  };
  return toMessages('students', newRow, row.eventId, actor);
};

export const getStudents = async (eventId: string): Promise<Student[]> => {
  const fn = async (exec: Execer) => {
    const eventSQL = `
        SELECT students.*
        FROM students
        WHERE students.eventId = ?
    `;
    const res = await exec(eventSQL, [eventId]);
    return (res.result?.resultRows as Student[]) || [];
  };
  return queueExec(fn);
};

const getStudent = async (eventId: string, sid: string): Promise<Student | null> => {
  const students = await getMultipleStudents(eventId, [sid]);
  return students[sid] || null;
};

export const getMultipleStudents = async (
  eventId: string,
  sids: string[],
): Promise<Record<string, Student>> => {
  const fn = async (exec: Execer) => {
    const studentSQL = `
        SELECT students.*
        FROM students
        WHERE students.eventId = ?
          AND students.sid IN (${sids.map(() => '?').join(',')})
    `;
    const res = await exec(studentSQL, [eventId, ...sids]);
    if (!res.result) {
      return {};
    }
    const students = res.result.resultRows as Student[];
    return (
      students.reduce(
        (acc, student) => {
          acc[student.sid] = student;
          return acc;
        },
        {} as Record<string, Student>,
      ) || {}
    );
  };
  return queueExec(fn);
};

const addHistoryAndTicketsToStudent = async (student: Student): Promise<StudentFull | null> => {
  const history = await getCRDTMessages('students', `${student.eventId}_${student.sid}`);
  const tickets = await getTicketsForStudent(student.eventId, student.sid);
  const ticketsWithHistory = await Promise.all(
    tickets.map(async (ticket) => {
      const history = await getCRDTMessages('tickets', ticket.id);
      return { ...ticket, history };
    }),
  );
  return { ...student, history, tickets: ticketsWithHistory };
};

export const getStudentFull = async (eventId: string, sid: string): Promise<StudentFull | null> => {
  const student = await getStudent(eventId, sid);
  if (!student) {
    return null;
  }
  return addHistoryAndTicketsToStudent(student);
};

export const addTicket = async (ticket: TicketInsert, actor: string): Promise<boolean> => {
  const message = toMessages('tickets', ticket, ticket.eventId, actor);
  await handleCRDTMessages(message);
  return true;
};

export const updateTicket = async (ticketUpdate: TicketUpdate, actor: string): Promise<boolean> => {
  const ticket = await getTicket(ticketUpdate.id);
  if (!ticket) {
    return false;
  }
  const message = toMessages('tickets', ticketUpdate, ticket.eventId, actor);
  await handleCRDTMessages(message);
  return true;
};

const getTicket = async (id: string): Promise<Ticket | null> => {
  const fn = async (exec: Execer) => {
    const ticketSQL = `
        SELECT tickets.*
        FROM tickets
        WHERE tickets.id = ?
    `;
    const res = await exec(ticketSQL, [id]);
    if (!res.result) {
      return null;
    }
    return res.result.resultRows[0] as Ticket;
  };
  return queueExec(fn);
};

const getTicketsForStudent = async (eventId: string, sid: string): Promise<Ticket[]> => {
  const fn = async (exec: Execer) => {
    const ticketSQL = `
        SELECT tickets.*
        FROM tickets
        WHERE tickets.eventId = ?
          AND tickets.studentSid = ?
    `;
    const res = await exec(ticketSQL, [eventId, sid]);
    return (res.result?.resultRows as Ticket[]) || [];
  };
  return queueExec(fn);
};

export const getTicketWithHistory = async (ticket: Ticket): Promise<TicketWithHistory | null> => {
  const history = await getCRDTMessages('tickets', ticket.id);
  return { ...ticket, history };
};
