import { defineStore } from 'pinia'
import type { Event, EventWithHistory } from '@/domain/event'
import { type EventUpsert, getEvent, getEvents, upsertEvent } from '@/db/events'
import { omit } from 'remeda'

interface State {
  events: Event[]
  event: EventWithHistory | null
  filterDeleted: boolean
}

export const useEventsStore = defineStore('events', {
  state: (): State => ({
    events: [],
    event: null,
    filterDeleted: true
  }),
  getters: {
    getEvents(state): Event[] {
      return state.events.filter((event: Event) => !this.filterDeleted || !event.tombstone)
    },
    getEvent(state): EventWithHistory | null {
      return state.event
    }
  },
  actions: {
    async loadEvents(): Promise<void> {
      this.events = await getEvents()
    },
    async loadEvent(id: string): Promise<void> {
      this.event = await getEvent(id)
      if (!this.event) {
        return
      }
      const eventsCopy = [...this.events]
      const index = eventsCopy.findIndex((event: Event) => event.id === id)
      if (index === -1) {
        return
      }
      eventsCopy[index] = omit(this.event, ['history'])
      this.events = eventsCopy
    },
    async upsertEvent(event: EventUpsert): Promise<void> {
      const didUpdate = await upsertEvent(event, 'user')
      if (didUpdate) {
        await this.loadEvents()
        if (this.event && this.event.id === event.id) {
          await this.loadEvent(event.id)
        }
      }
    }
  }
})
