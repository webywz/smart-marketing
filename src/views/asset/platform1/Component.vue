<template>
  <div class="component-lib-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="组件ID/名称"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="productFilter"
          placeholder="产品名称"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="advIdFilter"
          placeholder="广告主"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="typeFilter"
          placeholder="组件类型"
          clearable
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option label="转化组件" value="转化组件" />
          <el-option label="展示组件" value="展示组件" />
          <el-option label="互动组件" value="互动组件" />
        </el-select>

        <el-button type="primary" @click="handleSearch"
          ><el-icon><Search /></el-icon> 搜索</el-button
        >
        <el-button @click="resetSearch">重置搜索</el-button>
      </div>

      <div class="actions">
        <el-button type="primary" plain @click="syncData">同步组件</el-button>
      </div>
    </div>

    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="组件ID" width="100" />
      <el-table-column prop="name" label="组件名称" min-width="150" />
      <el-table-column prop="type" label="组件类型" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.type === '转化组件' ? 'success' : 'info'">{{
            scope.row.type
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="product" label="所属产品" width="150" />
      <el-table-column prop="advertiserId" label="广告主" width="150" />
      <el-table-column prop="createTime" label="同步时间" width="180" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'
import type { ComponentLibrary } from '@/mock/platform1Data'

// State
const allData = ref<ComponentLibrary[]>([])
const filteredData = ref<ComponentLibrary[]>([])
const loading = ref(false)

// Filters
const searchKeyword = ref('')
const productFilter = ref('')
const advIdFilter = ref('')
const typeFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/componentLibraries')
    allData.value = (res as unknown as ComponentLibrary[]) || []
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

    if (typeFilter.value) {
      result = result.filter((item) => item.type === typeFilter.value)
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
  typeFilter.value = ''
  handleSearch()
}

const syncData = async () => {
  loading.value = true
  setTimeout(async () => {
    try {
      const newItem: ComponentLibrary = {
        id: String(Date.now()),
        name: `同步组件_${new Date().getMinutes()}`,
        type: '转化组件',
        product: '同步产品',
        advertiserId: 'ADV_SYNC',
        createTime: getCurrentTime(),
      }
      await request.post('/componentLibraries', newItem)
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

const handleDelete = (row: ComponentLibrary) => {
  ElMessageBox.confirm('确定删除该组件吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/componentLibraries/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
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
.component-lib-container {
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
