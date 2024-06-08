<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, watch } from 'vue';
import { useStudentsStore } from '@/stores/students';
import AddTicket from '@/components/AddTicket.vue';
import TicketDetail from '@/components/TicketDetail.vue';
import NamedHistory from '@/components/NamedHistory.vue';
import EventHeader from '@/components/EventHeader.vue';
import { useAdminsStore } from '@/stores/admins';

const route = useRoute();
const studentStore = useStudentsStore();
const adminStore = useAdminsStore();
const studentId = computed(() => {
  const id = route.params.studentId;
  if (Array.isArray(id)) {
    return id[0];
  }
  return id;
});
studentStore.loadStudent(studentId.value);
watch(studentId, () => {
  studentStore.loadStudent(studentId.value);
});
</script>

<template>
  <EventHeader v-if="studentStore.getStudent">
    <template #title> Tickets</template>
    <template #actions>
      <AddTicket />
    </template>
  </EventHeader>

  <div class="flex justify-between px-3 items-center"></div>
  <div class="flex flex-row flex-wrap gap-6 px-3">
    <div v-for="ticket in studentStore.getStudent?.tickets" :key="ticket.id" class="relative">
      <TicketDetail :ticket="ticket" />
    </div>
  </div>
  <NamedHistory
    v-if="studentStore.student"
    :admins="adminStore.getAdmins"
    :history="studentStore.student.history"
    class="w-full"
    generic-name="this event"
  />
</template>

<style scoped></style>
