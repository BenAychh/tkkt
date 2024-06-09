<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { computed, watch } from 'vue';
import BlockUI from 'primevue/blockui';
import { useStudentsStore } from '@/stores/students';
import { useAdminsStore } from '@/stores/admins';
import EventBreadcrumbs from '@/components/EventBreadcrumbs.vue';

const route = useRoute();
const eventStore = useEventsStore();
const adminStore = useAdminsStore();
const studentStore = useStudentsStore();
const eventId = computed(() => {
  const id = route.params.eventId;
  if (Array.isArray(id)) {
    return id[0];
  }
  return id;
});
eventStore.setSelectedEventId(eventId.value);
watch(eventId, () => {
  eventStore.setSelectedEventId(eventId.value);
});
</script>

<template>
  <BlockUI :blocked="!adminStore.getMyAdminId">
    <div class="sticky rounded-br-full top-0 z-10 backdrop-blur !bg-white/90 shadow-md">
      <EventBreadcrumbs
        :event="eventStore.getEvent"
        :routeMatch="route.matched"
        :student="studentStore.getStudent"
      />
    </div>
    <template v-if="eventStore.getEvent">
      <div class="flex flex-col">
        <div class="flex-1">
          <RouterView></RouterView>
        </div>
      </div>
    </template>
  </BlockUI>
</template>

<style scoped></style>
