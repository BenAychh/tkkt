<script lang="ts" setup>
import { defineProps } from 'vue'

const props = defineProps<{ date: Date | string | number }>()
const date = new Date(props.date)
</script>

<template></template>

<style scoped></style>
