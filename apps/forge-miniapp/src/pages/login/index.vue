<template>
  <view class="login-page">
    <image class="logo" src="/static/logo.png" mode="aspectFit" />
    <text class="title">欢迎使用 Forge Admin</text>

    <button type="primary" :loading="loading" @click="handleLogin">微信一键登录</button>

    <view class="agreement">
      <text>登录即代表同意</text>
      <text class="link">《用户协议》</text>
      <text>和</text>
      <text class="link">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    // 获取微信 code
    const loginRes = await uni.login({ provider: 'weixin' })
    const code = loginRes.code
	
    // 调后端 wx-login
    const data = await authApi.wxLogin(code)

    // 存储 token + userInfo
    userStore.setTokens(data.accessToken, data.refreshToken)
    userStore.setUserInfo(data.userInfo)

    uni.reLaunch({ url: '/pages/profile/index' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 40rpx;
  .logo {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
  }
  .title {
    font-size: 36rpx;
    margin-bottom: 80rpx;
  }
  .agreement {
    margin-top: 40rpx;
    font-size: 24rpx;
    color: #999;
    .link {
      color: #007aff;
    }
  }
}
</style>