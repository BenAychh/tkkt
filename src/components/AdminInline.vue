<script lang="ts" setup>
import { useAdminsStore } from '@/stores/admins';
import { computed } from 'vue';

const adminStore = useAdminsStore();
const props = defineProps<{ adminId: string }>();
const admin = computed(() => {
  const admins = adminStore.admins;
  return admins.find((admin) => admin.id === props.adminId);
});
</script>

<template>
  <span v-if="!!admin" class="font-bold">
    {{ admin.name }}
  </span>
  <span v-else> {{ props.adminId }} </span>
</template>

<style scoped></style>
