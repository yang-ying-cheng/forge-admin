<template>
  <view class="phone-page">
    <view class="form-card">
      <!-- 手机号 -->
      <view class="form-item">
        <text class="label">手机号</text>
        <input
          class="input"
          v-model="phone"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <!-- 验证码 -->
      <view class="form-item code-item">
        <text class="label">验证码</text>
        <input
          class="input code-input"
          v-model="code"
          type="number"
          placeholder="请输入验证码"
          maxlength="6"
        />
        <view class="send-btn" :class="{ disabled: countdown > 0 || sending }" @click="handleSendCode">
          <text>{{ countdown > 0 ? `${countdown}s` : (sending ? '发送中...' : '获取验证码') }}</text>
        </view>
      </view>
    </view>

    <view class="bind-btn" :class="{ disabled: binding }" @click="handleBind">
      <text>{{ binding ? '绑定中...' : '确认绑定' }}</text>
    </view>

    <!-- 验证码提示 -->
    <view class="code-tip" v-if="mockCode">
      <text>开发模式验证码: {{ mockCode }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { useSmsCode } from '@/composables/useSmsCode'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const binding = ref(false)
const mockCode = ref('')

const { countdown, loading: sending, sendCode } = useSmsCode()

onMounted(() => {
  // 如果已有手机号，显示当前号码
  if (userStore.userInfo?.phone) {
    phone.value = userStore.userInfo.phone
  }
})

const handleSendCode = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  try {
    const result = await sendCode(phone.value)
    // Mock 模式下显示验证码提示
    if (result?.expireSeconds) {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' })
  }
}

const handleBind = async () => {
  if (binding.value) return

  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  if (!code.value || code.value.length !== 6) {
    uni.showToast({ title: '请输入6位验证码', icon: 'none' })
    return
  }

  binding.value = true
  try {
    await userApi.bindPhone(phone.value, code.value)

    // 更新本地用户信息
    userStore.setUserInfo({
      ...userStore.userInfo!,
      phone: phone.value,
      phoneVerified: 1
    })

    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '绑定失败', icon: 'none' })
  } finally {
    binding.value = false
  }
}
</script>

<style scoped lang="scss">
.phone-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;

  .form-card {
    background: #fff;
    border-radius: 16rpx;

    .form-item {
      display: flex;
      align-items: center;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 32rpx;
        color: #333;
        width: 140rpx;
      }

      .input {
        flex: 1;
        font-size: 32rpx;
        color: #333;
      }
    }

    .code-item {
      .code-input {
        flex: 1;
      }

      .send-btn {
        padding: 16rpx 24rpx;
        background: #007aff;
        border-radius: 8rpx;
        font-size: 28rpx;
        color: #fff;

        &.disabled {
          opacity: 0.6;
        }
      }
    }
  }

  .bind-btn {
    background: #007aff;
    border-radius: 16rpx;
    padding: 30rpx;
    text-align: center;
    font-size: 32rpx;
    color: #fff;
    margin-top: 40rpx;

    &.disabled {
      opacity: 0.6;
    }
  }

  .code-tip {
    margin-top: 20rpx;
    padding: 20rpx;
    background: #fff3e0;
    border-radius: 8rpx;
    text-align: center;
    font-size: 28rpx;
    color: #ff9800;
  }
}
</style>