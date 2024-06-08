<script lang="ts" setup>
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useStudentsStore } from '@/stores/students'
import { uuidv7 } from 'uuidv7'

const confirm = useConfirm()
const toast = useToast()
const studentStore = useStudentsStore()

const confirmTicket = () => {
  confirm.require({
    header: 'Add Ticket?',
    message: `Add A Ticket For ${studentStore.getStudent?.name || 'This Student'}?`,
    icon: 'pi pi-receipt',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Add It!'
    },
    accept: async () => {
      await studentStore.addTicket(uuidv7())
      toast.add({
        severity: 'success',
        summary: 'Ticket Added',
        life: 2000,
        detail: `${studentStore.getStudent?.name} is ready to DANCE!.`
      })
    }
  })
}
</script>
<template>
  <Toast />
  <ConfirmDialog></ConfirmDialog>
  <Button icon="pi pi-plus-circle" iconPos="top" label="Add Ticket" text @click="confirmTicket" />
</template>

<style scoped></style>
