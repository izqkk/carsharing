<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOfflineStore } from '@/stores/offline'
import { useI18n } from '@/i18n'
import { defaultQuickTitles, loadQuickTitles, saveQuickTitles } from '@/lib/quick-titles'
import AppLayout from '@/components/layout/AppLayout.vue'
import Avatar from '@/components/ui/Avatar.vue'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher.vue'
import { LogOut, Wifi, WifiOff, RefreshCw, Repeat, ChevronRight, Camera, Plus, X } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()
const offlineStore = useOfflineStore()
const { t, tp, locale } = useI18n()

const displayName = ref('')
const color = ref('#3b82f6')
const avatarUrl = ref<string | null>(null)
const loading = ref(false)
const saved = ref(false)
const uploadingAvatar = ref(false)

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const quickTitles = ref<string[]>([])
const newTitle = ref('')
const showTitleInput = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (authStore.profile) {
    displayName.value = authStore.profile.display_name
    color.value = authStore.profile.color
    avatarUrl.value = authStore.profile.avatar_url || null
  }

  quickTitles.value = loadQuickTitles(locale.value)
})

function addQuickTitle() {
  const title = newTitle.value.trim()
  if (title && !quickTitles.value.includes(title)) {
    quickTitles.value.push(title)
    saveQuickTitles(quickTitles.value)
  }
  newTitle.value = ''
  showTitleInput.value = false
}

function removeQuickTitle(index: number) {
  quickTitles.value.splice(index, 1)
  saveQuickTitles(quickTitles.value)
}

function resetQuickTitles() {
  quickTitles.value = defaultQuickTitles(locale.value)
  saveQuickTitles(quickTitles.value)
}

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingAvatar.value = true
  const url = await authStore.uploadAvatar(file)
  if (url) {
    avatarUrl.value = url
    await authStore.updateProfile(displayName.value, color.value, url)
  }
  uploadingAvatar.value = false
  // Clear the picker so re-selecting the same file fires `change` again.
  input.value = ''
}

