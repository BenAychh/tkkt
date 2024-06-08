<script lang="ts" setup>
import { useAdminsStore } from '@/stores/admins';
import Avatar from 'primevue/avatar';
import AddAdmin from '@/components/AddAdmin.vue';

const adminStore = useAdminsStore();
const setMyAdminId = (adminId: string) => {
  adminStore.setMyAdminId(adminId);
};
</script>

<template>
  <div class="flex justify-between items-center">
    <span>Log In</span>
    <AddAdmin />
  </div>
  <div class="flex flex-col gap-3">
    <div
      v-for="admin of adminStore.getAdmins"
      :key="admin.id"
      class="flex items-center cursor-pointer"
      @click="setMyAdminId(admin.id)"
    >
      <Avatar class="mr-2" icon="pi pi-user" size="large" />
      <div>
        {{ admin.name }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
