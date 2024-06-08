import { defineStore } from 'pinia'
import {
  type AdminInsert,
  type AdminUpdate,
  getAdmin,
  getAdmins,
  insertAdmin,
  updateAdmin
} from '@/db/admins'
import { useEventsStore } from '@/stores/events'
import type { Admin, AdminFull } from '@/domain/admins'

interface State {
  admins: Admin[]
  admin: AdminFull | null
}

export const useAdminsStore = defineStore('admins', {
  state: (): State => ({
    admins: [],
    admin: null
  }),
  getters: {
    getAdmins(state): Admin[] {
      return state.admins
    },
    getAdmin(state): AdminFull | null {
      return state.admin
    }
  },
  actions: {
    async loadAdmins(): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      this.admins = await getAdmins(event.id)
    },
    async loadAdmin(id: string): Promise<void> {
      this.admin = await getAdmin(id)
    },
    async insertAdmin(admin: Omit<AdminInsert, 'eventId'>): Promise<void> {
      const eventStore = useEventsStore()
      const event = eventStore.getEvent
      if (!event) {
        return
      }
      const adminWithEvent = { ...admin, eventId: event.id }
      await insertAdmin(adminWithEvent, 'user')
      await this.loadAdmins()
    },
    async updateAdmin(admin: AdminUpdate): Promise<void> {
      const didUpdate = await updateAdmin(admin, 'user')
      if (didUpdate) {
        await this.loadAdmins()
        if (this.admin && this.admin.id === admin.id) {
          await this.loadAdmin(admin.id)
        }
      }
    }
  }
})
