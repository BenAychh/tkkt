<script lang="ts" setup></script>

<template>
  <div class="flex justify-between pr-3 my-3 bg-stone-200 items-center">
    <div class="text-lg font-semibold p-2 m-1">
      <slot name="title" />
    </div>
    <slot name="actions" />
  </div>
</template>

<style scoped></style>
