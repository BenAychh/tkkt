<script lang="ts" setup>
import { defineProps } from 'vue'
import { useAdminsStore } from '@/stores/admins'
import type { AdminFull } from '@/domain/admins'

const adminStore = useAdminsStore()
const props = defineProps<{ admin: AdminFull }>()
const saveName = (keyboardEvent: Event) => {
  const target = keyboardEvent.target as HTMLDivElement
  target.blur()
  adminStore.updateAdmin({ id: props.admin.id, name: target.innerText })
}
</script>

<template>
  <div>
    <div v-if="admin" class="p-2 m-1 text-xl rounded" contenteditable @keydown.enter="saveName">
      {{ admin.name }}
    </div>
  </div>
</template>

<style scoped></style>
