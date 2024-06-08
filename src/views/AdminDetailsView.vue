<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import AddTicket from '@/components/AddTicket.vue'
import { useAdminsStore } from '@/stores/admins'
import AdminTitle from '@/components/AdminTitle.vue'
import AdminHistory from '@/components/AdminHistory.vue'

const route = useRoute()
const adminStore = useAdminsStore()
const adminId = computed(() => {
  const id = route.params.adminId
  if (Array.isArray(id)) {
    return id[0]
  }
  return id
})
adminStore.loadAdmin(adminId.value)
watch(adminId, () => {
  adminStore.loadAdmin(adminId.value)
})
</script>

<template>
  <div v-if="adminStore.getAdmin">
    <AdminTitle :admin="adminStore.getAdmin" />
  </div>

  <div class="flex justify-between px-3 items-center">
    <h1 class="text-lg font-semibold">Tickets</h1>
    <AddTicket />
  </div>
  <div class="p-3">
    <AdminHistory v-if="adminStore.getAdmin" :history="adminStore.getAdmin.history" />
  </div>
</template>

<style scoped></style>
