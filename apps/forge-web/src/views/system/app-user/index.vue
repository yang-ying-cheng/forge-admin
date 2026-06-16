<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <!-- 桌面端搜索表单 -->
      <el-form v-if="!isMobile" :model="queryParams" inline>
        <el-form-item label="昵称">
          <el-input v-model="queryParams.nickname" placeholder="请输入昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="OpenId">
          <el-input v-model="queryParams.openId" placeholder="请输入OpenId" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="封禁" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 移动端搜索按钮 -->
      <div v-else class="mobile-search-actions">
        <span class="title">App用户列表</span>
        <div class="actions">
          <MobileSearchButton :badge-count="activeConditionsCount" @click="searchDrawerVisible = true" />
        </div>
      </div>
    </el-card>

    <!-- 移动端搜索抽屉 -->
    <MobileSearchDrawer v-model="searchDrawerVisible" :form-data="queryParams" @search="handleSearchFromDrawer" @reset="handleResetFromDrawer">
      <template #form-items>
        <el-form-item label="昵称">
          <el-input v-model="queryParams.nickname" placeholder="请输入昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="OpenId">
          <el-input v-model="queryParams.openId" placeholder="请输入OpenId" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 100%">
            <el-option label="正常" :value="1" />
            <el-option label="封禁" :value="0" />
          </el-select>
        </el-form-item>
      </template>
    </MobileSearchDrawer>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <!-- vxe-toolbar 工具栏（桌面端） -->
      <vxe-toolbar v-if="!isMobile" ref="toolbarRef" custom>
        <template #tools>
          <vxe-button circle icon="vxe-icon-repeat" style="margin-right: 10px" @click="handleReset"></vxe-button>
        </template>
      </vxe-toolbar>

      <!-- vxe-table 表格 -->
      <vxe-table
        ref="tableRef"
        :data="tableData"
        id="appUserTable"
        :custom-config="{mode: 'modal'}"
        :height="tableHeight"
        :loading="loading"
        :row-config="{ isCurrent: true, isHover: true }"
        :checkbox-config="{ highlight: true, range: true }"
        :column-config="{ resizable: true }"
        border="none"
        stripe
        show-overflow="tooltip"
        show-header-overflow="tooltip"
        @current-change="handleCurrentChange"
      >
        <!-- 序号列（桌面端） -->
        <vxe-column v-if="!isMobile" type="seq" title="序号" width="60" />

        <!-- 头像 -->
        <vxe-column title="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="30" :src="row.avatar || undefined" shape="square" effect="light">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </vxe-column>

        <!-- 昵称 -->
        <vxe-column field="nickname" title="昵称" min-width="120" />

        <!-- 手机号 -->
        <vxe-column title="手机号" min-width="130">
          <template #default="{ row }">
            <span>{{ row.phone || '-' }}</span>
            <el-tag v-if="row.phoneVerified === 1" type="success" size="small" style="margin-left: 4px">已验证</el-tag>
            <el-tag v-else-if="row.phone" type="warning" size="small" style="margin-left: 4px">未验证</el-tag>
          </template>
        </vxe-column>

        <!-- OpenId -->
        <vxe-column v-if="!isMobile" field="openId" title="OpenId" min-width="200" />

        <!-- 状态 -->
        <vxe-column title="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </vxe-column>

        <!-- 最后登录时间 -->
        <vxe-column v-if="!isMobile" title="最后登录" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginTime) }}
          </template>
        </vxe-column>

        <!-- 创建时间 -->
        <vxe-column v-if="!isMobile" title="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </vxe-column>

        <!-- 桌面端操作列 -->
        <vxe-column v-if="!isMobile" title="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:app-user:detail'" type="primary" link size="small" @click.stop="handleDetail(row)">详情</el-button>
            <el-button
              v-permission="'system:app-user:status'"
              :type="row.status === 1 ? 'warning' : 'success'"
              link
              size="small"
              @click.stop="handleStatus(row)"
            >
              {{ row.status === 1 ? '封禁' : '解封' }}
            </el-button>
            <el-button v-permission="'system:app-user:delete'" type="danger" link size="small" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>

      <TablePagination
        v-model:page-num="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        @change="getList"
      />
    </el-card>

    <!-- 移动端底部操作栏 -->
    <MobileBottomActions
      :show="!!selectedRow"
      :item="selectedRow"
      :item-title="selectedRow?.nickname"
      @cancel="cancelSelection"
    >
      <template #actions="{ item }">
        <el-button v-permission="'system:app-user:detail'" size="small" type="primary" @click.stop="handleDetail(item)">详情</el-button>
        <el-button
          v-permission="'system:app-user:status'"
          size="small"
          :type="item.status === 1 ? 'warning' : 'success'"
          @click.stop="handleStatus(item)"
        >
          {{ item.status === 1 ? '封禁' : '解封' }}
        </el-button>
        <el-button v-permission="'system:app-user:delete'" size="small" type="danger" @click.stop="handleDelete(item)">删除</el-button>
      </template>
    </MobileBottomActions>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
