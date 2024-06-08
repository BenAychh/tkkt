import { defineStore } from 'pinia'
import type { Student, StudentFull } from '@/domain/student'
import {
  addTicket,
  getStudentFull,
  getStudents,
  insertStudent,
  type StudentInsert,
  type StudentUpdate,
  type TicketUpdate,
  updateStudent,
  updateTicket
} from '@/db/students'
import { useEventsStore } from '@/stores/events'

interface State {
  students: Student[]
  student: StudentFull | null
}

export const useStudentsStore = defineStore('students', {
  state: (): State => ({
    students: [],
    student: null
  }),
  getters: {
    getStudents(state): Student[] {
      return state.students
    },
    getStudent(state): StudentFull | null {
      return state.student
    }
  },
  actions: {
    async loadStudents(): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      this.students = await getStudents(event.id)
    },
    async loadStudent(sid: string): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      this.student = await getStudentFull(event.id, sid)
    },
    async insertStudent(student: Omit<StudentInsert, 'eventId'>): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      const studentWithEvent = { ...student, eventId: event.id }
      await insertStudent(studentWithEvent, 'user')
      await this.loadStudents()
    },
    async upsertStudent(student: Omit<StudentUpdate, 'eventId'>): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      const studentWithEvent = { ...student, eventId: event.id }
      const didUpdate = await updateStudent(studentWithEvent, 'user')
      if (didUpdate) {
        await this.loadStudents()
        if (this.student && this.student.sid === student.sid) {
          await this.loadStudent(student.sid)
        }
      }
    },
    async addTicket(ticketId: string): Promise<void> {
      const student = this.student
      if (!student) {
        return
      }
      const didUpdate = await addTicket(
        { eventId: student.eventId, studentSid: student.sid, id: ticketId },
        'user'
      )
      if (didUpdate) {
        await this.loadStudent(student.sid)
        const eventStore = useEventsStore()
        // for the ticket count
        await eventStore.loadEvent(student.eventId)
      }
    },
    async updateTicket(ticketUpdate: TicketUpdate): Promise<void> {
      const didUpdate = await updateTicket(ticketUpdate, 'user')
      if (didUpdate && this.student) {
        await this.loadStudent(this.student.sid)
        const eventStore = useEventsStore()
        // for the ticket count
        await eventStore.loadEvent(this.student.eventId)
      }
    }
  }
})
