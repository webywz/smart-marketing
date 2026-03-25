<template>
  <div class="product-container">
    <!-- Left Sidebar: Product Groups -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>产品分组</h3>
        <el-button type="primary" link @click="openGroupDialog('create')">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <ul class="group-list">
        <li :class="['group-item', { active: activeGroupId === null }]" @click="selectGroup(null)">
          全部分组
        </li>
        <li
          v-for="group in groupList"
          :key="group.id"
          :class="['group-item', { active: activeGroupId === group.id }]"
          @click="selectGroup(group.id)"
        >
          <span class="group-name">{{ group.name }}</span>
          <div class="group-actions" v-if="activeGroupId === group.id">
            <el-icon @click.stop="openGroupDialog('edit', group)"><Edit /></el-icon>
            <el-icon @click.stop="deleteGroup(group)"><Delete /></el-icon>
          </div>
        </li>
      </ul>
    </div>

    <!-- Right Content: Products List -->
    <div class="main-content">
      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索产品名称/ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch"
                ><el-icon><Search /></el-icon
              ></el-button>
            </template>
          </el-input>

          <el-select
            v-model="statusFilter"
            placeholder="产品状态"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="有效" value="active" />
            <el-option label="无效" value="inactive" />
          </el-select>
        </div>
        <div class="actions">
          <el-button type="primary" @click="openProductDialog('create')">新建产品</el-button>
        </div>
      </div>

      <el-table :data="paginatedProducts" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片" width="100">
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
        <el-table-column prop="name" label="产品名称" min-width="150" />
        <el-table-column label="所属分组" min-width="120">
          <template #default="scope">
            {{ getGroupName(scope.row.groupId) }}
          </template>
        </el-table-column>
        <el-table-column prop="bid" label="出价(元)" width="100">
          <template #default="scope">
            {{ scope.row.bid.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openProductDialog('edit', scope.row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteProduct(scope.row)">删除</el-button>
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

    <!-- Group Dialog -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogType === 'create' ? '新建分组' : '编辑分组'"
      width="400px"
    >
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="80px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Product Dialog -->
    <el-dialog
      v-model="productDialogVisible"
      :title="productDialogType === 'create' ? '新建产品' : '编辑产品'"
      width="500px"
    >
      <el-form :model="productForm" :rules="productRules" ref="productFormRef" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="所属分组" prop="groupId">
          <el-select v-model="productForm.groupId" placeholder="请选择分组" style="width: 100%">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出价(元)" prop="bid">
          <el-input-number
            v-model="productForm.bid"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="产品图片" prop="image">
          <el-input v-model="productForm.image" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="productForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProduct">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import type { ProductGroup, Product } from '@/mock/assetData'

// Data State
const groupList = ref<ProductGroup[]>([])
const allProducts = ref<Product[]>([])
const filteredProducts = ref<Product[]>([])
const loading = ref(false)

const getNextGroupId = () => Date.now()
const getNextProductId = () => Date.now()

// View State

const activeGroupId = ref<number | null>(null)
const searchKeyword = ref('')
const statusFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

// Init Data
onMounted(async () => {
  loading.value = true
  try {
    const [groupsRes, productsRes] = await Promise.all([
      request.get('/productGroups'),
      request.get('/products'),
    ])
    groupList.value = (groupsRes as unknown as ProductGroup[]) || []
    allProducts.value = (productsRes as unknown as Product[]) || []
    filterData()
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
})

// Computed Data
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

// Methods
const getGroupName = (groupId: number | null) => {
  if (!groupId) return '-'
  const group = groupList.value.find((g) => g.id === groupId)
  return group ? group.name : '未知分组'
}

const selectGroup = (groupId: number | null) => {
  activeGroupId.value = groupId
  currentPage.value = 1
  filterData()
}

const handleSearch = () => {
  currentPage.value = 1
  filterData()
}

const filterData = () => {
  loading.value = true
  setTimeout(() => {
    let result = [...allProducts.value]

    // Filter by group
    if (activeGroupId.value !== null) {
      result = result.filter((p) => p.groupId === activeGroupId.value)
    }

    // Filter by status
    if (statusFilter.value) {
      result = result.filter((p) => p.status === statusFilter.value)
    }

    // Filter by keyword (id or name)
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(keyword) || p.id.toString() === keyword,
      )
    }

    filteredProducts.value = result
    total.value = result.length
    loading.value = false
  }, 300) // Simulate API delay
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

// --- Group Dialog Logic ---
const groupDialogVisible = ref(false)
const groupDialogType = ref<'create' | 'edit'>('create')
const groupFormRef = ref<FormInstance>()
const groupForm = reactive({
  id: 0,
  name: '',
})
const groupRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
})

const openGroupDialog = (type: 'create' | 'edit', row?: ProductGroup) => {
  groupDialogType.value = type
  if (type === 'edit' && row) {
    groupForm.id = row.id
    groupForm.name = row.name
  } else {
    groupForm.id = 0
    groupForm.name = ''
  }
  groupDialogVisible.value = true
  // Next tick to clear validation
  setTimeout(() => {
    groupFormRef.value?.clearValidate()
  }, 0)
}

const submitGroup = async () => {
  if (!groupFormRef.value) return
  await groupFormRef.value.validate((valid) => {
    if (valid) {
      if (groupDialogType.value === 'create') {
        const newGroup: ProductGroup = {
          id: getNextGroupId(),
          name: groupForm.name,
          createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }
        groupList.value.push(newGroup)
        ElMessage.success('创建成功')
      } else {
        const index = groupList.value.findIndex((g) => g.id === groupForm.id)
        if (index > -1) {
          const g = groupList.value[index]
          if (g) {
            g.name = groupForm.name
            ElMessage.success('修改成功')
          }
        }
      }
      groupDialogVisible.value = false
    }
  })
}

const deleteGroup = (row: ProductGroup) => {
  ElMessageBox.confirm(`确定要删除分组 "${row.name}" 吗？相关的产品将会被归为"未知分组"`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      groupList.value = groupList.value.filter((g) => g.id !== row.id)
      // Update products
      allProducts.value.forEach((p) => {
        if (p.groupId === row.id) {
          p.groupId = null
        }
      })
      if (activeGroupId.value === row.id) {
        activeGroupId.value = null
      }
      filterData()
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

// --- Product Dialog Logic ---
const productDialogVisible = ref(false)
const productDialogType = ref<'create' | 'edit'>('create')
const productFormRef = ref<FormInstance>()
const productForm = reactive({
  id: 0,
  name: '',
  groupId: null as number | null,
  bid: 0,
  image: '',
  status: 'active',
})
const productRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  groupId: [{ required: true, message: '请选择分组', trigger: 'change' }],
  bid: [{ required: true, message: '请输入出价', trigger: 'blur' }],
  image: [{ required: true, message: '请输入图片URL', trigger: 'blur' }],
})

const openProductDialog = (type: 'create' | 'edit', row?: Product) => {
  productDialogType.value = type
  if (type === 'edit' && row) {
    productForm.id = row.id
    productForm.name = row.name
    productForm.groupId = row.groupId
    productForm.bid = row.bid
    productForm.image = row.image
    productForm.status = row.status
  } else {
    productForm.id = 0
    productForm.name = ''
    productForm.groupId = activeGroupId.value
    productForm.bid = 0
    productForm.image = 'https://via.placeholder.com/150'
    productForm.status = 'active'
  }
  productDialogVisible.value = true
  setTimeout(() => {
    productFormRef.value?.clearValidate()
  }, 0)
}

const submitProduct = async () => {
  if (!productFormRef.value) return
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (productDialogType.value === 'create') {
          const newProduct: Product = {
            id: getNextProductId(),
            name: productForm.name,
            groupId: productForm.groupId,
            bid: productForm.bid,
            image: productForm.image,
            status: productForm.status as 'active' | 'inactive',
            createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          }
          await request.post('/products', newProduct)
          allProducts.value.unshift(newProduct)
          ElMessage.success('创建成功')
        } else {
          const index = allProducts.value.findIndex((p) => p.id === productForm.id)
          if (index > -1) {
            const p = allProducts.value[index]
            if (p) {
              const updatedProduct = {
                id: p.id,
                name: productForm.name,
                groupId: productForm.groupId,
                bid: productForm.bid,
                image: productForm.image,
                status: productForm.status as 'active' | 'inactive',
                createTime: p.createTime,
              }
              await request.put(`/products/${p.id}`, updatedProduct)
              allProducts.value[index] = updatedProduct
              ElMessage.success('修改成功')
            }
          }
        }
        filterData()
        productDialogVisible.value = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const deleteProduct = (row: Product) => {
  ElMessageBox.confirm(`确定要删除产品 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.delete(`/products/${row.id}`)
        allProducts.value = allProducts.value.filter((p) => p.id !== row.id)
        filterData()
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.product-container {
  display: flex;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .sidebar {
    width: 250px;
    border-right: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;

    .sidebar-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--el-border-color-light);

      h3 {
        margin: 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }

    .group-list {
      list-style: none;
      padding: 0;
      margin: 0;
      overflow-y: auto;
      flex: 1;

      .group-item {
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.3s;
        color: var(--el-text-color-regular);

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        &.active {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          font-weight: bold;
        }

        .group-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-actions {
          display: flex;
          gap: 8px;
          color: var(--el-text-color-secondary);

          .el-icon {
            cursor: pointer;
            &:hover {
              color: var(--el-color-primary);
            }
          }
        }
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .filters {
        display: flex;
        gap: 16px;
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
}
</style>