import { getAppUserList, updateAppUserStatus, deleteAppUser } from '@/api/system/app-user'
import type { AppUserEntity, AppUserQuery } from '@/api/system/app-user'
import { formatDateTime } from '@/utils/dateFormat'
import { useResponsive } from '@/composables/useResponsive'
import { useTableHeight } from '@/composables/useTableHeight'
import MobileSearchDrawer from '@/components/MobileSearchDrawer.vue'
import MobileSearchButton from '@/components/MobileSearchButton.vue'
import MobileBottomActions from '@/components/MobileBottomActions.vue'
import TablePagination from '@/components/TablePagination.vue'

const { isMobile } = useResponsive()

// 表格高度自适应
const { tableHeight } = useTableHeight()

// 表格实例
const tableRef = ref<VxeTableInstance | null>(null)
const toolbarRef = ref<VxeToolbarInstance | null>(null)

// 查询参数
const queryParams = reactive<AppUserQuery>({
  pageNum: 1,
  pageSize: 20,
  nickname: '',
  phone: '',
  openId: '',
  status: undefined
})

// 表格数据
const loading = ref(false)
const tableData = ref<AppUserEntity[]>([])
const total = ref(0)

// 移动端状态
const searchDrawerVisible = ref(false)
const selectedRow = ref<AppUserEntity | null>(null)

// 计算激活的搜索条件数量
const activeConditionsCount = computed(() => {
  let count = 0
  if (queryParams.nickname) count++
  if (queryParams.phone) count++
  if (queryParams.openId) count++
  if (queryParams.status !== undefined) count++
  return count
})

// 关联工具栏与表格
onMounted(() => {
  if (tableRef.value && toolbarRef.value) {
    tableRef.value.connect(toolbarRef.value)
  }
})

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getAppUserList(queryParams)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置
const handleReset = () => {
  queryParams.nickname = ''
  queryParams.phone = ''
  queryParams.openId = ''
  queryParams.status = undefined
  handleQuery()
}

// 移动端抽屉搜索
const handleSearchFromDrawer = () => {
  queryParams.pageNum = 1
  getList()
}

// 移动端抽屉重置
const handleResetFromDrawer = () => {
  handleReset()
}

// 详情
const handleDetail = (_row: AppUserEntity) => {
  // TODO: 打开详情抽屉（Task 12）
  ElMessage.info('详情功能开发中')
}

// 封禁/解封
const handleStatus = (row: AppUserEntity) => {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 0 ? '封禁' : '解封'

  ElMessageBox.confirm(`确定要${actionText}该用户吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    await updateAppUserStatus(row.id, newStatus)
    ElMessage.success(`${actionText}成功`)
    cancelSelection()
    getList()
  })
}

// 删除
const handleDelete = (row: AppUserEntity) => {
  ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复。', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteAppUser(row.id)
    ElMessage.success('删除成功')
    cancelSelection()
    getList()
  })
}

// 当前行变化（移动端选中）
const handleCurrentChange = ({ row }: { row: AppUserEntity | null }) => {
  if (isMobile.value) {
    selectedRow.value = row
  }
}

// 取消选择
const cancelSelection = () => {
  selectedRow.value = null
  if (tableRef.value) {
    tableRef.value.clearCurrentRow()
  }
}

// 初始化
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;

  .search-card {
    margin-bottom: 15px;
  }

  .table-card {
    .el-pagination {
      margin-top: 15px;
      justify-content: flex-end;
    }
  }

  .mobile-search-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>