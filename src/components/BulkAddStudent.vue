<script lang="ts" setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import ProgressBar from 'primevue/progressbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStudentsStore } from '@/stores/students';
import { parse } from 'papaparse';
import { chunk } from 'remeda';
import { useEventsStore } from '@/stores/events';

const studentStore = useStudentsStore();
const eventStore = useEventsStore();

const toast = useToast();

const visible = ref(false);

const inProgressPercent = ref(0);
const students = ref([] as { sid: string; name: string }[]);
const addStudents = async () => {
  if (students.value.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'No Students',
      life: 2000,
      detail: 'Please upload a CSV file with student data',
    });
    return;
  }
  const chunks = chunk(students.value, 100);
  const chunkPercent = +(100 / chunks.length).toFixed(1);
  for (const chunk of chunks) {
    await studentStore.insertStudents(chunk);
    inProgressPercent.value = Math.min(inProgressPercent.value + chunkPercent, 100);
  }
  inProgressPercent.value = 100;
  toast.add({
    severity: 'success',
    summary: 'Students Added',
    life: 2000,
    detail: `${students.value.length} records were inserted or updated.`,
  });
  await eventStore.loadEvents();
  visible.value = false;
};

const onFileChange = (event: Event) => {
  inProgressPercent.value = 0;
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  parse<
    {
      sid: string;
      name: string;
    },
    File
  >(file, {
    header: true,
    worker: true,
    complete: (results) => {
      students.value = results.data.filter((student) => student.sid && student.name);
    },
  });
};
const onShow = () => {
  inProgressPercent.value = 0;
  students.value = [];
};
</script>

<template>
  <Toast />
  <Button
    icon="pi pi-plus-circle"
    iconPos="top"
    label="Bulk Add Student"
    text
    @click="visible = true"
  />

  <Dialog v-model:visible="visible" header="Add Student" modal @show="onShow">
    <ProgressBar :value="inProgressPercent" class="h-1.5"></ProgressBar>
    <input accept="text/csv" name="student csv upload" type="file" @change="onFileChange" />
    <DataTable
      :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      :value="students"
      paginator
      tableStyle="min-width: 50rem"
    >
      <Column field="sid" header="Student ID" style="width: 25%"></Column>
      <Column field="name" header="Name" style="width: 75%"></Column>
    </DataTable>
    <Button
      :disabled="students.length === 0"
      :label="`Add ${students.length} Student(s)`"
      class="mt-3"
      @click="addStudents"
    />
  </Dialog>
</template>

<style scoped></style>
