import { defineStore } from 'pinia';
import type { Event, EventWithHistory } from '@/domain/event';
import {
  type EventInsert,
  type EventUpsert,
  getEvent,
  getEvents,
  insertEvent,
  updateEvent,
} from '@/db/events';
import { useAdminsStore } from '@/stores/admins';
import { useStudentsStore } from '@/stores/students';
import { omit } from 'remeda';

interface State {
  events: Event[];
  event: EventWithHistory | null;
  selectedEventId: string | null;
  filterDeleted: boolean;
}

export const useEventsStore = defineStore('events', {
  state: (): State => ({
    events: [],
    event: null,
    selectedEventId: null,
    filterDeleted: true,
  }),
  getters: {
    getEvents(state): Event[] {
      return state.events.filter((event: Event) => !this.filterDeleted || !event.tombstone);
    },
    getEvent(state): EventWithHistory | null {
      if (state.event) {
        return state.event;
      }
      if (state.selectedEventId) {
        const event =
          state.events.find((event: Event) => event.id === state.selectedEventId) || null;
        return event ? { ...event, history: [] } : null;
      }
      return null;
    },
  },
  actions: {
    async loadEvents(): Promise<void> {
      this.events = await getEvents();
    },
    async setSelectedEventId(id: string): Promise<void> {
      if (this.selectedEventId === id) {
        return;
      }
      this.selectedEventId = id;
      const adminStore = useAdminsStore();
      adminStore.$reset();
      const studentStore = useStudentsStore();
      studentStore.$reset();
      if (id) {
        await this.loadEvent(id);
        await adminStore.loadAdmins();
        await studentStore.loadStudents();
      }
    },
    async loadEvent(id: string): Promise<void> {
      this.event = await getEvent(id);
      if (!this.event) {
        return;
      }
      const eventsCopy = [...this.events];
      const index = eventsCopy.findIndex((event: Event) => event.id === id);
      if (index === -1) {
        return;
      }
      eventsCopy[index] = omit(this.event, ['history']);
      this.events = eventsCopy;
    },
    async insertEvent(event: EventInsert): Promise<void> {
      const didInsert = await insertEvent(event);
      if (didInsert) {
        await this.loadEvents();
      }
    },
    async updateEvent(event: EventUpsert): Promise<void> {
      const adminStore = useAdminsStore();
      const user = adminStore.getMyAdminId;
      if (!user) {
        return;
      }
      const didUpdate = await updateEvent(event, user);
      if (didUpdate) {
        await this.loadEvents();
        if (this.event && this.event.id === event.id) {
          await this.loadEvent(event.id);
        }
      }
    },
  },
});
