<script lang="ts" setup>
import type { SearchResult } from '@/stores/search';

defineProps<{
  item: SearchResult;
}>();
</script>

<template>
  <div>
    {{ JSON.stringify(item) }}
  </div>

  <!--  <div class="flex flex-col">-->
  <!--    <div class="md:w-40 relative">-->
  <!--      {{ item.type }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'admin'">-->
  <!--      {{ item.admin.name }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'student'">-->
  <!--      {{ item.student.name }}-->
  <!--    </div>-->
  <!--    <div v-if="item.type === 'event'">-->
  <!--      {{ item.event.name }}-->
  <!--    </div>-->
  <!--  </div>-->
</template>

<style scoped></style>
