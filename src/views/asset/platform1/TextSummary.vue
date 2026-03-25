<template>
  <div class="text-summary-container">
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入摘要组名称/产品查找"
        clearable
        style="width: 250px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch"
            ><el-icon><Search /></el-icon
          ></el-button>
        </template>
      </el-input>
      <el-button @click="resetSearch">重置搜索</el-button>

      <div class="flex-spacer"></div>

      <el-button type="primary" @click="openDialog('create')">新建文本摘要库</el-button>
    </div>

    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="摘要名称" min-width="150" />
      <el-table-column prop="product" label="所属产品" width="150" />
      <el-table-column label="文本摘要" min-width="250">
        <template #default="scope">
          <div v-for="(summary, index) in scope.row.summaries" :key="index" class="summary-line">
            • {{ summary }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
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
      :title="dialogType === 'create' ? '新建文本摘要库' : '编辑文本摘要库'"
      width="550px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="摘要名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入摘要名称" />
        </el-form-item>
        <el-form-item label="所属产品" prop="product">
          <el-input v-model="form.product" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="文本摘要" prop="summaries">
          <el-select
            v-model="form.summaries"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入短文本摘要后按回车添加"
            style="width: 100%"
          >
          </el-select>
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
import type { TextSummaryLibrary } from '@/mock/platform1Data'

// State
const allData = ref<TextSummaryLibrary[]>([])
const filteredData = ref<TextSummaryLibrary[]>([])
const searchKeyword = ref('')
const loading = ref(false)

const getNextId = () => String(Date.now())

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
  product: '',
  summaries: [] as string[],
})
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入摘要名称', trigger: 'blur' }],
  product: [{ required: true, message: '请输入所属产品', trigger: 'blur' }],
  summaries: [
    { required: true, type: 'array', min: 1, message: '请至少添加一条文本摘要', trigger: 'change' },
  ],
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/textSummaryLibraries')
    allData.value = (res as unknown as TextSummaryLibrary[]) || []
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
          item.name.toLowerCase().includes(keyword) || item.product.toLowerCase().includes(keyword),
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
  handleSearch()
}

const handleDelete = (row: TextSummaryLibrary) => {
  ElMessageBox.confirm('确定删除该摘要库吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/textSummaryLibraries/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const openDialog = (type: 'create' | 'edit', row?: TextSummaryLibrary) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.product = row.product
    form.summaries = [...row.summaries]
  } else {
    form.id = 0
    form.name = ''
    form.product = ''
    form.summaries = []
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
          const newItem: TextSummaryLibrary = {
            id: getNextId(),
            name: form.name,
            product: form.product,
            summaries: form.summaries,
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
          await request.post('/textSummaryLibraries', newItem)
          allData.value.unshift(newItem)
          ElMessage.success('创建成功')
        } else {
          const index = allData.value.findIndex((item) => item.id === form.id)
          if (index > -1) {
            const item = allData.value[index]
            if (item) {
              const updatedItem: TextSummaryLibrary = {
                ...item,
                id: item.id,
                name: form.name,
                product: form.product,
                summaries: form.summaries,
              }
              await request.put(`/textSummaryLibraries/${form.id}`, updatedItem)
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
.text-summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;

    .flex-spacer {
      flex: 1;
    }
  }

  .el-table {
    flex: 1;
    height: 0;
  }

  .summary-line {
    margin-bottom: 4px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.4;
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
