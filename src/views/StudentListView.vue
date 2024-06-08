<script lang="ts" setup>
import { useStudentsStore } from '@/stores/students'
import VirtualScroller from 'primevue/virtualscroller'
import AddStudent from '@/components/AddStudent.vue'

const studentStore = useStudentsStore()
studentStore.loadStudents()
</script>
<template>
  <div class="flex justify-between px-3 items-center sticky top-0">
    <h1 class="text-lg font-semibold">All Students</h1>
    <AddStudent />
  </div>
  <VirtualScroller :delay="150" :itemSize="50" :items="studentStore.getStudents">
    <template v-slot:item="{ item, options }">
      <router-link :to="`student/${item.sid}`" append>
        <div
          :class="['flex items-center p-2', { 'bg-surface-100 dark:bg-surface-700': options.odd }]"
          style="height: 50px"
        >
          {{ item.name }}
        </div>
      </router-link>
    </template>
  </VirtualScroller>
</template>

<style scoped></style>
