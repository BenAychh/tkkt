import { type CRDTMessage, getCRDTMessages, handleCRDTMessages, toMessages } from '@/db/helpers'
import { type Execer, queueExec } from '@/db/db'
import { isDeepEqual, omit } from 'remeda'
import type { Student, StudentFull, Ticket, TicketWithHistory } from '@/domain/student'
import type { Optional } from 'utility-types'

export type StudentInsert = Pick<Student, 'sid' | 'name' | 'eventId'>
export type StudentUpdate = Optional<StudentInsert, 'name'>
export type TicketInsert = Pick<Ticket, 'id' | 'studentSid' | 'eventId'>
export type TicketUpdate = Optional<
  Pick<Ticket, 'id' | 'redeemed' | 'tombstone'>,
  'redeemed' | 'tombstone'
>

export const insertStudent = async (
  studentInsert: StudentInsert,
  actor: string
): Promise<boolean> => {
  const messages = toStudentMessages(studentInsert, actor)
  await handleCRDTMessages(messages)
  return true
}

export const updateStudent = async (
  studentUpdate: StudentUpdate,
  actor: string
): Promise<boolean> => {
  const existingStudent = await getStudent(studentUpdate.eventId, studentUpdate.sid)
  let studentCopy: StudentUpdate = { sid: studentUpdate.sid, eventId: studentUpdate.eventId }
  if (existingStudent) {
    Object.keys(studentUpdate).forEach((key) => {
      const newValue = studentUpdate[key as keyof StudentUpdate]
      const existingValue = existingStudent[key as keyof StudentUpdate]
      if (!isDeepEqual<any, any>(newValue, existingValue)) {
        studentCopy[key as keyof StudentUpdate] = newValue
      }
    })
    if (Object.keys(studentCopy).length <= 1) {
      // 1 for the id
      return false
    }
  } else {
    studentCopy = studentUpdate
  }

  const messages = toStudentMessages(studentCopy, actor)
  await handleCRDTMessages(messages)
  return true
}

export const toStudentMessages = (
  row: Record<string, any> & {
    sid: string
    eventId: string
  },
  actor: string
): CRDTMessage[] => {
  const id = `${row.eventId}_${row.sid}`
  const keys = omit(row, ['sid', 'eventId'])
  const newRow = {
    id,
    ...keys
  }
  return toMessages('students', newRow, row.eventId, actor)
}

export const getStudents = async (eventId: string): Promise<Student[]> => {
  const fn = async (exec: Execer) => {
    const eventSQL = `
        SELECT students.*
        FROM students
        WHERE students.eventId = ?
    `
    const res = await exec(eventSQL, [eventId])
    return (res.result?.resultRows as Student[]) || []
  }
  return queueExec(fn)
}

const getStudent = async (eventId: string, sid: string): Promise<Student | null> => {
  const fn = async (exec: Execer) => {
    const studentSQL = `
        SELECT students.*
        FROM students
        WHERE students.eventId = ?
          AND students.sid = ?
    `
    const res = await exec(studentSQL, [eventId, sid])
    if (!res.result) {
      return null
    }
    return res.result.resultRows[0] as Student
  }
  return queueExec(fn)
}

const addHistoryAndTicketsToStudent = async (student: Student): Promise<StudentFull | null> => {
  const history = await getCRDTMessages('students', `${student.eventId}_${student.sid}`)
  const tickets = await getTicketsForStudent(student.eventId, student.sid)
  const ticketsWithHistory = await Promise.all(
    tickets.map(async (ticket) => {
      const history = await getCRDTMessages('tickets', ticket.id)
      return { ...ticket, history }
    })
  )
  return { ...student, history, tickets: ticketsWithHistory }
}

export const getStudentFull = async (eventId: string, sid: string): Promise<StudentFull | null> => {
  const student = await getStudent(eventId, sid)
  if (!student) {
    return null
  }
  return addHistoryAndTicketsToStudent(student)
}

export const addTicket = async (ticket: TicketInsert, actor: string): Promise<boolean> => {
  const message = toMessages('tickets', ticket, ticket.eventId, actor)
  await handleCRDTMessages(message)
  return true
}

export const updateTicket = async (ticketUpdate: TicketUpdate, actor: string): Promise<boolean> => {
  const ticket = await getTicket(ticketUpdate.id)
  if (!ticket) {
    return false
  }
  const message = toMessages('tickets', ticketUpdate, ticket.eventId, actor)
  await handleCRDTMessages(message)
  return true
}

const getTicket = async (id: string): Promise<Ticket | null> => {
  const fn = async (exec: Execer) => {
    const ticketSQL = `
        SELECT tickets.*
        FROM tickets
        WHERE tickets.id = ?
    `
    const res = await exec(ticketSQL, [id])
    if (!res.result) {
      return null
    }
    return res.result.resultRows[0] as Ticket
  }
  return queueExec(fn)
}

const getTicketsForStudent = async (eventId: string, sid: string): Promise<Ticket[]> => {
  const fn = async (exec: Execer) => {
    const ticketSQL = `
        SELECT tickets.*
        FROM tickets
        WHERE tickets.eventId = ?
          AND tickets.studentSid = ?
    `
    const res = await exec(ticketSQL, [eventId, sid])
    return (res.result?.resultRows as Ticket[]) || []
  }
  return queueExec(fn)
}

export const getTicketWithHistory = async (ticket: Ticket): Promise<TicketWithHistory | null> => {
  const history = await getCRDTMessages('tickets', ticket.id)
  return { ...ticket, history }
}
