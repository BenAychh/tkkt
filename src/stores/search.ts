import type { Admin } from '@/domain/admins';
import { defineStore } from 'pinia';
import type { Student, Ticket } from '@/domain/student';
import type { Event } from '@/domain/event';
import { search } from '@/db/search';
import { useEventsStore } from '@/stores/events';

interface BaseSearchResult {
  uniqueId: string;
  type: 'student' | 'admin' | 'event';
  jaroWinklerScore: number;
}

export interface StudentSearchResult extends BaseSearchResult {
  type: 'student';
  student: Student & { tickets: Ticket[] };
}

export interface AdminSearchResult extends BaseSearchResult {
  type: 'admin';
  admin: Admin;
}

export interface EventSearchResult extends BaseSearchResult {
  type: 'event';
  event: Event;
}

export type SearchResult = StudentSearchResult | AdminSearchResult | EventSearchResult;

interface State {
  results: SearchResult[];
  searchTerm: string | null;
}

export const useSearchStore = defineStore('search', {
  state: (): State => ({
    results: [],
    searchTerm: '',
  }),
  getters: {
    getResults(state): SearchResult[] {
      return state.results;
    },
    getSearchTerm(state): string | null {
      return state.searchTerm;
    },
  },
  actions: {
    async search(searchTerm: string): Promise<void> {
      this.searchTerm = searchTerm;
      if (!searchTerm) {
        this.results = [];
        return;
      }
      const eventStore = useEventsStore();
      const event = eventStore.getEvent;
      this.results = (await search(searchTerm, event?.id ?? '')) || [];
    },
    async clear() {
      this.results = [];
      this.searchTerm = '';
    },
  },
  debounce: {
    // almost no debounce, just a tiny bit for a hand-held scanner
    search: [25],
  },
});