async function handleSave() {
  loading.value = true
  const success = await authStore.updateProfile(displayName.value, color.value, avatarUrl.value)
  loading.value = false
  if (success) {
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  }
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <header class="p-4 border-b">
        <h1 class="text-lg font-semibold">
          {{ t('profile.title') }}
        </h1>
      </header>

      <div class="flex-1 p-4 space-y-6 overflow-auto">
        <div class="flex items-center gap-4">
          <div class="relative">
            <Avatar
              :src="avatarUrl"
              :name="displayName"
              :color="color"
              size="xl"
            />
            <button
              type="button"
              :aria-label="t('profile.changePhoto')"
              :disabled="uploadingAvatar"
              class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-(--color-primary) text-(--color-primary-foreground) flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-50"
              @click="fileInput?.click()"
            >
              <Camera class="w-4 h-4" />
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarUpload"
            >
          </div>
          <div>
            <p class="font-medium">
              {{ displayName || t('profile.unknownUser') }}
            </p>
            <p class="text-sm text-(--color-muted-foreground)">
              {{ authStore.user?.email }}
            </p>
            <p
              v-if="uploadingAvatar"
              class="text-xs text-(--color-primary) mt-1"
            >
              {{ t('profile.uploadingPhoto') }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="profile-name"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('profile.name') }}
            </label>
            <input
              id="profile-name"
              v-model="displayName"
              type="text"
              class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>

          <div>
            <span class="block text-sm font-medium mb-1.5">{{ t('profile.calendarColour') }}</span>
            <div class="flex gap-2">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                :aria-label="c"
                :aria-pressed="color === c"
                class="w-10 h-10 rounded-full transition-transform"
                :class="color === c ? 'ring-2 ring-offset-2 ring-(--color-foreground) scale-110' : ''"
                :style="{ backgroundColor: c }"
                @click="color = c"
              />
            </div>
          </div>

          <button
            type="button"
            :disabled="loading"
            class="w-full py-2.5 px-4 rounded-lg bg-(--color-primary) text-(--color-primary-foreground) font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            @click="handleSave"
          >
            {{ saved ? t('actions.saved') : (loading ? t('actions.saving') : t('actions.save')) }}
          </button>
        </div>

        <div class="border-t pt-6">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium">{{ t('profile.quickTitles') }}</span>
            <button
              type="button"
              class="text-xs text-(--color-muted-foreground) hover:text-(--color-foreground)"
              @click="resetQuickTitles"
            >
              {{ t('actions.reset') }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="(quick, index) in quickTitles"
              :key="quick"
              class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-(--color-muted) text-sm"
            >
              <span>{{ quick }}</span>
              <button
                type="button"
                :aria-label="`${t('actions.delete')}: ${quick}`"
                class="p-0.5 rounded-full hover:bg-(--color-background)"
                @click="removeQuickTitle(index)"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <button
              v-if="!showTitleInput"
              type="button"
              class="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed text-sm text-(--color-muted-foreground) hover:border-(--color-primary) hover:text-(--color-primary)"
              @click="showTitleInput = true"
            >
              <Plus class="w-3 h-3" />
              {{ t('actions.add') }}
            </button>
          </div>
          <div
            v-if="showTitleInput"
            class="flex gap-2"
          >
            <input
              v-model="newTitle"
              type="text"
              :placeholder="t('profile.quickTitlePlaceholder')"
              class="flex-1 px-3 py-2 rounded-lg border bg-(--color-background) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              @keyup.enter="addQuickTitle"
            >
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-(--color-primary) text-(--color-primary-foreground) text-sm font-medium"
              @click="addQuickTitle"
            >
              {{ t('actions.confirm') }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg border text-sm"
              @click="showTitleInput = false; newTitle = ''"
            >
              {{ t('actions.cancel') }}
            </button>
          </div>
        </div>

        <div class="border-t pt-6">
          <button
            type="button"
            class="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-(--color-muted) transition-colors"
            @click="router.push('/recurring')"
          >
            <Repeat class="w-5 h-5 text-(--color-muted-foreground)" />
            <span class="flex-1 text-left font-medium">{{ t('profile.recurringLink') }}</span>
            <ChevronRight class="w-5 h-5 text-(--color-muted-foreground)" />
          </button>
        </div>

        <div class="border-t pt-6 space-y-3">
          <h2 class="font-medium">
            {{ t('profile.language') }}
          </h2>
          <LocaleSwitcher />
        </div>

        <div class="border-t pt-6 space-y-4">
          <h2 class="font-medium">
            {{ t('profile.connection') }}
          </h2>

          <div class="flex items-center gap-3 p-4 rounded-lg bg-(--color-muted)">
            <component
              :is="offlineStore.isOnline ? Wifi : WifiOff"
              class="w-5 h-5"
              :class="offlineStore.isOnline ? 'text-green-500' : 'text-(--color-destructive)'"
            />
            <div class="flex-1">
              <p class="font-medium">
                {{ offlineStore.isOnline ? t('profile.online') : t('profile.offline') }}
              </p>
              <p
                v-if="offlineStore.pendingCount > 0"
                class="text-sm text-(--color-muted-foreground)"
              >
                {{ tp('profile.pendingSync', offlineStore.pendingCount) }}
              </p>
            </div>
            <button
              v-if="offlineStore.pendingCount > 0 && offlineStore.isOnline"
              type="button"
              :aria-label="t('profile.syncNow')"
              :disabled="offlineStore.syncing"
              class="p-2 rounded-lg hover:bg-(--color-background)"
              @click="offlineStore.syncPendingActions()"
            >
              <RefreshCw
                class="w-5 h-5"
                :class="offlineStore.syncing && 'animate-spin'"
              />
            </button>
          </div>
        </div>

        <div class="border-t pt-6">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-(--color-destructive) hover:bg-(--color-destructive)/10 transition-colors"
            @click="handleSignOut"
          >
            <LogOut class="w-5 h-5" />
            {{ t('profile.signOut') }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
