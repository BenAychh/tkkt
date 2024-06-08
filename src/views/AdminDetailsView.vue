<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, watch } from 'vue';
import { useAdminsStore } from '@/stores/admins';
import NamedHistory from '@/components/NamedHistory.vue';

const route = useRoute();
const adminStore = useAdminsStore();
const adminId = computed(() => {
  const id = route.params.adminId;
  if (Array.isArray(id)) {
    return id[0];
  }
  return id;
});
adminStore.setSelectedAdminId(adminId.value);
watch(adminId, () => {
  adminStore.setSelectedAdminId(adminId.value);
});
</script>

<template>
  <NamedHistory
    v-if="adminStore.getAdmin"
    :admins="adminStore.getAdmins"
    :history="adminStore.getAdmin.history"
    generic-name="this admin"
  />
</template>

<style scoped></style>
