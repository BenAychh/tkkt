<script lang="ts" setup>
import { defineProps } from 'vue'
import type { StudentFull } from '@/domain/student'
import { useStudentsStore } from '@/stores/students'

const studentStore = useStudentsStore()
const props = defineProps<{ student: StudentFull }>()
const saveName = (keyboardEvent: Event) => {
  const target = keyboardEvent.target as HTMLDivElement
  target.blur()
  studentStore.upsertStudent({ sid: props.student.sid, name: target.innerText.trim() })
}
</script>

<template>
  <div>
    <div v-if="student" class="p-2 m-1 text-xl rounded" contenteditable @keydown.enter="saveName">
      {{ student.name }}
    </div>
  </div>
</template>

<style scoped></style>
