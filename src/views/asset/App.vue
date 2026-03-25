<template>
  <div class="app-management-container">
    <div class="content-wrapper">
      <!-- Search & Filter Bar -->
      <div class="top-bar">
        <el-form :inline="true" :model="filters" class="filter-form" @submit.prevent>
          <el-form-item label="应用名称/ID">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入搜索词"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="应用类型">
            <el-select
              v-model="filters.type"
              placeholder="全部"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option v-for="type in appTypes" :key="type" :label="type" :value="type" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属产品">
            <el-select
              v-model="filters.productId"
              placeholder="全部"
              clearable
              style="width: 180px"
              @change="handleSearch"
            >
              <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-button type="primary" @click="openAppDialog('create')">新建应用</el-button>
          <el-button type="success" @click="handleBatchSync" :disabled="selectedRows.length === 0"
            >批量同步</el-button
          >
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0"
            >批量删除</el-button
          >
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="paginatedApps"
          style="width: 100%"
          height="100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="应用ID" width="120" />
          <el-table-column prop="name" label="应用名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属产品" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getProductName(row.productId) }}
            </template>
          </el-table-column>
          <el-table-column prop="os" label="操作系统" width="100" />
          <el-table-column label="分包数量" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.subPackages?.length || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="同步状态" width="100">
            <template #default="{ row }">
              <span :class="['sync-dot', row.syncStatus]"></span>
              {{ row.syncStatus === 'synced' ? '已同步' : '未同步' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openAppDialog('edit', row)"
                >编辑</el-button
              >
              <el-button link type="primary" size="small" @click="openSubPackageDialog(row)"
                >分包</el-button
              >
              <el-button
                link
                type="success"
                size="small"
                @click="handleSingleSync(row)"
                :disabled="row.syncStatus === 'synced'"
                >同步</el-button
              >
              <el-button link type="danger" size="small" @click="handleSingleDelete(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSearch"
          @current-change="handlePageChange"
        />
        <div class="custom-page-size-wrapper">
          <el-input-number
            v-model="customPageSizeInput"
            :min="1"
            :max="200"
            size="small"
            controls-position="right"
            placeholder="条/页"
          />
          <el-button type="primary" size="small" @click="applyCustomPageSize">确定</el-button>
        </div>
      </div>
    </div>

    <!-- Create/Edit App Dialog -->
    <el-dialog
      v-model="appDialogVisible"
      :title="dialogType === 'create' ? '新建应用资产' : '编辑应用资产'"
      width="600px"
    >
      <el-form :model="appForm" :rules="appRules" ref="appFormRef" label-width="100px" status-icon>
        <el-form-item label="应用名称" prop="name">
          <el-input v-model="appForm.name" placeholder="请输入应用名称，如：电商极速版" />
        </el-form-item>
        <el-form-item label="应用类型" prop="type">
          <el-select v-model="appForm.type" placeholder="请选择应用类型" style="width: 100%">
            <el-option v-for="type in appTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属产品" prop="productId">
          <el-select v-model="appForm.productId" placeholder="请选择关联产品" style="width: 100%">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作系统" prop="os">
          <el-radio-group v-model="appForm.os">
            <el-radio label="Android">Android</el-radio>
            <el-radio label="iOS">iOS</el-radio>
            <el-radio label="None">无 (如小程序)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="下载/跳转URL" prop="downloadUrl">
          <el-input
            v-model="appForm.downloadUrl"
            placeholder="请输入应用下载地址或小程序跳转路径"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="appDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApp">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Sub-Package Dialog -->
    <el-dialog v-model="subPkgDialogVisible" title="分包地址管理" width="700px">
      <div class="sub-pkg-content">
        <div class="sub-pkg-header">
          <span
            >当前应用: <strong>{{ currentManagingApp?.name }}</strong></span
          >
          <el-button type="primary" size="small" @click="addSubPackageRow">添加一行</el-button>
        </div>
        <el-table :data="tempSubPackages" style="width: 100%" border max-height="300">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="分包地址路径" min-width="400">
            <template #default="{ row }">
              <el-input v-model="row.url" placeholder="请输入分包路径，如: /pkg_a/pages/index" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeSubPackageRow($index)"
                >移除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div v-if="tempSubPackages.length === 0" class="empty-hint">暂无分包地址，请点击添加</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subPkgDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSubPackages">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import type { AppAsset, Product, ProductGroup } from '@/mock/assetData'

// Data State
const allApps = ref<AppAsset[]>([])
const products = ref<Product[]>([])
const filteredApps = ref<AppAsset[]>([])
const loading = ref(false)

const appTypes = ['快应用', '小程序', 'Android', 'iOS', '鸿蒙']

const getNextAppId = () => `app_${Date.now()}`

// Filters
const filters = reactive({
  keyword: '',
  type: '',
  productId: null as number | null,
})

const selectedRows = ref<AppAsset[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

// --- Mounting ---
onMounted(async () => {
  loading.value = true
  try {
    const [appsRes, productsRes] = await Promise.all([
      request.get('/apps'),
      request.get('/products'),
    ])
    allApps.value = (appsRes as unknown as AppAsset[]) || []
    products.value = (productsRes as unknown as Product[]) || []
    filterData()
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
})

// --- Computed Data ---
const paginatedApps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredApps.value.slice(start, start + pageSize.value)
})

// --- Methods: Core Lists ---
const filterData = () => {
  loading.value = true
  setTimeout(() => {
    let result = [...allApps.value]

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(
        (a) => a.name.toLowerCase().includes(kw) || a.id.toLowerCase().includes(kw),
      )
    }
    if (filters.type) {
      result = result.filter((a) => a.type === filters.type)
    }
    if (filters.productId) {
      result = result.filter((a) => a.productId === filters.productId)
    }

    filteredApps.value = result
    total.value = result.length
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  currentPage.value = 1
  filterData()
}

const resetSearch = () => {
  filters.keyword = ''
  filters.type = ''
  filters.productId = null
  handleSearch()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
}

const applyCustomPageSize = () => {
  if (
    !customPageSizeInput.value ||
    customPageSizeInput.value <= 0 ||
    customPageSizeInput.value > 200
  ) {
    ElMessage.warning('请输入1-200之间的有效数字')
    return
  }
  const newSize = customPageSizeInput.value
  if (!pageSizes.value.includes(newSize)) {
    pageSizes.value.push(newSize)
    pageSizes.value.sort((a, b) => a - b)
  }
  pageSize.value = newSize
  currentPage.value = 1
  customPageSizeInput.value = undefined // Reset input
}

const handleSelectionChange = (val: AppAsset[]) => {
  selectedRows.value = val
}

const getProductName = (pid: number) => {
  const p = products.value.find((item) => item.id === pid)
  if (p) {
    return p.name
  }
  return '-'
}

const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    快应用: 'warning',
    小程序: 'success',
    Android: '',
    iOS: 'info',
    鸿蒙: 'danger',
  }
  return map[type] || 'info'
}

// --- Methods: Dialogs (Create/Edit) ---
const appDialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const appFormRef = ref<FormInstance>()

const appForm = reactive<Partial<AppAsset>>({
  id: '',
  name: '',
  type: 'Android',
  productId: undefined,
  downloadUrl: '',
  os: 'Android',
})

const appRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
  productId: [{ required: true, message: '请选择所属产品', trigger: 'change' }],
  os: [{ required: true, message: '请选择操作系统', trigger: 'change' }],
  downloadUrl: [{ required: true, message: '请输入下载地址', trigger: 'blur' }],
})

