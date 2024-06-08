<script lang="ts" setup>
import type { EventWithHistory } from '@/domain/event';
import { defineProps } from 'vue';
import { useEventsStore } from '@/stores/events';

const eventStore = useEventsStore();
const props = defineProps<{ event: EventWithHistory }>();
const saveName = (keyboardEvent: Event) => {
  const target = keyboardEvent.target as HTMLDivElement;
  target.blur();
  eventStore.updateEvent({ id: props.event!.id, name: target.innerText.trim() });
};
</script>

<template>
  <div>
    <div v-if="event" class="p-2 m-1 text-xl rounded" contenteditable @keydown.enter="saveName">
      {{ event.name }}
    </div>
  </div>
</template>

<style scoped></style>
