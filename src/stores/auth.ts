import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
      } else {
        profile.value = null
      }
    })
  }

  async function fetchProfile() {
    if (!user.value) return

    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (err && err.code !== 'PGRST116') {
      error.value = err.message
      return
    }

    profile.value = data
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (err) {
      error.value = err.message
      loading.value = false
      return false
    }

    loading.value = false
    return true
  }

  async function signUp(email: string, password: string, displayName: string, color: string) {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          color
        }
      }
    })

    if (err) {
      error.value = err.message
      loading.value = false
      return false
    }

    loading.value = false
    return true
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function updateProfile(displayName: string, color: string, avatarUrl?: string | null) {
    if (!user.value) return false

    const updateData: Record<string, unknown> = { display_name: displayName, color }
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl
    }

    const { error: err } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.value.id)

    if (err) {
      error.value = err.message
      return false
    }

    profile.value = {
      ...profile.value!,
      display_name: displayName,
      color,
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl })
    }
    return true
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!user.value) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.value.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      error.value = uploadError.message
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
  }

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    init,
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar
  }
})
