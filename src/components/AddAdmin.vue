<script lang="ts" setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { AdminInsert } from '@/db/admins'
import { uuidv7 } from 'uuidv7'
import { useAdminsStore } from '@/stores/admins'

const adminStore = useAdminsStore()

const toast = useToast()

const visible = ref(false)
const adminName = ref('Ben Hernandez')

const addAdmin = async () => {
  if (adminName.value.length < 2) {
    toast.add({
      severity: 'error',
      summary: 'Name Too Short',
      life: 2000,
      detail: 'Please use at least 2 characters for the name.'
    })
    return
  }
  const adminInsert: Omit<AdminInsert, 'eventId'> = {
    id: uuidv7(),
    name: adminName.value
  }
  await adminStore.insertAdmin(adminInsert)
  toast.add({
    severity: 'success',
    summary: 'Admin Added',
    life: 2000,
    detail: `${adminName.value} is ready to sell tickets.`
  })
  visible.value = false
}
</script>

<template>
  <Toast />
  <Button icon="pi pi-plus-circle" iconPos="top" label="Add Admin" text @click="visible = true" />

  <Dialog v-model:visible="visible" :style="{ width: '25rem' }" header="Add Student" modal>
    <div class="flex flex-col align-items-center gap-3 mb-3">
      <label for="studentName">Admin Name</label>
      <InputText id="studentName" v-model="adminName" />
      <small>Mr. H, Mr. Hernandez, Coach Rhoden, etc</small>
    </div>
    <div class="flex justify-end">
      <Button label="Add" @click="addAdmin()" />
    </div>
  </Dialog>
</template>

<style scoped></style>
