<script lang="ts" setup>
import { useEventsStore } from '@/stores/events';
import AddEvent from '@/components/AddEvent.vue';
import GlobalSearch from '@/components/GlobalSearch.vue';

const eventStore = useEventsStore();
eventStore.loadEvents();
const studentCountFormatted = (count: number) => {
  if (count === 1) {
    return `${count} Student`;
  }
  return `${count} Students`;
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Events</h1>
      <AddEvent />
    </div>
    <GlobalSearch />
    <div v-for="evt of eventStore.getEvents" :key="evt.id">
      <router-link :to="'/event/' + evt.id">
        <h2 class="text-lg font-bold text-blue-500">{{ evt.name }}</h2>
        <div>
          {{ evt.ticketSold }}
          <template v-if="evt.maxTickets"> / {{ evt.maxTickets }}</template>
          <template v-if="evt.ticketSold !== 1"> Tickets</template>
          <template v-else> Ticket</template>
          Sold
        </div>
        <router-link :to="'/event/' + evt.id + '/students'">
          {{ studentCountFormatted(evt.studentCount) }}
        </router-link>
      </router-link>
    </div>
  </div>
</template>

<style scoped></style>
