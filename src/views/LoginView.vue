<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'
import { APP_NAME, IS_CONFIGURED } from '@/lib/app-config'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher.vue'
import { Car, Mail, Lock, User } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const displayName = ref('')
const color = ref('#3b82f6')

/** Offered at sign-up so each person is distinguishable in the week view. */
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

async function handleSubmit() {
  const success = isRegister.value
    ? await authStore.signUp(email.value, password.value, displayName.value, color.value)
    : await authStore.signIn(email.value, password.value)

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-(--color-background)">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-primary) mb-4">
          <Car class="w-8 h-8 text-(--color-primary-foreground)" />
        </div>
        <h1 class="text-2xl font-bold text-(--color-foreground)">
          {{ APP_NAME }}
        </h1>
        <p class="text-(--color-muted-foreground) mt-1">
          {{ isRegister ? t('auth.createAccount') : t('auth.signIn') }}
        </p>
      </div>

      <div
        v-if="!IS_CONFIGURED"
        class="mb-6 p-3 rounded-lg bg-(--color-destructive)/10 text-(--color-destructive) text-sm"
      >
        {{ t('errors.missingConfig') }}
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div
          v-if="isRegister"
          class="space-y-4"
        >
          <div>
            <label
              for="display-name"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('auth.name') }}
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-muted-foreground)" />
              <input
                id="display-name"
                v-model="displayName"
                type="text"
                :placeholder="t('auth.namePlaceholder')"
                required
                class="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
            </div>
          </div>

          <div>
            <span class="block text-sm font-medium mb-1.5">{{ t('auth.calendarColour') }}</span>
            <div class="flex gap-2">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                :aria-label="c"
                :aria-pressed="color === c"
                class="w-8 h-8 rounded-full transition-transform"
                :class="color === c ? 'ring-2 ring-offset-2 ring-(--color-foreground) scale-110' : ''"
                :style="{ backgroundColor: c }"
                @click="color = c"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            for="email"
            class="block text-sm font-medium mb-1.5"
          >{{ t('auth.email') }}</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-muted-foreground)" />
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              :placeholder="t('auth.emailPlaceholder')"
              required
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium mb-1.5"
          >
            {{ t('auth.password') }}
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-muted-foreground)" />
            <input
              id="password"
              v-model="password"
              type="password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              placeholder="••••••••"
              required
              minlength="6"
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>
        </div>

        <p
          v-if="authStore.error"
          class="p-3 rounded-lg bg-(--color-destructive)/10 text-(--color-destructive) text-sm"
        >
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-2.5 px-4 rounded-lg bg-(--color-primary) text-(--color-primary-foreground) font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {{ authStore.loading ? t('auth.loading') : (isRegister ? t('auth.signUp') : t('auth.signIn')) }}
        </button>
      </form>

      <p class="text-center text-sm text-(--color-muted-foreground) mt-6">
        {{ isRegister ? t('auth.haveAccount') : t('auth.noAccount') }}
        <button
          type="button"
          class="text-(--color-primary) font-medium ml-1"
          @click="isRegister = !isRegister"
        >
          {{ isRegister ? t('auth.signIn') : t('auth.signUp') }}
        </button>
      </p>

      <div class="flex justify-center mt-8">
        <LocaleSwitcher />
      </div>
    </div>
  </div>
</template>
