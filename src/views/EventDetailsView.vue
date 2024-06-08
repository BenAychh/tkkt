<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { computed, watch } from 'vue';
import EventTitle from '@/components/EventTitle.vue';
import BlockUI from 'primevue/blockui';
import Divider from 'primevue/divider';
import { useStudentsStore } from '@/stores/students';
import Breadcrumb from 'primevue/breadcrumb';
import Login from '@/components/LoginAdmin.vue';
import { useAdminsStore } from '@/stores/admins';
import Dialog from 'primevue/dialog';

const route = useRoute();
const eventStore = useEventsStore();
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
const home = computed(() => {
  const event = eventStore.getEvent;
  return {
    route: event ? { name: 'event', params: { eventId: event?.id } } : null,
    label: event?.name || 'Event',
  };
});
const items = computed(() => {
  const matched = route.matched;
  const containsStudents = matched.some((record) => record.name === 'event.students');
  if (containsStudents) {
    return [
      {
        label: 'Students',
        route: { name: 'event.students', params: { eventId: eventStore.getEvent?.id } },
      },
    ];
  }
  const containsStudent = matched.some((record) => record.name === 'event.student');
  if (containsStudent) {
    return [
      {
        label: 'Students',
        route: { name: 'event.students', params: { eventId: eventStore.getEvent?.id } },
      },
      {
        label: studentStore.getStudent?.name || 'Student',
        route: {
          name: 'event.student',
          params: { eventId: eventStore.getEvent?.id, studentId: studentStore.getStudent?.sid },
        },
      },
    ];
  }
  return [];
});
const adminStore = useAdminsStore();
const showLogin = computed(() => !adminStore.getMyAdminId && !!eventStore.getEvent);
</script>

<template>
  <BlockUI :blocked="!adminStore.getMyAdminId">
    <Breadcrumb :home="home" :model="items">
      <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
      </template>
    </Breadcrumb>
    <template v-if="eventStore.getEvent">
      <div class="flex flex-col">
        <div class="flex-grow-0">
          <EventTitle :event="eventStore.getEvent" />
        </div>
        <Divider />
        <div class="flex-1">
          <RouterView></RouterView>
        </div>
      </div>
    </template>
  </BlockUI>
  <Dialog v-model:visible="showLogin" class="w-1/2">
    <template #container>
      <div class="p-6">
        <Login />
      </div>
    </template>
  </Dialog>
</template>

<style scoped></style>
