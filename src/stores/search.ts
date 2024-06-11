import type { Admin } from '@/domain/admins';
import { defineStore } from 'pinia';
import type { Student } from '@/domain/student';
import type { Event } from '@/domain/event';
import { search } from '@/db/search';
import { useEventsStore } from '@/stores/events';

interface BaseSearchResult {
  uniqueId: string;
  type: 'student' | 'admin' | 'event';
  jaroWinklerScore: number;
}

interface StudentSearchResult extends BaseSearchResult {
  type: 'student';
  student: Student;
}

interface AdminSearchResult extends BaseSearchResult {
  type: 'admin';
  admin: Admin;
}

interface EventSearchResult extends BaseSearchResult {
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
  },
  debounce: {
    // you can pass an array of arguments if your debounce implementation accepts extra arguments
    search: [
      100,
      {
        // options passed to debounce
        isImmediate: true,
      },
    ],
  },
});
