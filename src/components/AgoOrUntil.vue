<script lang="ts" setup>
import { defineProps } from 'vue'
import { agoOrUntil } from '@/helpers/time'

const props = defineProps<{ date: Date | string | number }>()
const date = new Date(props.date)
const dateFormatted = date.toLocaleString()
const humanized = agoOrUntil(date)
</script>

<template>
  <span v-tooltip.top="dateFormatted">{{ humanized }}</span>
</template>
r

<style scoped></style>