const openAppDialog = (type: 'create' | 'edit', row?: AppAsset) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    appForm.id = row.id
    appForm.name = row.name
    appForm.type = row.type
    appForm.productId = row.productId
    appForm.os = row.os
    appForm.downloadUrl = row.downloadUrl
  } else {
    appForm.id = ''
    appForm.name = ''
    appForm.type = 'Android'
    appForm.productId = undefined
    appForm.os = 'Android'
    appForm.downloadUrl = ''
  }
  appDialogVisible.value = true
  setTimeout(() => appFormRef.value?.clearValidate(), 0)
}

const submitApp = async () => {
  if (!appFormRef.value) return
  await appFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'create') {
          const newApp: AppAsset = {
            id: getNextAppId(),
            name: appForm.name as string,
            type: appForm.type as AppAsset['type'],
            productId: appForm.productId as number,
            os: appForm.os as AppAsset['os'],
            downloadUrl: appForm.downloadUrl as string,
            subPackages: [],
            syncStatus: 'unsynced',
            createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          }
          await request.post('/apps', newApp)
          allApps.value.unshift(newApp)
          ElMessage.success('应用创建成功')
        } else {
          const index = allApps.value.findIndex((a) => a.id === appForm.id)
          if (index > -1) {
            const updatedApp = {
              ...allApps.value[index],
              name: appForm.name as string,
              type: appForm.type as AppAsset['type'],
              productId: appForm.productId as number,
              os: appForm.os as AppAsset['os'],
              downloadUrl: appForm.downloadUrl as string,
              syncStatus: 'unsynced',
            } as AppAsset
            await request.put(`/apps/${appForm.id}`, updatedApp)
            allApps.value[index] = updatedApp
            ElMessage.success('应用修改成功')
          }
        }
        filterData()
        appDialogVisible.value = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

