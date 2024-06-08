<script lang="ts" setup>
import { useAdminsStore } from '@/stores/admins'
import AddAdmin from '@/components/AddAdmin.vue'

const adminStore = useAdminsStore()
adminStore.loadAdmins()
</script>
<template>
  <div class="flex justify-between px-3 items-center sticky top-0">
    <h1 class="text-lg font-semibold">All Admins</h1>
    <AddAdmin />
  </div>
  <router-link
    v-for="admin of adminStore.getAdmins"
    :key="admin.id"
    :to="`admin/${admin.id}`"
    append
  >
    <div class="flex items-center p-2'">
      {{ admin.name }}
    </div>
  </router-link>
</template>

<style scoped></style>
