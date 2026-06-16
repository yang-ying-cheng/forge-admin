<template>
  <view class="edit-page">
    <view class="form-card">
      <!-- 头像 -->
      <view class="form-item avatar-item" @click="handleChooseAvatar">
        <text class="label">头像</text>
        <image class="avatar-preview" :src="form.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        <text class="action-text">点击更换</text>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <text class="label">昵称</text>
        <input class="input" v-model="form.nickname" placeholder="请输入昵称" maxlength="20" />
      </view>
    </view>

    <view class="save-btn" :class="{ disabled: saving }" @click="handleSave">
      <text>{{ saving ? '保存中...' : '保存' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { attachmentApi } from '@/api/attachment'

const userStore = useUserStore()
const saving = ref(false)

const form = reactive({
  nickname: '',
  avatar: ''
})

onMounted(() => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    form.nickname = userInfo.nickname || ''
    form.avatar = userInfo.avatar || ''
  }
})

const handleChooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      try {
        uni.showToast({ title: '上传中...', icon: 'loading' })
        const result = await attachmentApi.uploadAvatar(filePath)
        form.avatar = result.url
        uni.hideToast()
      } catch (e: any) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      }
    }
  })
}

const handleSave = async () => {
  if (saving.value) return
  if (!form.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await userApi.updateProfile({
      nickname: form.nickname,
      avatar: form.avatar
    })

    // 更新本地存储
    userStore.setUserInfo({
      ...userStore.userInfo!,
      nickname: form.nickname,
      avatar: form.avatar
    })

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.edit-page {
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

    .avatar-item {
      .avatar-preview {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        margin-left: 20rpx;
      }

      .action-text {
        margin-left: auto;
        font-size: 28rpx;
        color: #007aff;
      }
    }
  }

  .save-btn {
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
}
</style>