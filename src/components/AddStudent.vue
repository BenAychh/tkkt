<script lang="ts" setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '@/stores/students'
import type { StudentInsert } from '@/db/students'

const studentStore = useStudentsStore()

const toast = useToast()
const router = useRouter()

const visible = ref(false)
const studentId = ref('123456')
const studentName = ref('Ben Hernandez')
const inProgress = ref(false)

const addStudent = async () => {
  if (studentId.value.length < 3) {
    toast.add({
      severity: 'error',
      summary: 'Student ID Too Short',
      life: 2000,
      detail: 'Please enter a more descriptive ID'
    })
    return
  }
  if (studentName.value.length < 2) {
    toast.add({
      severity: 'error',
      summary: 'Student Name Too Short',
      life: 2000,
      detail: 'Please enter a more descriptive name'
    })
    return
  }
  const studentInsert: Omit<StudentInsert, 'eventId'> = {
    sid: studentId.value,
    name: studentName.value
  }
  await studentStore.insertStudent(studentInsert)
  toast.add({
    severity: 'success',
    summary: 'Student Added',
    life: 2000,
    detail: `${studentName.value} is ready to buy tickets.`
  })
  visible.value = false
}
</script>

<template>
  <Toast />
  <Button icon="pi pi-plus-circle" iconPos="top" label="Add Student" text @click="visible = true" />

  <Dialog v-model:visible="visible" :style="{ width: '25rem' }" header="Add Student" modal>
    <ProgressBar v-if="inProgress" class="h-1.5" mode="indeterminate"></ProgressBar>
    <div v-else class="h-1.5"></div>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="studentId">Student ID</label>
      <InputText id="studentId" v-model="studentId" />
      <small>Can be text or number (S123456 or 123456)</small>
    </div>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="studentName">Student Name</label>
      <InputText id="studentName" v-model="studentName" />
      <small>FirstName LastName, i.e. Ben Hernandez</small>
    </div>
    <div class="flex justify-end">
      <Button label="Add" @click="addStudent()" />
    </div>
  </Dialog>
</template>

<style scoped></style>
