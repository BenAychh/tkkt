<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import DataView from 'primevue/dataview';
import { computed, ref, watch } from 'vue';
import { useMagicKeys } from '@vueuse/core';
import { type StudentSearchResult, useSearchStore } from '@/stores/search';
import GlobalSearchLineItem from '@/components/GlobalSearchLineItem.vue';
import { useRouter } from 'vue-router';

const popover = ref();
const input = ref();
const searchStore = useSearchStore();
const router = useRouter();

const showPopover = (event: Event) => {
  popover.value.show(event);
};
const hidePopover = (event: Event) => {
  // if we clear this out too quickly, it will not be able to be clicked
  setTimeout(() => {
    popover.value.hide(event);
    searchStore.clear();
    input.value.$el.value = '';
  }, 50);
};

const maxCount = computed(() => {
  return searchStore.getResults.length;
});

const selectedIndex = ref(0);

watch(
  () => searchStore.getResults.length,
  () => {
    selectedIndex.value = 0;
  },
);

const arrowDown = () => {
  if (selectedIndex.value < maxCount.value - 1) {
    selectedIndex.value++;
  } else {
    selectedIndex.value = 0;
  }
};

const arrowUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--;
  } else {
    selectedIndex.value = maxCount.value - 1;
  }
};

const goToStudent = (result: StudentSearchResult) => {
  router.push({
    name: 'event.student',
    params: { eventId: result.student.eventId, studentId: result.student.sid },
  });
};

const keys = useMagicKeys();
const controlSpace = keys['Control+Space'];
const arrowDownKey = keys['ArrowDown'];
const arrowUpKey = keys['ArrowUp'];
const enterKey = keys.Enter;
watch(controlSpace, (value) => {
  if (value) {
    input.value.$el.blur();
    input.value.$el.focus();
  }
});
watch(arrowDownKey, (value) => {
  if (value) {
    arrowDown();
  }
});
watch(arrowUpKey, (value) => {
  if (value) {
    arrowUp();
  }
});
watch(enterKey, () => {
  if (selectedIndex.value < searchStore.getResults.length) {
    const item = searchStore.getResults[selectedIndex.value];
    if (item.type === 'student') {
      goToStudent(item);
    }
    input.value.$el.blur();
  }
});
</script>

<template>
  <InputGroup>
    <InputGroupAddon>
      <i class="pi pi-search"></i>
    </InputGroupAddon>
    <InputText
      ref="input"
      placeholder="Control + Space"
      @blur="hidePopover($event)"
      @focus="showPopover($event)"
      @input="searchStore.search($event.target.value)"
    />
  </InputGroup>
  <Popover ref="popover" :dismissable="false">
    <DataView :value="searchStore.getResults">
      <template #list="slotProps">
        <div
          v-for="(item, index) in slotProps.items"
          :key="item.uniqueId"
          :class="{ 'bg-gray-200': index === selectedIndex }"
          class="border-b py-3 border-gray-500 last:border-0 min-w-[40vw]"
        >
          <GlobalSearchLineItem :item="item" />
        </div>
      </template>
    </DataView>
  </Popover>
</template>

<style scoped></style>
