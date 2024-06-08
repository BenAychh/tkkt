<script lang="ts" setup>
import Card from 'primevue/card'
</script>
<template>
  <div class="flex flex-wrap px-3 gap-6">
    <router-link to="students">
      <Card style="width: 25rem; overflow: hidden">
        <template #header>
          <img alt="user header" src="@/assets/images/students_with_rose.jpg" />
        </template>
        <template #title>Students</template>
        <template #subtitle>Manage Students and Ticket</template>
        <template #content>
          <p class="m-0">View your students, sell and redeem tickets</p>
        </template>
      </Card>
    </router-link>
    <router-link to="admins">
      <Card style="width: 25rem; overflow: hidden">
        <template #header>
          <img alt="user header" src="@/assets/images/teachers_strategy.jpg" />
        </template>
        <template #title>Admin</template>
        <template #subtitle>Manage Admins</template>
        <template #content>
          <p class="m-0">Add and remove folks who are selling and redeeming ticket</p>
        </template>
      </Card>
    </router-link>
  </div>
</template>

<style scoped></style>
