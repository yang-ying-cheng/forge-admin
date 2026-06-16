import { request } from './request'

export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  phone: string | null
  phoneVerified: number
  openId: string
  status: number
  lastLoginTime: string | null
}

export const userApi = {
  getProfile: () =>
    request<UserInfo>({ url: '/user/profile' }),

  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request<void>({ url: '/user/profile', method: 'PUT', data }),

  sendSmsCode: (phone: string) =>
    request<{ expireSeconds: number }>({
      url: '/user/sms-code',
      method: 'POST',
      data: { phone }
    }),

  bindPhone: (phone: string, code: string) =>
    request<void>({
      url: '/user/bind-phone',
      method: 'POST',
      data: { phone, code }
    }),

  deactivate: () =>
    request<void>({
      url: '/user/deactivate',
      method: 'DELETE',
      data: { confirm: true }
    })
}