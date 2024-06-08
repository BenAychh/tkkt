<script lang="ts" setup>
import type { Event } from '@/domain/event';
import type { StudentFull } from '@/domain/student';
import type { RouteLocationMatched } from 'vue-router';
import { computed } from 'vue';
import Breadcrumb from 'primevue/breadcrumb';
import Dialog from 'primevue/dialog';
import AdminInline from '@/components/AdminInline.vue';
import { useAdminsStore } from '@/stores/admins';
import LoginAdmin from '@/components/LoginAdmin.vue';

const adminStore = useAdminsStore();
const props = defineProps<{
  event: Event | null;
  student: StudentFull | null;
  routeMatch: RouteLocationMatched[] | null;
}>();
const home = computed(() => {
  return {
    route: props.event ? { name: 'event', params: { eventId: props.event?.id } } : null,
    label: props.event?.name || 'Event',
  };
});
const items = computed(() => {
  if (!props.routeMatch || !props.event) {
    return [];
  }
  const containsStudents = props.routeMatch.some((record) => record.name === 'event.students');
  if (containsStudents) {
    return [
      {
        label: 'Students',
        route: { name: 'event.students', params: { eventId: props.event.id } },
      },
    ];
  }
  const containsStudent = props.routeMatch.some((record) => record.name === 'event.student');
  if (containsStudent && props.student) {
    return [
      {
        label: 'Students',
        route: { name: 'event.students', params: { eventId: props.event.id } },
      },
      {
        label: props.student.name || 'Student',
        route: {
          name: 'event.student',
          params: { eventId: props.event.id, studentId: props.student.sid },
        },
      },
    ];
  }
  const containsAdmins = props.routeMatch.some((record) => record.name === 'event.admins');
  if (containsAdmins) {
    return [
      {
        label: 'Admins',
        route: { name: 'event.admins', params: { eventId: props.event.id } },
      },
    ];
  }
  const containsAdmin = props.routeMatch.some((record) => record.name === 'event.admin');
  if (containsAdmin && adminStore.getAdmin) {
    return [
      {
        label: 'Admins',
        route: { name: 'event.admins', params: { eventId: props.event.id } },
      },
      {
        label: adminStore.getAdmin.name || 'Admin',
        route: {
          name: 'event.admin',
          params: { eventId: props.event.id, adminId: adminStore.getAdmin.id },
        },
      },
    ];
  }
  return [];
});
const clearMyAdminId = () => {
  adminStore.setMyAdminId(null);
};
const showLogin = computed(() => !adminStore.getMyAdminId);
</script>

<template>
  <div
    v-if="adminStore.getMyAdminId"
    class="text-center text-stone-600 absolute top-0 right-5 cursor-pointer"
    @click="clearMyAdminId"
  >
    Logged in as
    <AdminInline :admin-id="adminStore.getMyAdminId"></AdminInline>
  </div>
  <Breadcrumb :home="home" :model="items" :pt:root:style:background="'transparent'">
    <template #item="{ item, props }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" @click="navigate">
          <span class="text-primary font-semibold">{{ item.label }}</span>
        </a>
      </router-link>
    </template>
  </Breadcrumb>
  <Dialog v-model:visible="showLogin" class="w-1/2">
    <template #container>
      <div class="p-6">
        <LoginAdmin />
      </div>
    </template>
  </Dialog>
</template>

<style scoped></style>
