<template>
  <el-drawer v-model="visible" title="App 用户详情" size="400">
    <div class="detail-content">
      <el-avatar :src="user?.avatar" :size="80" />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ user?.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ user?.phone || '未绑定' }}
          <el-tag v-if="user?.phoneVerified" type="success" size="small">已验证</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="OpenId">{{ user?.openId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="user?.status === 0 ? 'success' : 'danger'">
            {{ user?.status === 0 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ user?.lastLoginTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ user?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="注销时间">
          <span v-if="user?.deactivatedTime" style="color:red">{{ user?.deactivatedTime }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getAppUserDetail, type AppUserEntity } from '@/api/system/app-user'

const visible = ref(false)
const user = ref<AppUserEntity | null>(null)

const open = async (id: number) => {
  user.value = await getAppUserDetail(id)
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.detail-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>