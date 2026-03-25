<template>
  <div class="product-lib-container">
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="searchName"
          placeholder="商品名称"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="searchLibName"
          placeholder="商品库名称"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="searchProduct"
          placeholder="产品"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="searchAdvId"
          placeholder="广告主"
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
        <el-button type="primary" plain @click="syncData">同步商品库</el-button>
      </div>
    </div>

    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="商品ID" width="100" />
      <el-table-column label="商品封面" width="100">
        <template #default="scope">
          <el-image
            style="width: 50px; height: 50px"
            :src="scope.row.image"
            :zoom-rate="1.2"
            :preview-src-list="[scope.row.image]"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column prop="libraryName" label="商品库名称" width="150" />
      <el-table-column prop="product" label="产品" width="120" />
      <el-table-column prop="advertiserId" label="广告主" width="150" />
      <el-table-column prop="createTime" label="同步时间" width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- View Product Dialog -->
    <el-dialog v-model="viewDialogVisible" title="查看商品详细信息" width="600px">
      <div v-if="currentViewProduct" class="product-details">
        <div class="detail-row">
          <span class="label">商品ID：</span>
          <span class="value">{{ currentViewProduct.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">商品名称：</span>
          <span class="value">{{ currentViewProduct.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">商品库名称：</span>
          <span class="value">{{ currentViewProduct.libraryName }}</span>
        </div>

        <el-divider>媒体信息</el-divider>

        <div class="media-preview">
          <div class="media-item">
            <p>商品图片</p>
            <el-image
              :src="currentViewProduct.image"
              fit="contain"
              style="width: 200px; height: 150px; background-color: #f5f7fa; border-radius: 4px"
              :preview-src-list="[currentViewProduct.image]"
            />
          </div>
          <div class="media-item" v-if="currentViewProduct.video">
            <p>商品视频</p>
            <video
              :src="currentViewProduct.video"
              controls
              style="width: 200px; height: 150px; background-color: #000; border-radius: 4px"
            ></video>
          </div>
          <div class="media-item" v-else>
            <p>商品视频</p>
            <div class="no-video">暂无视频</div>
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
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import type { ProductLibrary } from '@/mock/platform1Data'

// State
const allData = ref<ProductLibrary[]>([])
const filteredData = ref<ProductLibrary[]>([])
const loading = ref(false)

// Filters
const searchName = ref('')
const searchLibName = ref('')
const searchProduct = ref('')
const searchAdvId = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// View Dialog State
const viewDialogVisible = ref(false)
const currentViewProduct = ref<ProductLibrary | null>(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/productLibraries')
    allData.value = (res as unknown as ProductLibrary[]) || []
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

    if (searchName.value) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchName.value.toLowerCase()),
      )
    }
    if (searchLibName.value) {
      result = result.filter((item) =>
        item.libraryName.toLowerCase().includes(searchLibName.value.toLowerCase()),
      )
    }
    if (searchProduct.value) {
      result = result.filter((item) =>
        item.product.toLowerCase().includes(searchProduct.value.toLowerCase()),
      )
    }
    if (searchAdvId.value) {
      result = result.filter((item) =>
        item.advertiserId.toLowerCase().includes(searchAdvId.value.toLowerCase()),
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
  searchName.value = ''
  searchLibName.value = ''
  searchProduct.value = ''
  searchAdvId.value = ''
  handleSearch()
}

const syncData = async () => {
  loading.value = true
  try {
    const newItem: ProductLibrary = {
      id: String(Date.now()),
      name: `同步商品_${new Date().getMinutes()}`,
      libraryName: '同步商品库',
      product: '同步产品',
      advertiserId: 'ADV_SYNC',
      image: 'https://via.placeholder.com/150/FF0000',
      video: '',
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    await request.post('/productLibraries', newItem)
    allData.value.unshift(newItem)
    filterData()
    ElMessage.success('商品数据同步成功')
  } catch (e) {
    ElMessage.error('同步失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (row: ProductLibrary) => {
  ElMessageBox.confirm(`确定要移除无效商品库数据 "${row.name}" 吗？`, '二次确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.delete(`/productLibraries/${row.id}`)
        allData.value = allData.value.filter((item) => String(item.id) !== String(row.id))
        filterData()
        ElMessage.success('清理冗余商品信息成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const openViewDialog = (row: ProductLibrary) => {
  currentViewProduct.value = row
  viewDialogVisible.value = true
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped lang="scss">
.product-lib-container {
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
  }
}

.product-details {
  .detail-row {
    margin-bottom: 12px;
    font-size: 14px;

    .label {
      font-weight: bold;
      color: var(--el-text-color-regular);
      display: inline-block;
      width: 100px;
    }

    .value {
      color: var(--el-text-color-primary);
    }
  }

  .media-preview {
    display: flex;
    gap: 20px;
    justify-content: center;

    .media-item {
      text-align: center;

      p {
        margin-top: 0;
        margin-bottom: 8px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .no-video {
        width: 200px;
        height: 150px;
        background-color: #f5f7fa;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
