<template>
  <div class="landing-page-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="产品名称/名称/ID"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="siteTypeFilter"
          placeholder="站点类型"
          clearable
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option label="移动端" value="移动端" />
          <el-option label="PC端" value="PC端" />
          <el-option label="小程序" value="小程序" />
        </el-select>
        <el-input
          v-model="advIdFilter"
          placeholder="广告主ID"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch"
          ><el-icon><Search /></el-icon> 搜索</el-button
        >
        <el-button @click="resetSearch">重置搜索</el-button>
      </div>

      <div class="actions">
        <el-button type="primary" plain @click="syncData">同步落地页</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete"
          >批量删除</el-button
        >
        <el-button type="primary" @click="openDialog('create')">新建落地页</el-button>
      </div>
    </div>

    <el-table
      :data="paginatedData"
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="落地页ID" width="100" />
      <el-table-column prop="name" label="页面名称" min-width="150" />
      <el-table-column prop="product" label="关联产品" width="120" />
      <el-table-column prop="siteType" label="站点类型" width="100" />
      <el-table-column label="URL" min-width="200">
        <template #default="scope">
          <el-link type="primary" :href="scope.row.url" target="_blank">{{
            scope.row.url
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="advertiserId" label="广告主ID" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openDialog('edit', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
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

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建落地页' : '编辑落地页'"
      width="550px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="页面名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入落地页名称" />
        </el-form-item>
        <el-form-item label="目标URL" prop="url">
          <el-input v-model="form.url" placeholder="请输入完整的 http(s) 链接" />
        </el-form-item>
        <el-form-item label="关联产品" prop="product">
          <el-input v-model="form.product" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="站点类型" prop="siteType">
          <el-radio-group v-model="form.siteType">
            <el-radio label="移动端">移动端</el-radio>
            <el-radio label="PC端">PC端</el-radio>
            <el-radio label="小程序">小程序</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="广告主ID" prop="advertiserId">
          <el-input v-model="form.advertiserId" placeholder="请输入广告主ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'
import type { LandingPage } from '@/mock/platform1Data'

// State
const allData = ref<LandingPage[]>([])
const filteredData = ref<LandingPage[]>([])
const loading = ref(false)
const selectedRows = ref<LandingPage[]>([])

const getNextId = () => String(Date.now())

// Filters
const searchKeyword = ref('')
const siteTypeFilter = ref('')
const advIdFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

// Dialog State
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const form = reactive({
  id: 0 as number | string,
  name: '',
  url: '',
  product: '',
  siteType: '移动端',
  advertiserId: '',
})
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入落地页名称', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入目标URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL格式', trigger: 'blur' },
  ],
  product: [{ required: true, message: '请输入关联产品', trigger: 'blur' }],
  advertiserId: [{ required: true, message: '请输入广告主ID', trigger: 'blur' }],
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/landingPages')
    allData.value = (res as unknown as LandingPage[]) || []
    filterData()
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const filterData = () => {
  loading.value = true
  setTimeout(() => {
    let result = [...allData.value]

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.product.toLowerCase().includes(keyword) ||
          item.id.toString() === keyword,
      )
    }

    if (siteTypeFilter.value) {
      result = result.filter((item) => item.siteType === siteTypeFilter.value)
    }

    if (advIdFilter.value) {
      result = result.filter((item) => item.advertiserId.includes(advIdFilter.value))
    }

    filteredData.value = result
    total.value = result.length
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  currentPage.value = 1
  filterData()
}

const resetSearch = () => {
  searchKeyword.value = ''
  siteTypeFilter.value = ''
  advIdFilter.value = ''
  handleSearch()
}

const handleSelectionChange = (val: LandingPage[]) => {
  selectedRows.value = val
}

const syncData = async () => {
  loading.value = true
  setTimeout(async () => {
    try {
      const newItem: LandingPage = {
        id: String(Date.now()),
        name: `同步落地页_${new Date().getMinutes()}`,
        url: 'https://example.com/sync',
        product: '同步产品',
        siteType: '移动端',
        advertiserId: 'ADV_SYNC',
        createTime: getCurrentTime(),
      }
      await request.post('/landingPages', newItem)
      allData.value.unshift(newItem)
      filterData()
      ElMessage.success('同步成功')
    } catch (e) {
      ElMessage.error('同步失败')
    } finally {
      loading.value = false
    }
  }, 1000)
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 项吗？`, '警告', {
    type: 'warning',
  })
    .then(async () => {
      try {
        const ids = selectedRows.value.map((item) => item.id)
        await Promise.all(ids.map((id) => request.delete(`/landingPages/${id}`)))
        allData.value = allData.value.filter((item) => !ids.includes(item.id))
        selectedRows.value = []
        filterData()
        ElMessage.success('批量删除成功')
      } catch (e) {
        ElMessage.error('批量删除失败')
      }
    })
    .catch(() => {})
}

const handleDelete = (row: LandingPage) => {
  ElMessageBox.confirm('确定删除该落地页吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/landingPages/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const openDialog = (type: 'create' | 'edit', row?: LandingPage) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.url = row.url
    form.product = row.product
    form.siteType = row.siteType
    form.advertiserId = row.advertiserId
  } else {
    form.id = 0
    form.name = ''
    form.url = ''
    form.product = ''
    form.siteType = '移动端'
    form.advertiserId = ''
  }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 0)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'create') {
          const newItem: LandingPage = {
            id: getNextId(),
            name: form.name,
            url: form.url,
            product: form.product,
            siteType: form.siteType,
            advertiserId: form.advertiserId,
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
          await request.post('/landingPages', newItem)
          allData.value.unshift(newItem)
          ElMessage.success('创建成功')
        } else {
          const index = allData.value.findIndex((item) => item.id === form.id)
          if (index > -1) {
            const item = allData.value[index]
            if (item) {
              const updatedItem = {
                ...item,
                name: form.name,
                url: form.url,
                product: form.product,
                siteType: form.siteType,
                advertiserId: form.advertiserId,
              }
              await request.put(`/landingPages/${form.id}`, updatedItem)
              allData.value[index] = updatedItem
              ElMessage.success('修改成功')
            }
          }
        }
        filterData()
        dialogVisible.value = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
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
</script>

<style scoped lang="scss">
.landing-page-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .actions {
      display: flex;
      gap: 12px;
    }
  }

  .el-table {
    flex: 1;
    height: 0;
  }

  .pagination {
    margin-top: 16px;
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
}
</style>
