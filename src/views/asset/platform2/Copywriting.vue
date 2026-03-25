<template>
  <div class="copywriting-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="文案包名称"
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
        <el-button type="primary" @click="openDialog('create')">新建文案包</el-button>
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
      <el-table-column prop="name" label="文案包名称" min-width="150" />
      <el-table-column prop="product" label="关联产品" width="150" />
      <el-table-column prop="creator" label="创建人" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openViewDialog(scope.row)">查看</el-button>
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
      :title="dialogType === 'create' ? '新建广告文案包' : '编辑广告文案包'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="文案包名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入文案包名称" />
        </el-form-item>
        <el-form-item label="关联产品" prop="product">
          <el-input v-model="form.product" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="创建人" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入创建人姓名" />
        </el-form-item>
        <el-form-item label="文案内容" prop="content">
          <div class="content-list">
            <div v-for="(text, index) in form.content" :key="index" class="content-item">
              <el-input
                v-model="form.content[index]"
                type="textarea"
                :rows="2"
                placeholder="请输入文案内容"
              />
              <el-button
                type="danger"
                plain
                circle
                @click="removeContentItem(index)"
                class="remove-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button plain @click="addContentItem" style="width: 100%; border-dashed: true"
              >+ 添加文案</el-button
            >
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewDialogVisible" title="文案包详情" width="500px">
      <div v-if="currentViewData" class="view-details">
        <div class="header-info">
          <h3>{{ currentViewData.name }}</h3>
          <p class="meta">
            产品: {{ currentViewData.product }} | 创建人: {{ currentViewData.creator }} |
            {{ currentViewData.createTime }}
          </p>
        </div>
        <el-divider>文案列表</el-divider>
        <div class="text-content">
          <div v-for="(text, index) in currentViewData.content" :key="index" class="text-item">
            <span class="index">{{ index + 1 }}.</span> {{ text }}
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import type { CopywritingPackage } from '@/mock/platform2Data'

// State
const allData = ref<CopywritingPackage[]>([])
const filteredData = ref<CopywritingPackage[]>([])
const loading = ref(false)
const selectedRows = ref<CopywritingPackage[]>([])

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
  product: '',
  creator: '',
  content: [] as string[],
})
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入文案包名称', trigger: 'blur' }],
  product: [{ required: true, message: '请输入关联产品', trigger: 'blur' }],
  creator: [{ required: true, message: '请输入创建人', trigger: 'blur' }],
  content: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条文案'))
        } else if (value.some((item: string) => !item.trim())) {
          callback(new Error('文案内容不能为空'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// View Dialog State
const viewDialogVisible = ref(false)
const currentViewData = ref<CopywritingPackage | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/copywritingPackages')
    allData.value = (res as unknown as CopywritingPackage[]) || []
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

const handleSelectionChange = (val: CopywritingPackage[]) => {
  selectedRows.value = val
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 项吗？`, '警告', {
    type: 'warning',
  })
    .then(async () => {
      try {
        const ids = selectedRows.value.map((item) => item.id)
        await Promise.all(ids.map((id) => request.delete(`/copywritingPackages/${id}`)))
        allData.value = allData.value.filter((item) => !ids.map(String).includes(String(item.id)))
        selectedRows.value = []
        filterData()
        ElMessage.success('批量删除成功')
      } catch (e) {
        ElMessage.error('批量删除失败')
      }
    })
    .catch(() => {})
}

const handleDelete = (row: CopywritingPackage) => {
  ElMessageBox.confirm('确定删除该文案包吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/copywritingPackages/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// Form Dynamic Inputs
const addContentItem = () => {
  form.content.push('')
}

const removeContentItem = (index: number) => {
  form.content.splice(index, 1)
}

const openDialog = (type: 'create' | 'edit', row?: CopywritingPackage) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.product = row.product
    form.creator = row.creator
    form.content = [...row.content]
  } else {
    form.id = 0
    form.name = ''
    form.product = ''
    form.creator = '当前用户'
    form.content = ['']
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
          const newItem: CopywritingPackage = {
            id: getNextId(),
            name: form.name,
            product: form.product,
            creator: form.creator,
            content: [...form.content],
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
          await request.post('/copywritingPackages', newItem)
          allData.value.unshift(newItem)
          ElMessage.success('创建成功')
        } else {
          const index = allData.value.findIndex((item) => item.id === form.id)
          if (index > -1) {
            const item = allData.value[index]
            if (item) {
              const updatedItem: CopywritingPackage = {
                ...item,
                id: item.id, // Explicitly set id to avoid spread issue
                name: form.name,
                product: form.product,
                creator: form.creator,
                content: [...form.content],
              }
              await request.put(`/copywritingPackages/${form.id}`, updatedItem)
              allData.value.splice(index, 1, updatedItem)
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

const openViewDialog = (row: CopywritingPackage) => {
  currentViewData.value = row
  viewDialogVisible.value = true
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
.copywriting-container {
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

.content-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  .content-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .remove-btn {
      flex-shrink: 0;
    }
  }
}

.view-details {
  .header-info {
    text-align: center;

    h3 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    .meta {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .text-content {
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    padding: 16px;

    .text-item {
      margin-bottom: 12px;
      line-height: 1.5;
      font-size: 14px;
      color: var(--el-text-color-regular);

      &:last-child {
        margin-bottom: 0;
      }

      .index {
        font-weight: bold;
        color: var(--el-color-primary);
        margin-right: 4px;
      }
    }
  }
}
</style>
