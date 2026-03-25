<template>
  <div class="tag-management-container">
    <!-- Left Sidebar: Tag Groups -->
    <div class="group-sidebar">
      <div class="sidebar-header">
        <h2>标签分组</h2>
        <el-button type="primary" size="small" @click="handleCreateGroup">新建分组</el-button>
      </div>

      <div class="group-list">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          :class="{ active: currentGroupId === group.id }"
          @click="selectGroup(group.id)"
        >
          <div class="group-info">
            <span class="group-name">{{ group.name }}</span>
          </div>
          <div class="group-actions">
            <!-- Stop propagation to prevent selecting when clicking actions -->
            <el-button link type="primary" size="small" @click.stop="handleEditGroup(group)"
              >编辑</el-button
            >
            <el-button link type="danger" size="small" @click.stop="handleDeleteGroup(group)"
              >删除</el-button
            >
          </div>
        </div>
        <el-empty v-if="groups.length === 0" description="暂无标签分组" />
      </div>
    </div>

    <!-- Right Content: Tags -->
    <div class="tag-content">
      <!-- Search and Filter Bar -->
      <div class="content-header">
        <el-form :inline="true" :model="filters" class="filter-form" size="default" @submit.prevent>
          <el-form-item label="标签名称">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入标签名称搜索"
              clearable
              prefix-icon="Search"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="所属分组">
            <el-select
              v-model="filters.groupId"
              placeholder="全部分组"
              clearable
              @change="handleSearch"
            >
              <el-option label="全部分组" value="" />
              <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查 询</el-button>
            <el-button @click="resetSearch">重 置</el-button>
          </el-form-item>
        </el-form>

        <div class="header-actions">
          <el-button
            type="primary"
            @click="handleCreateTag"
            :disabled="!currentGroupId && !filters.groupId"
          >
            新建标签
          </el-button>
        </div>
      </div>

      <!-- Tag Table -->
      <div class="table-container">
        <el-table v-loading="loading" :data="paginatedTags" style="width: 100%" height="100%">
          <el-table-column prop="name" label="标签名称" min-width="150" />
          <el-table-column label="所属分组" min-width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ getGroupName(row.groupId) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="materialCount"
            label="关联素材数"
            width="120"
            align="center"
            sortable
          />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEditTag(row)"
                >编辑</el-button
              >
              <el-button link type="danger" size="small" @click="handleDeleteTag(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalTags"
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

    <!-- Dialogs -->
    <!-- Group Dialog -->
    <el-dialog
      v-model="groupDialog.visible"
      :title="groupDialog.isEdit ? '编辑分组' : '新建分组'"
      width="400px"
    >
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="80px">
        <el-form-item label="分组名称" prop="name">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入分组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Tag Dialog -->
    <el-dialog
      v-model="tagDialog.visible"
      :title="tagDialog.isEdit ? '编辑标签' : '新建标签'"
      width="400px"
    >
      <el-form :model="tagForm" :rules="tagRules" ref="tagFormRef" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="tagForm.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属分组" prop="groupId">
          <el-select v-model="tagForm.groupId" placeholder="请选择分组" style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tagDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitTag">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import type { TagGroup, Tag } from '@/mock/materialData'
import { getCurrentTime } from '@/utils/time'

// --- State ---
const loading = ref(false)
const groups = ref<TagGroup[]>([])
const tags = ref<Tag[]>([])

// Selection / Filtering
const currentGroupId = ref<string>('') // empty means 'All'
const filters = reactive({
  keyword: '',
  groupId: '',
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalTags = ref(0)
const pageSizes = ref([10, 20, 50, 100])
const customPageSizeInput = ref<number>()

// Dialogs
const groupDialog = ref({ visible: false, isEdit: false })
const groupForm = ref<Partial<TagGroup>>({ id: '', name: '' })
const groupFormRef = ref<FormInstance>()
const groupRules = { name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }] }

const tagDialog = ref({ visible: false, isEdit: false })
const tagForm = ref<Partial<Tag>>({ id: '', name: '', groupId: '' })
const tagFormRef = ref<FormInstance>()
const tagRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  groupId: [{ required: true, message: '请选择所属分组', trigger: 'change' }],
}

// --- Computed ---
const filteredTags = computed(() => {
  let result = tags.value

  // Apply Group Filter (Sidebar or Top dropdoown)
  const activeGroupId = currentGroupId.value || filters.groupId
  if (activeGroupId) {
    result = result.filter((t) => t.groupId === activeGroupId)
  }

  // Apply Keyword Search
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    result = result.filter((t) => t.name.toLowerCase().includes(kw))
  }

  return result
})

const paginatedTags = computed(() => {
  totalTags.value = filteredTags.value.length
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTags.value.slice(start, start + pageSize.value)
})

