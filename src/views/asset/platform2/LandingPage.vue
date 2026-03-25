<template>
  <div class="landing-page-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="落地页名称"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="productFilter"
          placeholder="关联产品"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="creatorFilter"
          placeholder="创建人"
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
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="页面名称" min-width="150" />
      <el-table-column label="页面URL" min-width="200">
        <template #default="scope">
          <el-link type="primary" :href="scope.row.url" target="_blank">{{
            scope.row.url
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="product" label="关联产品" width="150" />
      <el-table-column prop="creator" label="创建人" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="viewPage(scope.row.url)">查看</el-button>
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
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="落地页名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入落地页名称" />
        </el-form-item>
        <el-form-item label="落地页URL" prop="url">
          <el-input v-model="form.url" placeholder="请输入完整的 http(s) 链接" />
        </el-form-item>
        <el-form-item label="关联产品" prop="product">
          <el-input v-model="form.product" placeholder="请输入关联产品名称" />
        </el-form-item>
        <el-form-item label="创建人" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入创建人姓名" />
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
import { mockLandingPagesV2 } from '@/mock/platform2Data'
import type { LandingPageV2 } from '@/mock/platform2Data'

// State
const allData = ref<LandingPageV2[]>([])
const filteredData = ref<LandingPageV2[]>([])
const loading = ref(false)
const selectedRows = ref<LandingPageV2[]>([])

const getNextId = () => String(Date.now())

// Filters
const searchKeyword = ref('')
const productFilter = ref('')
const creatorFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

// Edit Dialog State
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const form = reactive({
  id: 0 as number | string,
  name: '',
  url: '',
  product: '',
  creator: '',
})
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入落地页名称', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入目标URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL格式', trigger: 'blur' },
  ],
  product: [{ required: true, message: '请输入关联产品', trigger: 'blur' }],
  creator: [{ required: true, message: '请输入创建人', trigger: 'blur' }],
})

onMounted(() => {
  allData.value = [...mockLandingPagesV2]
  filterData()
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
      result = result.filter((item) => item.name.toLowerCase().includes(keyword))
    }

    if (productFilter.value) {
      result = result.filter((item) =>
        item.product.toLowerCase().includes(productFilter.value.toLowerCase()),
      )
    }

    if (creatorFilter.value) {
      result = result.filter((item) =>
        item.creator.toLowerCase().includes(creatorFilter.value.toLowerCase()),
      )
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
  productFilter.value = ''
  creatorFilter.value = ''
  handleSearch()
}

const handleSelectionChange = (val: LandingPageV2[]) => {
  selectedRows.value = val
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 项吗？`, '警告', {
    type: 'warning',
  })
    .then(async () => {
      try {
        const ids = selectedRows.value.map((item) => item.id)
        await Promise.all(ids.map((id) => request.delete(`/landingPagesV2/${id}`)))
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

const handleDelete = (row: LandingPageV2) => {
  ElMessageBox.confirm('确定删除该落地页吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/landingPagesV2/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const openDialog = (type: 'create' | 'edit', row?: LandingPageV2) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.url = row.url
    form.product = row.product
    form.creator = row.creator
  } else {
    form.id = 0
    form.name = ''
    form.url = ''
    form.product = ''
    form.creator = '当前用户'
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
          const newItem: LandingPageV2 = {
            id: getNextId(),
            name: form.name,
            url: form.url,
            product: form.product,
            creator: form.creator,
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
          await request.post('/landingPagesV2', newItem)
          allData.value.unshift(newItem)
          ElMessage.success('创建成功')
        } else {
          const index = allData.value.findIndex((item) => item.id === form.id)
          if (index > -1) {
            const item = allData.value[index]
            if (item) {
              const updatedItem: LandingPageV2 = {
                ...item,
                id: item.id,
                name: form.name,
                url: form.url,
                product: form.product,
                creator: form.creator,
              }
              await request.put(`/landingPagesV2/${form.id}`, updatedItem)
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

const viewPage = (url: string) => {
  window.open(url, '_blank')
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
