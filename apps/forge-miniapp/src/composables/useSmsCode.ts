import { ref } from 'vue'
import { userApi } from '@/api/user'

export function useSmsCode() {
  const countdown = ref(0)
  const loading = ref(false)

  const sendCode = async (phone: string) => {
    if (countdown.value > 0) return
    loading.value = true
    try {
      await userApi.sendSmsCode(phone)
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
      }, 1000)
    } catch (e: any) {
      uni.showToast({ title: e.message || '发送失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  return { countdown, loading, sendCode }
}