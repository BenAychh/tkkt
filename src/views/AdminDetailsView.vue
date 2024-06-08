<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, watch } from 'vue';
import { useAdminsStore } from '@/stores/admins';
import AdminTitle from '@/components/AdminTitle.vue';
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
  <div v-if="adminStore.getAdmin">
    <AdminTitle :admin="adminStore.getAdmin" />
  </div>
  <div class="p-3">
    <div class="mt-6">
      <div class="text-lg font-semibold mb-3">Historical Log</div>
      <NamedHistory
        v-if="adminStore.getAdmin"
        :history="adminStore.getAdmin.history"
        generic-name="this admin"
      />
    </div>
  </div>
</template>

<style scoped></style>
