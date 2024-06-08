<script lang="ts" setup>
import { useRealTimeHistory } from '@/stores/crdtHistory'
import Timeline from 'primevue/timeline'

const history = useRealTimeHistory()
history.loadHistoryItems()
</script>

<template>
  <Timeline :value="history.getItems">
    <template #opposite="slotProps">
      <small class="text-surface-500 dark:text-surface-400">{{ slotProps.item.timestamp }}</small>
    </template>
    <template #content="slotProps">
      {{ slotProps.item.text }}
    </template>
  </Timeline>
</template>

<style scoped></style>
