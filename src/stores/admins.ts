import { defineStore } from 'pinia';
import {
  type AdminInsert,
  type AdminUpdate,
  getAdmin,
  getAdmins,
  insertAdmin,
  updateAdmin,
} from '@/db/admins';
import { useEventsStore } from '@/stores/events';
import type { Admin, AdminFull } from '@/domain/admins';

interface State {
  admins: Admin[];
  admin: AdminFull | null;
  selectedAdminId: string | null;
  myAdminId: string | null;
}

export const useAdminsStore = defineStore('admins', {
  state: (): State => ({
    admins: [],
    admin: null,
    selectedAdminId: null,
    myAdminId: null,
  }),
  getters: {
    getAdmins(state): Admin[] {
      return state.admins;
    },
    getAdmin(state): AdminFull | null {
      if (state.admin) {
        return state.admin;
      }
      if (state.selectedAdminId) {
        const admin = state.admins.find((admin: Admin) => admin.id === state.selectedAdminId);
        if (!admin) {
          return null;
        }
        return {
          ...admin,
          history: [],
        };
      }
      return null;
    },
    getMyAdminId(state): string | null {
      return state.myAdminId;
    },
  },
  actions: {
    async setSelectedAdminId(id: string): Promise<void> {
      if (this.selectedAdminId === id) {
        return;
      }
      this.selectedAdminId = id;
      if (id) {
        await this.loadAdmin(id);
      } else {
        this.admin = null;
      }
    },
    async loadAdmins(): Promise<void> {
      const eventStore = useEventsStore();
      const event = eventStore.getEvent;
      if (!event) {
        return;
      }
      this.admins = await getAdmins(event.id);
    },
    async loadAdmin(id: string): Promise<void> {
      this.admin = await getAdmin(id);
    },
    async setMyAdminId(id: string): Promise<void> {
      this.myAdminId = id;
    },
    async insertAdmin(admin: Omit<AdminInsert, 'eventId'>): Promise<void> {
      if (!this.myAdminId) {
        return;
      }
      const eventStore = useEventsStore();
      const event = eventStore.getEvent;
      if (!event) {
        return;
      }
      const adminWithEvent = { ...admin, eventId: event.id };
      await insertAdmin(adminWithEvent, this.myAdminId);
      await this.loadAdmins();
    },
    async updateAdmin(admin: AdminUpdate): Promise<void> {
      if (!this.myAdminId) {
        return;
      }
      const didUpdate = await updateAdmin(admin, this.myAdminId);
      if (didUpdate) {
        await this.loadAdmins();
        if (this.admin && this.admin.id === admin.id) {
          await this.loadAdmin(admin.id);
        }
      }
    },
  },
});
