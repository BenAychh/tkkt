<script lang="ts" setup>
import { useAdminsStore } from '@/stores/admins';
import AddAdmin from '@/components/AddAdmin.vue';
import EventHeader from '@/components/EventHeader.vue';
import Avatar from 'primevue/avatar';

const adminStore = useAdminsStore();
</script>
<template>
  <EventHeader>
    <template #title>All Admins</template>
    <template #actions>
      <AddAdmin />
    </template>
  </EventHeader>
  <div class="px-3">
    <router-link
      v-for="admin of adminStore.getAdmins"
      :key="admin.id"
      :to="`admin/${admin.id}`"
      append
      class="flex items-center"
    >
      <Avatar class="mr-2" icon="pi pi-user" size="large" />
      <div>
        {{ admin.name }}
      </div>
    </router-link>
  </div>
</template>

<style scoped></style>
