<script lang="ts" setup>
import { useStudentsStore } from '@/stores/students';
import VirtualScroller from 'primevue/virtualscroller';
import AddStudent from '@/components/AddStudent.vue';
import GeneralHeader from '@/components/EventHeader.vue';
import BulkAddStudent from '@/components/BulkAddStudent.vue';

const studentStore = useStudentsStore();
studentStore.loadStudents();
</script>
<template>
  <GeneralHeader>
    <template #title>All Students</template>
    <template #actions>
      <div>
        <BulkAddStudent />
        <AddStudent />
      </div>
    </template>
  </GeneralHeader>
  <VirtualScroller :itemSize="50" :items="studentStore.getStudents" class="h-[50svh]">
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
