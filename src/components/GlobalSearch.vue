<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Button from 'primevue/button';
import { ref, watch } from 'vue';
import { useMagicKeys } from '@vueuse/core';

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
    />
  </InputGroup>
  <Popover ref="popover" :dismissable="false">
    <div class="flex flex-col gap-4 w-[25rem]">
      <div>
        <span class="font-medium block mb-2">Share this document</span>
        <InputGroup>
          <InputText
            class="w-[25rem]"
            readonly
            value="https://primevue.org/12323ff26t2g243g423g234gg52hy25XADXAG3"
          ></InputText>
          <InputGroupAddon>
            <i class="pi pi-copy"></i>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div>
        <span class="font-medium block mb-2">Invite Member</span>
        <InputGroup>
          <InputText disabled />
          <Button icon="pi pi-users" label="Invite"></Button>
        </InputGroup>
      </div>
      <div>
        <span class="font-medium block mb-2">Team Members</span>
      </div>
    </div>
  </Popover>
</template>

<style scoped></style>
