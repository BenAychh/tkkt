<script lang="ts" setup>
import { defineProps } from 'vue'
import { type CRDTMessage, deserializeValue } from '@/db/helpers'
import { parseHLC } from '@/sync/hlc'
import AgoOrUntil from '@/components/AgoOrUntil.vue'
import type { Student } from '@/domain/student'

const getChangeMessage = (item: CRDTMessage<Student>, previousState: Student): string => {
  const name = previousState?.name ? previousState.name : 'this student'
  const value = deserializeValue(item.val)
  if (item.col === 'tombstone') {
    return value ? `Deleted ${name}` : `Restored ${name}`
  }
  return `Changed ${item.col} to ${deserializeValue(item.val)}`
}

const props = defineProps<{ history: CRDTMessage<Student>[] }>()
let itemName = `this student`
for (const item of props.history) {
  if (item.col === 'name') {
    itemName = deserializeValue(item.val) as string
    break
  }
}
const groupedByBatchId = props.history.reduce((acc, item: CRDTMessage<Student>) => {
  if (!acc.length) {
    return [[item]]
  }
  const lastBatch = acc[acc.length - 1]
  const lastItem = lastBatch[lastBatch.length - 1]
  if (lastItem.batchId === item.batchId) {
    lastBatch.push(item)
  } else {
    acc.push([item])
  }
  return acc
}, Array<CRDTMessage<Student>[]>())
const states: Record<string, any> = []
groupedByBatchId.forEach((batch, index) => {
  const previousState = index === 0 ? {} : states[index - 1]
  const batchState = batch.reduce((acc, item) => {
    return {
      ...acc,
      [item.col]: deserializeValue(item.val)
    }
  }, previousState)
  states.push(batchState)
})

const historyItems = groupedByBatchId.map((batch, index) => {
  const isCreationBatch = index === 0
  if (isCreationBatch) {
    return {
      key: batch[0].hlc,
      actor: batch[0].actor,
      date: parseHLC(batch[0].hlc).wallClockMs,
      message: `Created ${itemName}`
    }
  }
  const changeMessages = batch.map((item, index) => {
    const previousState = states[index - 1]
    return getChangeMessage(item, previousState)
  })
  return {
    key: batch[0].hlc,
    actor: batch[0].actor,
    date: parseHLC(batch[0].hlc).wallClockMs,
    message: changeMessages.join(', ')
  }
})
</script>

<template>
  <div>
    <div v-for="item in historyItems" :key="item.key" class="mb-3">
      <div>
        <span class="italic text-stone-700"><AgoOrUntil :date="item.date" /></span>
        <span class="font-bold">&nbsp;{{ item.actor }}</span>
      </div>
      <div>
        {{ item.message }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
