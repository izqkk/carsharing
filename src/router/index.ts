import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/booking/new',
      name: 'booking-new',
      component: () => import('@/views/BookingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/booking/:id',
      name: 'booking-edit',
      component: () => import('@/views/BookingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recurring',
      name: 'recurring',
      component: () => import('@/views/RecurringView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recurring/new',
      name: 'recurring-new',
      component: () => import('@/views/RecurringFormView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recurring/:id',
      name: 'recurring-edit',
      component: () => import('@/views/RecurringFormView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'calendar' }
  }
})

export default router
