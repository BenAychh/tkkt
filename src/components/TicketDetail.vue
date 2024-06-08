<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import SplitButton from 'primevue/splitbutton'
import Dialog from 'primevue/dialog'
import type { TicketWithHistory } from '@/domain/student'
import { useStudentsStore } from '@/stores/students'
import History from '@/components/TicketHistory.vue'

const toast = useToast()
const studentStore = useStudentsStore()

const props = defineProps<{ ticket: TicketWithHistory }>()
const unredeem = async () => {
  await studentStore.updateTicket({ id: props.ticket.id, redeemed: false })
  toast.add({
    severity: 'success',
    summary: 'Unredeemed',
    detail: 'Ticket Unredeemed',
    life: 3000
  })
}
const redeem = async () => {
  await studentStore.updateTicket({ id: props.ticket.id, redeemed: true })
  toast.add({
    severity: 'success',
    summary: 'Redeemed',
    detail: 'Ticket Redeemed',
    life: 3000
  })
}
const restore = async () => {
  await studentStore.updateTicket({ id: props.ticket.id, tombstone: false })
  toast.add({
    severity: 'success',
    summary: 'Restored',
    detail: 'Ticket Restored',
    life: 3000
  })
}
const deleteTicket = async () => {
  await studentStore.updateTicket({ id: props.ticket.id, tombstone: true })
  toast.add({
    severity: 'warn',
    summary: 'Deleted',
    detail: 'Ticket Deleted',
    life: 3000
  })
}
const historyVisible = ref(false)
const items = computed(() => {
  const itemList = []
  if (!props.ticket.tombstone) {
    if (props.ticket.redeemed) {
      itemList.push({
        label: 'Unredeem',
        icon: 'pi pi-check',
        command: unredeem
      })
    } else if (!props.ticket.tombstone) {
      itemList.push({
        label: 'Redeem',
        icon: 'pi pi-check-circle',
        command: redeem
      })
    }
    itemList.push({
      label: 'Delete',
      icon: 'pi pi-trash',
      command: deleteTicket
    })
  }
  if (props.ticket.tombstone) {
    itemList.push({
      label: 'Restore',
      icon: 'pi pi-undo',
      command: restore
    })
  }

  itemList.push({
    label: 'History',
    icon: 'pi pi-history',
    command: () => {
      historyVisible.value = true
    }
  })
  return itemList
})
const actOnTicket = async () => {
  if (props.ticket.tombstone) {
    return
  }
  if (props.ticket.redeemed) {
    return null
  } else {
    return redeem()
  }
}
</script>

<template>
  <SplitButton
    :model="items"
    :severity="ticket.tombstone ? 'danger' : ticket.redeemed ? 'secondary' : 'success'"
    icon="pi pi-check"
    @click="actOnTicket"
  >
    <i class="pi pi-receipt" style="font-size: 3rem" />
    <i v-if="ticket.tombstone" class="pi pi-times" style="font-size: 3rem" />
    <i v-else-if="ticket.redeemed" class="pi pi-check-circle" style="font-size: 3rem" />
    <i v-else class="pi pi-circle" style="font-size: 3rem" />
  </SplitButton>
  <Dialog v-model:visible="historyVisible" header="Ticket History" maximizable modal>
    <History :history="ticket.history" />
  </Dialog>
</template>

<style scoped></style>
