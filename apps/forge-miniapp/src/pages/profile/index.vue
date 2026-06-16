<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-wrapper" @click="handleEditProfile">
        <image
          class="avatar"
          :src="userInfo?.avatar || '/static/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="edit-icon">
          <text class="iconfont">编辑</text>
        </view>
      </view>
      <view class="user-info">
        <text class="nickname">{{ userInfo?.nickname || '点击编辑昵称' }}</text>
        <view class="phone-status" @click="handleBindPhone">
          <text class="iconfont">手机</text>
          <text class="phone-text">
            {{ userInfo?.phone ? userInfo.phone : '未绑定手机号' }}
          </text>
          <text class="bind-btn">{{ userInfo?.phone ? '更换' : '绑定' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-item" @click="handleEditProfile">
        <text class="menu-icon">个人资料</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item" @click="handleBindPhone">
        <text class="menu-icon">手机号管理</text>
        <view class="menu-arrow"></view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-btn" @click="handleLogout">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { authApi } from '@/api/auth'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const loading = ref(false)

onMounted(async () => {
  // 每次进入页面刷新用户信息
  await fetchUserInfo()
})

const fetchUserInfo = async () => {
  try {
    const data = await userApi.getProfile()
    userStore.setUserInfo(data)
  } catch (e: any) {
    console.error('获取用户信息失败', e)
  }
}

const handleEditProfile = () => {
  uni.navigateTo({ url: '/pages/profile/edit' })
}

const handleBindPhone = () => {
  if (userInfo.value?.phone) {
    // 已绑定，显示更换手机号
    uni.showModal({
      title: '更换手机号',
      content: '当前手机号: ' + userInfo.value.phone,
      confirmText: '更换',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/profile/phone' })
        }
      }
    })
  } else {
    uni.navigateTo({ url: '/pages/profile/phone' })
  }
}

const handleLogout = async () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await authApi.logout()
        } catch (e) {
          console.error('logout error', e)
        }
        userStore.clear()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;

  .user-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;

    .avatar-wrapper {
      position: relative;
      width: 120rpx;
      height: 120rpx;

      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
        background: #e0e0e0;
      }

      .edit-icon {
        position: absolute;
        bottom: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 8rpx;
        padding: 4rpx 8rpx;
        font-size: 20rpx;
        color: #fff;
      }
    }

    .user-info {
      flex: 1;
      margin-left: 30rpx;

      .nickname {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
      }

      .phone-status {
        display: flex;
        align-items: center;
        margin-top: 16rpx;

        .phone-text {
          font-size: 28rpx;
          color: #666;
          margin-left: 8rpx;
        }

        .bind-btn {
          margin-left: auto;
          font-size: 28rpx;
          color: #007aff;
        }
      }
    }
  }

  .menu-list {
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .menu-icon {
        font-size: 32rpx;
        color: #333;
      }

      .menu-arrow {
        margin-left: auto;
        width: 16rpx;
        height: 16rpx;
        border-top: 2rpx solid #999;
        border-right: 2rpx solid #999;
        transform: rotate(45deg);
      }
    }
  }

  .logout-btn {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    text-align: center;
    font-size: 32rpx;
    color: #ff4d4f;
    margin-top: 40rpx;
  }
}
</style>