// --- Methods: Sub-Packages ---
const subPkgDialogVisible = ref(false)
const currentManagingApp = ref<AppAsset | null>(null)
const tempSubPackages = ref<{ url: string }[]>([])

const openSubPackageDialog = (row: AppAsset) => {
  currentManagingApp.value = row
  // Deep copy subPackages
  tempSubPackages.value = (row.subPackages || []).map((s) => ({ url: s }))
  subPkgDialogVisible.value = true
}

const addSubPackageRow = () => {
  tempSubPackages.value.push({ url: '' })
}

const removeSubPackageRow = (index: number) => {
  tempSubPackages.value.splice(index, 1)
}

const submitSubPackages = async () => {
  if (!currentManagingApp.value) return
  // filter empty
  const validPkgs = tempSubPackages.value.map((r) => r.url.trim()).filter((u) => u)

  const index = allApps.value.findIndex((a) => a.id === currentManagingApp.value?.id)
  if (index > -1 && allApps.value[index]) {
    const app = allApps.value[index]
    app.subPackages = validPkgs
    try {
      await request.patch(`/apps/${app.id}`, { subPackages: validPkgs })
      ElMessage.success('分包地址更新成功')
      filterData()
    } catch (e) {
      ElMessage.error('更新失败')
    }
  }
  subPkgDialogVisible.value = false
}

// --- Methods: Business Logic (Sync & Delete) ---
const handleSingleSync = async (row: AppAsset) => {
  const idx = allApps.value.findIndex((a) => a.id === row.id)
  if (idx > -1 && allApps.value[idx]) {
    try {
      await request.patch(`/apps/${row.id}`, { syncStatus: 'synced' })
      allApps.value[idx].syncStatus = 'synced'
      ElMessage.success('同步成功')
    } catch (e) {
      ElMessage.error('同步失败')
    }
  }
}

const handleBatchSync = async () => {
  const unsyncedRows = selectedRows.value.filter((r) => r.syncStatus === 'unsynced')
  if (unsyncedRows.length === 0) {
    ElMessage.info('所选应用已全部同步，无需重复操作')
    return
  }

  try {
    await Promise.all(
      unsyncedRows.map((row) => request.patch(`/apps/${row.id}`, { syncStatus: 'synced' })),
    )
    unsyncedRows.forEach((row) => {
      const idx = allApps.value.findIndex((a) => a.id === row.id)
      if (idx > -1 && allApps.value[idx]) allApps.value[idx].syncStatus = 'synced'
    })
    ElMessage.success('批量同步完成')
  } catch (e) {
    ElMessage.error('批量同步失败')
  }
}

const handleSingleDelete = (row: AppAsset) => {
  ElMessageBox.confirm(`确定要永久删除应用 [${row.name}] 及其关联数据吗？`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.delete(`/apps/${row.id}`)
        allApps.value = allApps.value.filter((a) => a.id !== row.id)
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `即将删除 ${selectedRows.value.length} 个应用，删除后无法恢复，确定继续？`,
    '批量删除确认',
    {
      confirmButtonText: '暴力删除',
      cancelButtonText: '我再想想',
      type: 'error',
    },
  )
    .then(async () => {
      try {
        const idsToDelete = selectedRows.value.map((r) => r.id)
        await Promise.all(idsToDelete.map((id) => request.delete(`/apps/${id}`)))
        const idsSet = new Set(idsToDelete)
        allApps.value = allApps.value.filter((a) => !idsSet.has(a.id))
        selectedRows.value = []
        filterData()
        ElMessage.success('批量删除完毕')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.app-management-container {
  height: 100%;
  padding: 20px;
  box-sizing: border-box;

  .content-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
  }

  .table-container {
    flex: 1;
    overflow: hidden;

    .sync-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;

      &.synced {
        background-color: var(--el-color-success);
      }
      &.unsynced {
        background-color: var(--el-color-info);
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .custom-page-size-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 16px;

      .el-input-number {
        width: 100px;
      }
    }
  }

  .sub-pkg-content {
    .sub-pkg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .empty-hint {
      text-align: center;
      padding: 30px;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
  }
}
</style>
