<template>
  <div class="targeting-container">
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入定向包名称查找"
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
      <el-button type="primary" @click="syncData">与第三方同步</el-button>
    </div>

    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="定向包名称" min-width="200" />
      <el-table-column prop="createTime" label="同步/创建时间" width="180" />
      <el-table-column label="操作" width="120" fixed="right">
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
import type { TargetingPackage } from '@/mock/platform1Data'

// State
const allData = ref<TargetingPackage[]>([])
const filteredData = ref<TargetingPackage[]>([])
const searchKeyword = ref('')
const loading = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/targetingPackages')
    allData.value = (res as unknown as TargetingPackage[]) || []
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
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()),
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

const syncData = () => {
  loading.value = true
  setTimeout(async () => {
    try {
      // Mock sync: add a new package
      const newPkg: TargetingPackage = {
        id: String(Date.now()),
        name: `同步定向包_${new Date().getHours()}_${new Date().getMinutes()}`,
        createTime: getCurrentTime(),
      }
      await request.post('/targetingPackages', newPkg)
      allData.value.unshift(newPkg)
      filterData()
      ElMessage.success('同步成功')
    } catch (e) {
      ElMessage.error('同步失败')
    } finally {
      loading.value = false
    }
  }, 1000)
}

const handleDelete = (row: TargetingPackage) => {
  ElMessageBox.confirm(`确定要移除定向包 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.delete(`/targetingPackages/${row.id}`)
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
.targeting-container {
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
