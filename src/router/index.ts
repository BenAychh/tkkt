import { createRouter, createWebHistory } from 'vue-router'
import MainApp from '@/views/MainApp.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/app',
      component: MainApp,
      children: [
        {
          path: '/event/:eventId',
          name: 'event',
          component: () => import('@/views/EventDetailsView.vue'),
          redirect: { name: 'event.dashboard' },
          children: [
            {
              path: 'dashboard',
              name: 'event.dashboard',
              component: () => import('@/views/EventDetailsDashboardView.vue')
            },
            {
              path: 'admins',
              name: 'admins',
              component: () => import('@/views/AdminListView.vue')
            },
            // {
            //   path: 'admin/:adminId',
            //   name: 'admin',
            //   component: () => import('@/views/AdminDetailsView.vue')
            // },
            {
              path: 'students',
              name: 'event.students',
              component: () => import('@/views/StudentListView.vue')
            },
            {
              path: 'student/:studentId',
              name: 'event.student',
              component: () => import('@/views/StudentDetailsView.vue')
            }
          ]
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/app'
    }
  ]
})

export default router