// --- Lifecycle ---
const fetchData = async () => {
  loading.value = true
  try {
    const [groupsRes, tagsRes] = await Promise.all([
      request.get('/tagGroups'),
      request.get('/tags'),
    ])
    groups.value = (groupsRes as unknown as TagGroup[]) || []
    tags.value = (tagsRes as unknown as Tag[]) || []
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// --- Handlers: Group ---
const selectGroup = (id: string) => {
  currentGroupId.value = currentGroupId.value === id ? '' : id
  filters.groupId = currentGroupId.value // Sync dropdown
  currentPage.value = 1
}

const handleCreateGroup = () => {
  groupDialog.value = { visible: true, isEdit: false }
  groupForm.value = { id: '', name: '' }
}

const handleEditGroup = (group: TagGroup) => {
  groupDialog.value = { visible: true, isEdit: true }
  groupForm.value = { ...group }
}

const submitGroup = async () => {
  if (!groupFormRef.value) return
  await groupFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (groupDialog.value.isEdit) {
          const index = groups.value.findIndex((g) => g.id === groupForm.value.id)
          if (index > -1) {
            const existing = groups.value[index]!
            const updatedGroup: TagGroup = {
              id: existing.id,
              name: groupForm.value.name as string,
              createTime: existing.createTime,
              updateTime: getCurrentTime(),
            }
            await request.put(`/tagGroups/${groupForm.value.id}`, updatedGroup)
            groups.value[index] = updatedGroup
            ElMessage.success('分组已更新')
          }
        } else {
          const newGroup = {
            id: 'g' + Date.now(),
            name: groupForm.value.name as string,
            createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          }
          await request.post('/tagGroups', newGroup)
          groups.value.push(newGroup)
          ElMessage.success('分组已创建')
        }
        groupDialog.value.visible = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDeleteGroup = (group: TagGroup) => {
  const hasTags = tags.value.some((t) => t.groupId === group.id)
  if (hasTags) {
    ElMessage.warning('该分组下仍有标签，无法直接删除')
    return
  }
  ElMessageBox.confirm(`确定要删除分组 "${group.name}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/tagGroups/${group.id}`)
        groups.value = groups.value.filter((g) => g.id !== group.id)
        if (currentGroupId.value === group.id) selectGroup('')
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// --- Handlers: Tags ---
const handleSearch = () => {
  currentGroupId.value = filters.groupId // Sync sidebar if dropdown used
  currentPage.value = 1
}

const resetSearch = () => {
  filters.keyword = ''
  filters.groupId = ''
  currentGroupId.value = ''
  currentPage.value = 1
}

const handleCreateTag = () => {
  tagDialog.value = { visible: true, isEdit: false }
  tagForm.value = {
    id: '',
    name: '',
    groupId: currentGroupId.value || filters.groupId || groups.value[0]?.id || '',
  }
}

const handleEditTag = (tag: Tag) => {
  tagDialog.value = { visible: true, isEdit: true }
  tagForm.value = { ...tag }
}

const submitTag = async () => {
  if (!tagFormRef.value) return
  await tagFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (tagDialog.value.isEdit) {
          const index = tags.value.findIndex((t) => t.id === tagForm.value.id)
          if (index > -1) {
            const existing = tags.value[index]
            if (existing) {
              const updatedTag: Tag = {
                id: existing.id,
                name: tagForm.value.name as string,
                groupId: tagForm.value.groupId as string,
                materialCount: existing.materialCount,
                createTime: existing.createTime,
                updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              }
              await request.put(`/tags/${tagForm.value.id}`, updatedTag)
              tags.value[index] = updatedTag
              ElMessage.success('标签已更新')
            }
          }
        } else {
          const newTag = {
            id: 't' + Date.now(),
            name: tagForm.value.name as string,
            groupId: tagForm.value.groupId as string,
            materialCount: 0,
            createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          }
          await request.post('/tags', newTag)
          tags.value.unshift(newTag)
          ElMessage.success('标签已创建')
        }
        tagDialog.value.visible = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDeleteTag = (tag: Tag) => {
  if (tag.materialCount > 0) {
    ElMessageBox.confirm(
      `该标签关联了 ${tag.materialCount} 个素材，删除后对应素材的标签将被移除。确定删除？`,
      '高危操作',
      { type: 'error' },
    ).then(() => performDelete())
  } else {
    ElMessageBox.confirm(`确定删除标签 "${tag.name}" 吗？`, '提示', { type: 'warning' }).then(() =>
      performDelete(),
    )
  }

  async function performDelete() {
    try {
      await request.delete(`/tags/${tag.id}`)
      tags.value = tags.value.filter((t) => t.id !== tag.id)
      ElMessage.success('标签已删除')
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
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

// --- Utils ---
const getGroupName = (groupId: string) => {
  return groups.value.find((g) => g.id === groupId)?.name || '未知分组'
}
</script>

<style scoped lang="scss">
.tag-management-container {
  display: flex;
  height: calc(100vh - 84px);
  gap: 16px;
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
}

.group-sidebar {
  width: 260px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ebeef5;

    h2 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }

  .group-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .group-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        background-color: #ecf5ff;
        border-color: #c6e2ff;
        color: #409eff;

        .group-name {
          font-weight: 600;
        }
      }

      .group-name {
        font-size: 14px;
        color: #303133;
      }

      .group-actions {
        display: none; // Show on hover generally, or managed locally
        gap: 8px;
      }

      &:hover .group-actions {
        display: flex;
      }
    }
  }
}

.tag-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .content-header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .filter-form {
      flex: 1;
      margin-bottom: 0;
      display: flex;
      align-items: center;

      .el-form-item {
        margin-bottom: 0;
        margin-right: 16px;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .table-container {
    flex: 1;
    padding: 20px;
    overflow: hidden;
  }

  .pagination-wrapper {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
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
