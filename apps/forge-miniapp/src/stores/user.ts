import { defineStore } from 'pinia'
import type { UserInfo } from '@/api/user'

interface UserState {
  accessToken: string | null
  refreshToken: string | null
  userInfo: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    accessToken: null,
    refreshToken: null,
    userInfo: null
  }),
  actions: {
    setTokens(access: string, refresh: string) {
      this.accessToken = access
      this.refreshToken = refresh
      // 同步存储到 uni storage，供 request.ts 使用
      uni.setStorageSync('accessToken', access)
      uni.setStorageSync('refreshToken', refresh)
    },
    setUserInfo(info: UserState['userInfo']) {
      this.userInfo = info
    },
    clear() {
      this.accessToken = null
      this.refreshToken = null
      this.userInfo = null
      // 清除 uni storage
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('userInfo')
    },
    init() {
      // 启动时从 storage 加载 token
      this.accessToken = uni.getStorageSync('accessToken') || null
      this.refreshToken = uni.getStorageSync('refreshToken') || null
      this.userInfo = uni.getStorageSync('userInfo') || null
    }
  }
})