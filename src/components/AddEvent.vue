<script lang="ts" setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import ProgressBar from 'primevue/progressbar';
import { ref } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import type { EventInsert } from '@/db/events';
import { uuidv7 } from 'uuidv7';

const events = useEventsStore();

const toast = useToast();
const router = useRouter();

const visible = ref(false);
const eventName = ref('');
const maxTickets = ref(null);
const inProgress = ref(false);
const adminName = ref('');

const addEvent = async () => {
  if (!eventName.value) {
    toast.add({
      severity: 'error',
      summary: 'Event Name Required',
      life: 2000,
      detail: 'Please enter a name for the event',
    });
    return;
  }
  if (eventName.value.length < 10) {
    toast.add({
      severity: 'error',
      summary: 'Event Name Too Short',
      life: 2000,
      detail: 'Please enter a more descriptive name',
    });
    return;
  }
  if (maxTickets.value && maxTickets.value < 1) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Ticket Count',
      life: 2000,
      detail: 'Please enter a valid number of tickets',
    });
    return;
  }
  if (!adminName.value && adminName.value.length < 2) {
    toast.add({
      severity: 'error',
      summary: 'Your Name Required',
      life: 2000,
      detail: 'Please enter your name',
    });
    return;
  }
  const upsertEvent: EventInsert = {
    id: uuidv7(),
    name: eventName.value,
    creatorName: adminName.value,
    maxTickets: null,
  };
  if (maxTickets.value) {
    upsertEvent.maxTickets = maxTickets.value;
  }
  await events.insertEvent(upsertEvent);
  toast.add({
    severity: 'success',
    summary: 'Event Added',
    life: 2000,
    detail: 'The event has been added successfully',
  });
  await router.push(`/event/${upsertEvent.id}`);
  visible.value = false;
};
</script>

<template>
  <Toast />
  <Button icon="pi pi-plus-circle" iconPos="top" label="Add Event" text @click="visible = true" />

  <Dialog v-model:visible="visible" :style="{ width: '25rem' }" header="Add Event" modal>
    <ProgressBar v-if="inProgress" class="h-1.5" mode="indeterminate"></ProgressBar>
    <div v-else class="h-1.5"></div>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="eventName">Event Name</label>
      <InputText id="eventName" v-model="eventName" />
      <small>Be descriptive such as Homecoming 2024</small>
    </div>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="maxTickets">Are there a maximum number of tickets?</label>
      <InputNumber v-model="maxTickets" :min="1" inputId="maxTickets" suffix=" tickets" />
      <small>Leave blank for no maximum</small>
    </div>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="studentName">Your Name</label>
      <InputText id="studentName" v-model="adminName" />
      <small>Mr. H, Mr. Hernandez, Coach Rhoden, etc</small>
    </div>
    <div class="flex justify-end">
      <Button label="Add" @click="addEvent()" />
    </div>
  </Dialog>
</template>

<style scoped></style>
