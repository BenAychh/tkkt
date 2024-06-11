<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import DataView from 'primevue/dataview';
import { ref, watch } from 'vue';
import { useMagicKeys } from '@vueuse/core';
import { useSearchStore } from '@/stores/search';
import GlobalSearchLineItem from '@/components/GlobalSearchLineItem.vue';

const popover = ref();
const input = ref();
const showPopover = (event: Event) => {
  popover.value.show(event);
};
const hidePopover = (event: Event) => {
  popover.value.hide(event);
};

const keys = useMagicKeys();
const controlSpace = keys['Control+Space'];
watch(controlSpace, (value) => {
  if (value) {
    input.value.$el.blur();
    input.value.$el.focus();
  }
});
const searchStore = useSearchStore();
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
        <GlobalSearchLineItem v-for="item in slotProps.items" :key="item.uniqueId" :item="item" />
      </template>
    </DataView>
  </Popover>
</template>

<style scoped></style>
