<script lang="ts" setup>
import { RouterView } from 'vue-router'
import SideBarView from '@/views/SideBarView.vue'
</script>

<template>
  <div class="flex h-full p-2">
    <div class="w-[300px] h-full overflow-auto pr-2">
      <SideBarView></SideBarView>
    </div>
    <div class="flex-1 h-full overflow-auto bg-stone-100 rounded-lg">
      <RouterView />
    </div>
  </div>
</template>

<style scoped></style>
