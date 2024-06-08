<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { type CRDTMessage } from '@/db/helpers';
import AgoOrUntil from '@/components/AgoOrUntil.vue';
import { namedHistoryMaker, type NamedThing } from '@/helpers/historyMaker';
import AdminInline from '@/components/AdminInline.vue';
import GeneralHeader from '@/components/EventHeader.vue';
import type { Admin } from '@/domain/admins';

const props = defineProps<{
  history: CRDTMessage<NamedThing>[];
  genericName: string;
  admins: Admin[];
}>();
const historyItems = computed(() => {
  return namedHistoryMaker(props.history, props.genericName);
});
</script>

<template>
  <div>
    <GeneralHeader>
      <template #title>Historical Log</template>
    </GeneralHeader>
    <div v-for="item in historyItems" :key="item.key" class="mb-3 px-3">
      <div>
        <span class="italic text-stone-700"><AgoOrUntil :date="item.date" /></span>
        &nbsp;<AdminInline :adminId="item.actor" :admins="admins" />
      </div>
      <div>
        {{ item.message }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
