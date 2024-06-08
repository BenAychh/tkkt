<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import { useStudentsStore } from '@/stores/students'
import AddTicket from '@/components/AddTicket.vue'
import StudentTitle from '@/components/StudentTitle.vue'
import TicketDetail from '@/components/TicketDetail.vue'
import StudentHistory from '@/components/StudentHistory.vue'

const route = useRoute()
const studentStore = useStudentsStore()
const studentId = computed(() => {
  const id = route.params.studentId
  if (Array.isArray(id)) {
    return id[0]
  }
  return id
})
studentStore.loadStudent(studentId.value)
watch(studentId, () => {
  studentStore.loadStudent(studentId.value)
})
</script>

<template>
  <div v-if="studentStore.getStudent">
    <StudentTitle :student="studentStore.getStudent" />
  </div>

  <div class="flex justify-between px-3 items-center">
    <h1 class="text-lg font-semibold">Tickets</h1>
    <AddTicket />
  </div>
  <div class="flex flex-row flex-wrap gap-6 px-3">
    <div v-for="ticket in studentStore.getStudent?.tickets" :key="ticket.id" class="relative">
      <TicketDetail :ticket="ticket" />
    </div>
  </div>
  <div class="p-3">
    <StudentHistory v-if="studentStore.getStudent" :history="studentStore.getStudent?.history" />
  </div>
</template>

<style scoped></style>
