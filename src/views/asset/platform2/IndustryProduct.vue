<template>
  <div class="industry-product-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="行业产品名称/ID"
          clearable
          style="width: 200px"
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
          v-model="advIdFilter"
          placeholder="广告账户"
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
        <el-button type="primary" plain @click="syncData">同步行业产品</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>
    </div>

    <el-table
      :data="paginatedData"
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" label="行业产品名称" min-width="150" />
      <el-table-column prop="product" label="关联产品" width="150" />
      <el-table-column prop="advertiserId" label="广告账户" width="150" />
      <el-table-column prop="createTime" label="同步/创建时间" width="180" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row)">彻底删除</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'
import type { IndustryProduct } from '@/mock/platform2Data'

// State
const allData = ref<IndustryProduct[]>([])
const filteredData = ref<IndustryProduct[]>([])
const loading = ref(false)
const selectedRows = ref<IndustryProduct[]>([])

// Filters
const searchKeyword = ref('')
const productFilter = ref('')
const advIdFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/industryProducts')
    allData.value = (res as unknown as IndustryProduct[]) || []
    filterData()
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
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
        (item) => item.name.toLowerCase().includes(keyword) || item.id.toString() === keyword,
      )
    }

    if (productFilter.value) {
      result = result.filter((item) =>
        item.product.toLowerCase().includes(productFilter.value.toLowerCase()),
      )
    }

    if (advIdFilter.value) {
      result = result.filter((item) =>
        item.advertiserId.toLowerCase().includes(advIdFilter.value.toLowerCase()),
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
  advIdFilter.value = ''
  handleSearch()
}

const handleSelectionChange = (val: IndustryProduct[]) => {
  selectedRows.value = val
}

const syncData = async () => {
  loading.value = true
  setTimeout(async () => {
    try {
      const newItem: IndustryProduct = {
        id: String(Date.now()),
        name: `同步行业包_${new Date().getMinutes()}`,
        product: '同步产品',
        advertiserId: 'ADV_SYNC',
        createTime: getCurrentTime(),
      }
      await request.post('/industryProducts', newItem)
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

const handleDelete = (row: IndustryProduct) => {
  ElMessageBox.confirm('确定删除该行业产品吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/industryProducts/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 项吗？`, '警告', {
    type: 'warning',
  })
    .then(async () => {
      try {
        const ids = selectedRows.value.map((item) => item.id)
        await Promise.all(ids.map((id) => request.delete(`/industryProducts/${id}`)))
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
.industry-product-container {
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
