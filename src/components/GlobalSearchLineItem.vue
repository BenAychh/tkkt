<script lang="ts" setup>
import type { SearchResult } from '@/stores/search';

defineProps<{
  item: SearchResult;
}>();
</script>

<template>
  <RouterLink
    v-if="item.type === 'student'"
    :to="{
      name: 'event.student',
      params: { eventId: item.student.eventId, studentId: item.student.sid },
    }"
  >
    <div class="flex flex-row justify-between items-center gap-6 px-3">
      <div>
        <div class="text-sm text-gray-700">Student</div>
        <div class="text-lg font-semibold mt-2">{{ item.student.name }}</div>
      </div>
      <div v-if="item.student.tickets.length" class="flex gap-3">
        <div
          v-for="ticket of item.student.tickets"
          :key="ticket.id"
          :class="{
            'bg-red-500': ticket.tombstone,
            'bg-green-500': !ticket.tombstone && !ticket.redeemed,
            'bg-slate-100': ticket.redeemed,
            'text-white': ticket.tombstone || (!ticket.tombstone && !ticket.redeemed),
          }"
          class="flex py-1 px-2 rounded"
        >
          <i class="pi pi-receipt !text-4xl" />
          <i v-if="ticket.tombstone" class="pi pi-times !text-4xl" />
          <i v-else-if="ticket.redeemed" class="pi pi-check-circle !text-4xl" />
          <i v-else class="pi pi-circle !text-4xl" />
        </div>
      </div>
      <div v-else>No Tickets</div>
    </div>
  </RouterLink>
  <div v-if="item.type === 'admin'">
    This is a admin
    {{ JSON.stringify(item) }}
  </div>
  <div v-if="item.type === 'event'">
    This is a event
    {{ JSON.stringify(item) }}
  </div>

  <!--  <div class="flex flex-col">-->
  <!--    <div class="md:w-40 relative">-->
  <!--      {{ item.type }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'admin'">-->
  <!--      {{ item.admin.name }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'student'">-->
  <!--      {{ item.student.name }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'event'">-->
  <!--      {{ item.event.name }}-->
  <!--    </div>-->
  <!--  </div>-->
</template>

<style scoped></style>
