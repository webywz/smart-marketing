<template>
  <div class="material-container">
    <!-- Filter Section -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form" size="default">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="关 键 字">
              <el-input v-model="filters.keyword" placeholder="搜索素材名称/标签" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="素材类型">
              <el-select
                v-model="filters.types"
                multiple
                collapse-tags
                placeholder="选择类型"
                clearable
              >
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="文档" value="application" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属目录">
              <el-select v-model="filters.folderId" placeholder="选择文件夹" clearable>
                <el-option
                  v-for="folder in folderList"
                  :key="folder.id"
                  :label="folder.name"
                  :value="folder.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-show="showAdvancedFilters">
          <el-col :span="6">
            <el-form-item label="自定标签">
              <el-select
                v-model="filters.tags"
                multiple
                collapse-tags
                placeholder="选择标签"
                clearable
              >
                <el-option
                  v-for="tag in tagList"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="平台标签">
              <el-select
                v-model="filters.platformTags"
                multiple
                collapse-tags
                placeholder="选择平台标签"
                clearable
              >
                <el-option v-for="tag in platformTagList" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="审核状态">
              <el-select v-model="filters.auditStatus" placeholder="选择状态" clearable>
                <el-option label="已通过" value="approved" />
                <el-option label="待审核" value="pending" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="启用状态">
              <el-select v-model="filters.status" placeholder="选择状态" clearable>
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="使用层级">
              <el-select v-model="filters.usageTier" placeholder="选择层级" clearable>
                <el-option label="高价值（总使用≥500）" value="highValue" />
                <el-option label="闲置（总使用≤10）" value="idle" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="使用区间">
              <div class="usage-range">
                <el-input-number
                  v-model="filters.usageMin"
                  :min="0"
                  :controls="false"
                  placeholder="最小值"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  v-model="filters.usageMax"
                  :min="0"
                  :controls="false"
                  placeholder="最大值"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设 计 师">
              <el-select v-model="filters.designer" placeholder="选择设计师" clearable>
                <el-option v-for="p in personnelList.designers" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="创 意 人">
              <el-select v-model="filters.creator" placeholder="选择创意人" clearable>
                <el-option v-for="p in personnelList.creators" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="参演人员">
              <el-select v-model="filters.actors" placeholder="选择参演人员" clearable>
                <el-option v-for="p in personnelList.actors" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="拍摄人员">
              <el-select v-model="filters.photographer" placeholder="选择拍摄人员" clearable>
                <el-option v-for="p in personnelList.photographers" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="脚本人员">
              <el-select v-model="filters.scriptwriter" placeholder="选择脚本人员" clearable>
                <el-option v-for="p in personnelList.scriptwriters" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="片头制作">
              <el-select v-model="filters.introMaker" placeholder="选择片头制作" clearable>
                <el-option v-for="p in personnelList.introMakers" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="收    藏">
              <el-switch v-model="filters.isFavorite" active-text="仅看收藏" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查 询</el-button>
          <el-button @click="resetFilters">重 置</el-button>
          <el-button link type="primary" @click="showAdvancedFilters = !showAdvancedFilters">
            {{ showAdvancedFilters ? '收起高级筛选' : '展开高级筛选' }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="handleUpload">上传素材</el-button>
        <el-button type="warning" @click="handleGenerateDerivedMaterial">生成衍生素材</el-button>
        <el-button type="success" :loading="syncing" @click="handleSync">同步数据</el-button>
        <el-button type="info" @click="openExportDialog">导出数据</el-button>

        <el-dropdown trigger="click" style="margin-left: 12px" :disabled="selectedIds.length === 0">
          <el-button type="warning">
            批量操作 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="batchAction('enable')">批量启用</el-dropdown-item>
              <el-dropdown-item @click="batchAction('disable')">批量禁用</el-dropdown-item>
              <el-dropdown-item divided @click="batchAction('favorite')">批量收藏</el-dropdown-item>
              <el-dropdown-item @click="batchAction('unfavorite')">取消收藏</el-dropdown-item>
              <el-dropdown-item divided @click="batchAction('move')">修改文件夹</el-dropdown-item>
              <el-dropdown-item @click="batchAction('personnel')">修改人员信息</el-dropdown-item>
              <el-dropdown-item
                divided
                style="color: var(--el-color-danger)"
                @click="batchAction('delete')"
                >批量删除</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="action-right">
        <el-popover placement="bottom-end" :width="360" trigger="click">
          <template #reference>
            <el-button>自定义列</el-button>
          </template>
          <el-space style="margin-bottom: 12px">
            <el-button size="small" @click="selectAllTableColumns">全选</el-button>
            <el-button size="small" @click="resetTableColumns">恢复默认</el-button>
          </el-space>
          <el-checkbox-group v-model="selectedTableColumnKeys" class="table-column-group">
            <el-checkbox
              v-for="column in tableColumnOptions"
              :key="column.key"
              :value="column.key"
              :disabled="column.fixed"
            >
              {{ column.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-popover>
      </div>
    </div>

    <!-- Data Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="paginatedList"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        height="100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column v-if="isColumnVisible('preview')" label="预览" width="80">
          <template #default="{ row }">
            <el-image
              :src="row.thumbnail"
              :preview-src-list="[row.url]"
              fit="cover"
              class="table-thumb"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('name')"
          prop="name"
          label="素材名称"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="name-col">
              {{ row.name }}
              <el-icon v-if="row.isFavorite" color="#e6a23c" class="fav-icon"
                ><StarFilled
              /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isColumnVisible('status')" prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('auditStatus')"
          prop="auditStatus"
          label="审核状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getAuditTagType(row.auditStatus)" size="small">
              {{ getAuditLabel(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Sorting enabled columns -->
        <el-table-column
          v-if="isColumnVisible('createTime')"
          prop="createTime"
          label="上传时间"
          sortable="custom"
          width="160"
        />
        <el-table-column
          v-if="isColumnVisible('usageCount')"
          prop="usageCount"
          label="总使用次数"
          sortable="custom"
          width="120"
        />
        <el-table-column
          v-if="isColumnVisible('platform1Usage')"
          prop="platform1Usage"
          label="平台1使用"
          sortable="custom"
          width="120"
        />
        <el-table-column
          v-if="isColumnVisible('platform2Usage')"
          prop="platform2Usage"
          label="平台2使用"
          sortable="custom"
          width="120"
        />
        <el-table-column
          v-if="isColumnVisible('approvalRate')"
          prop="approvalRate"
          label="卡审率 (%)"
          sortable="custom"
          width="120"
        >
          <template #default="{ row }">{{ row.approvalRate }}%</template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('tags')"
          label="标签"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="tag in getMergedTags(row)" :key="tag" size="small">{{ tag }}</el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEditMaterial(row)"
              >元数据</el-button
            >
            <el-button link type="primary" size="small" @click="toggleFavorite(row)">
              {{ row.isFavorite ? '取消收藏' : '收藏' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
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
    </el-card>

    <!-- Dialog Placeholder -->
    <el-dialog v-model="metaDialogVisible" title="编辑高级元数据" width="600px">
      <el-form :model="metaForm" label-width="100px" size="default">
        <el-form-item label="素材名称">
          <el-input v-model="metaForm.name" disabled />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设 计 师">
              <el-select
                v-model="metaForm.designer"
                placeholder="选择设计师"
                clearable
                filterable
                allow-create
              >
                <el-option v-for="p in personnelList.designers" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创 意 人">
              <el-select
                v-model="metaForm.creator"
                placeholder="选择创意人"
                clearable
                filterable
                allow-create
              >
                <el-option v-for="p in personnelList.creators" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拍摄人员">
              <el-select
                v-model="metaForm.photographer"
                placeholder="选择拍摄人员"
                clearable
                filterable
                allow-create
              >
                <el-option
                  v-for="p in personnelList.photographers"
                  :key="p"
                  :label="p"
                  :value="p"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参演人员">
              <el-input v-model="metaForm.actors" placeholder="如：吴磊,虚拟形象Alpha" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脚本人员">
              <el-select
                v-model="metaForm.scriptwriter"
                placeholder="选择脚本人员"
                clearable
                filterable
                allow-create
              >
                <el-option
                  v-for="p in personnelList.scriptwriters"
                  :key="p"
                  :label="p"
                  :value="p"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="片头制作">
              <el-select
                v-model="metaForm.introMaker"
                placeholder="选择片头制作"
                clearable
                filterable
                allow-create
              >
                <el-option v-for="p in personnelList.introMakers" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="自定义标签">
              <el-select
                v-model="metaForm.tags"
                multiple
                allow-create
                filterable
                default-first-option
                placeholder="添加标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tagList"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="metaDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMeta">保存</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- Batch Move Dialog -->
    <el-dialog v-model="batchMoveDialogVisible" title="批量修改文件夹" width="400px">
      <el-form label-width="100px">
        <el-form-item label="目标文件夹">
          <el-select v-model="batchMoveFolderId" placeholder="请选择文件夹" style="width: 100%">
            <el-option
              v-for="folder in folderList"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchMoveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchMove">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Batch Personnel Dialog -->
    <el-dialog v-model="batchPersonnelDialogVisible" title="批量修改人员信息" width="500px">
      <el-form :model="batchPersonnelForm" label-width="100px">
        <el-form-item label="设 计 师">
          <el-select
            v-model="batchPersonnelForm.designer"
            placeholder="不修改"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="p in personnelList.designers" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="创 意 人">
          <el-select
            v-model="batchPersonnelForm.creator"
            placeholder="不修改"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="p in personnelList.creators" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="拍摄人员">
          <el-select
            v-model="batchPersonnelForm.photographer"
            placeholder="不修改"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="p in personnelList.photographers" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="脚本人员">
          <el-select
            v-model="batchPersonnelForm.scriptwriter"
            placeholder="不修改"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="p in personnelList.scriptwriters" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="参演人员">
          <el-input
            v-model="batchPersonnelForm.actors"
            placeholder="不修改（如：吴磊,虚拟形象Alpha）"
            clearable
          />
        </el-form-item>
        <el-form-item label="片头制作">
          <el-select
            v-model="batchPersonnelForm.introMaker"
            placeholder="不修改"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="p in personnelList.introMakers" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchPersonnelDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchPersonnel">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="exportDialogVisible" title="导出字段选择" width="560px">
      <el-space style="margin-bottom: 12px">
        <el-button size="small" @click="selectAllExportFields">全选</el-button>
        <el-button size="small" @click="resetExportFields">恢复默认</el-button>
      </el-space>
      <el-checkbox-group v-model="selectedExportFieldKeys" class="export-field-group">
        <el-checkbox v-for="field in exportFieldOptions" :key="field.key" :value="field.key">
          {{ field.label }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleExport">导出Excel</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Advanced Mock Upload Dialog -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="批量上传素材"
      width="400px"
      @close="handleUploadDialogClose"
    >
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        multiple
        @change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">将根据您选择的文件生成预览</div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :disabled="fileList.length === 0"
            >确认上传</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, StarFilled, UploadFilled } from '@element-plus/icons-vue'
import { match } from 'ts-pattern'
import { type Material } from '@/mock/materialData'
import type { UploadInstance, UploadUserFile } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'

// --- State ---
const materials = ref<Material[]>([])
const loading = ref(false)
const syncing = ref(false)
const showAdvancedFilters = ref(false)

const selectedIds = ref<string[]>([])
const metaDialogVisible = ref(false)
const metaForm = ref<Partial<Material>>({})
const exportDialogVisible = ref(false)

// Upload Dialog
const uploadDialog = ref({ visible: false })
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const router = useRouter()

// Batch Dialogs
const batchMoveDialogVisible = ref(false)
const batchMoveFolderId = ref('')

const batchPersonnelDialogVisible = ref(false)
const batchPersonnelForm = ref<{
  designer: string
  creator: string
  photographer: string
  scriptwriter: string
  actors: string
  introMaker: string
}>({
  designer: '',
  creator: '',
  photographer: '',
  scriptwriter: '',
  actors: '',
  introMaker: '',
})

// Dictionaries (loaded from backend)
const folderList = ref<{ id: string; name: string }[]>([])
const tagList = ref<{ id: string; name: string }[]>([])
const personnelList = ref<{
  designers: string[]
  creators: string[]
  photographers: string[]
  actors: string[]
  scriptwriters: string[]
  introMakers: string[]
}>({
  designers: [],
  creators: [],
  photographers: [],
  actors: [],
  scriptwriters: [],
  introMakers: [],
})
const platformTagList = ['高光影', '明亮', '年轻化', '动感', '促销', '教育'] // Could also be from API
const exportFieldOptions: Array<{
  key: string
  label: string
  getter: (item: Material) => string | number
}> = [
  { key: 'id', label: 'ID', getter: (item) => item.id },
  { key: 'name', label: '名称', getter: (item) => item.name },
  { key: 'type', label: '类型', getter: (item) => item.type },
  {
    key: 'status',
    label: '状态',
    getter: (item) => (item.status === 'enabled' ? '启用' : '禁用'),
  },
  { key: 'auditStatus', label: '审核状态', getter: (item) => getAuditLabel(item.auditStatus) },
  { key: 'folder', label: '所属目录', getter: (item) => getFolderName(item.folderId) },
  { key: 'tags', label: '标签', getter: (item) => getMergedTags(item).join('、') },
  { key: 'usageCount', label: '总使用次数', getter: (item) => item.usageCount },
  { key: 'platform1Usage', label: '平台1使用', getter: (item) => item.platform1Usage },
  { key: 'platform2Usage', label: '平台2使用', getter: (item) => item.platform2Usage },
  { key: 'approvalRate', label: '卡审率(%)', getter: (item) => item.approvalRate },
  { key: 'createTime', label: '上传时间', getter: (item) => item.createTime },
  { key: 'updateTime', label: '更新时间', getter: (item) => item.updateTime },
  { key: 'designer', label: '设计师', getter: (item) => item.designer || '' },
  { key: 'creator', label: '创意人', getter: (item) => item.creator || '' },
  { key: 'actors', label: '参演人员', getter: (item) => item.actors || '' },
  { key: 'photographer', label: '拍摄人员', getter: (item) => item.photographer || '' },
  { key: 'scriptwriter', label: '脚本人员', getter: (item) => item.scriptwriter || '' },
  { key: 'introMaker', label: '片头制作', getter: (item) => item.introMaker || '' },
  { key: 'isFavorite', label: '已收藏', getter: (item) => (item.isFavorite ? '是' : '否') },
]
const defaultExportFieldKeys = [
  'id',
  'name',
  'type',
  'auditStatus',
  'usageCount',
  'platform1Usage',
  'platform2Usage',
  'createTime',
  'updateTime',
  'designer',
  'creator',
]
const selectedExportFieldKeys = ref<string[]>([...defaultExportFieldKeys])
const tableColumnStorageKey = 'material-table-column-keys'
const tableColumnOptions = [
  { key: 'preview', label: '预览', fixed: false },
  { key: 'name', label: '素材名称', fixed: true },
  { key: 'status', label: '状态', fixed: false },
  { key: 'auditStatus', label: '审核状态', fixed: false },
  { key: 'createTime', label: '上传时间', fixed: false },
  { key: 'usageCount', label: '总使用次数', fixed: false },
  { key: 'platform1Usage', label: '平台1使用', fixed: false },
  { key: 'platform2Usage', label: '平台2使用', fixed: false },
  { key: 'approvalRate', label: '卡审率 (%)', fixed: false },
  { key: 'tags', label: '标签', fixed: false },
] as const
const fixedTableColumnKeys = tableColumnOptions
  .filter((column) => column.fixed)
  .map((column) => column.key)
const defaultTableColumnKeys = tableColumnOptions.map((column) => column.key)
const selectedTableColumnKeys = ref<string[]>([...defaultTableColumnKeys])

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const pageSizes = ref([10, 20, 50, 100, 200])
const customPageSizeInput = ref<number>()

// Sorting
const currentSort = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({
  prop: '',
  order: null,
})

// Filters
const filters = reactive({
  keyword: '',
  dateRange: [] as string[],
  types: [] as string[],
  folderId: '',
  tags: [] as string[],
  platformTags: [] as string[],
  auditStatus: '',
  status: '',
  usageTier: '',
  usageMin: undefined as number | undefined,
  usageMax: undefined as number | undefined,
  designer: '',
  creator: '',
  actors: '',
  photographer: '',
  scriptwriter: '',
  introMaker: '',
  isFavorite: false,
})

// --- Computed & Logic ---
const getMergedTags = (material: Pick<Material, 'tags' | 'platformTags'>) =>
  Array.from(new Set([...(material.tags || []), ...(material.platformTags || [])]))

const filteredList = computed(() => {
  const result = materials.value.filter((m) => {
    // Keyword match (name or fast tag match)
    if (
      filters.keyword &&
      !m.name.includes(filters.keyword) &&
      !getMergedTags(m).some((t) => t.includes(filters.keyword))
    ) {
      return false
    }
    // Type
    if (filters.types.length > 0) {
      const baseType = m.type.split('/')[0] || ''
      if (!filters.types.includes(baseType) && !filters.types.includes(m.type)) return false
    }
    // Date Range
    if (filters.dateRange && filters.dateRange.length === 2) {
      const cTime = new Date(m.createTime).getTime()
      const sTime = new Date(filters.dateRange[0] as string).getTime()
      const eTime = new Date(filters.dateRange[1] as string).getTime()
      if (cTime < sTime || cTime > eTime) return false
    }
    // Specifics
    if (filters.folderId && m.folderId !== filters.folderId) return false
    if (filters.auditStatus && m.auditStatus !== filters.auditStatus) return false
    if (filters.status && m.status !== filters.status) return false
    const usageCount = Number(m.usageCount || 0)
    if (filters.usageTier === 'highValue' && usageCount < 500) return false
    if (filters.usageTier === 'idle' && usageCount > 10) return false
    if (typeof filters.usageMin === 'number' && usageCount < filters.usageMin) return false
    if (typeof filters.usageMax === 'number' && usageCount > filters.usageMax) return false
    if (filters.isFavorite && !m.isFavorite) return false
    if (filters.designer && m.designer !== filters.designer) return false
    if (filters.creator && m.creator !== filters.creator) return false
    if (filters.actors && m.actors !== filters.actors) return false
    if (filters.photographer && m.photographer !== filters.photographer) return false
    if (filters.scriptwriter && m.scriptwriter !== filters.scriptwriter) return false
    if (filters.introMaker && m.introMaker !== filters.introMaker) return false

    const selectedTags = Array.from(new Set([...filters.tags, ...filters.platformTags]))
    if (selectedTags.length > 0) {
      const mergedTags = getMergedTags(m)
      if (!selectedTags.some((tag) => mergedTags.includes(tag))) return false
    }

    return true
  })

  // Sorting
  if (currentSort.value.prop && currentSort.value.order) {
    result.sort((a, b) => {
      const valA = a[currentSort.value.prop as keyof Material]
      const valB = b[currentSort.value.prop as keyof Material]

      let comp = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        comp = valA - valB
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comp = valA.localeCompare(valB)
      }
      return currentSort.value.order === 'ascending' ? comp : -comp
    })
  }

  return result
})

const paginatedList = computed(() => {
  total.value = filteredList.value.length
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// --- Lifecycle ---
const fetchMaterials = async () => {
  loading.value = true
  try {
    const [matRes, foldersRes, tagsRes, personnelRes] = await Promise.all([
      request.get('/materials'),
      request.get('/folders'),
      request.get('/tags'),
      request.get('/personnel'),
    ])

    if (Array.isArray(matRes)) {
      materials.value = matRes as unknown as Material[]
    } else {
      materials.value = (matRes as any).data || []
    }

    folderList.value = (foldersRes as unknown as { id: string; name: string }[]) || []
    tagList.value = (tagsRes as unknown as { id: string; name: string }[]) || []
    personnelList.value = (personnelRes as unknown as any) || { designers: [], creators: [] }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTableColumnSettings()
  fetchMaterials()
})

// --- Handlers ---
const handleSearch = () => {
  currentPage.value = 1 // reset to first page
}

const resetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    dateRange: [],
    types: [],
    folderId: '',
    tags: [],
    platformTags: [],
    auditStatus: '',
    status: '',
    usageTier: '',
    usageMin: undefined,
    usageMax: undefined,
    designer: '',
    creator: '',
    actors: '',
    photographer: '',
    scriptwriter: '',
    introMaker: '',
    isFavorite: false,
  })
  handleSearch()
}

const handleSortChange = ({
  prop,
  order,
}: {
  prop: string
  order: 'ascending' | 'descending' | null
}) => {
  currentSort.value = { prop, order }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const applyCustomPageSize = () => {
  if (
    !customPageSizeInput.value ||
    customPageSizeInput.value <= 0 ||
    customPageSizeInput.value > 500
  ) {
    ElMessage.warning('请输入1-500之间的有效数字')
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

const handleSelectionChange = (val: Material[]) => {
  selectedIds.value = val.map((m) => m.id)
}

// Actions
const handleUpload = () => {
  uploadDialog.value.visible = true
}

const handleGenerateDerivedMaterial = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先在列表中勾选要生成的素材')
    return
  }
  router.push({
    path: '/material/quick-image',
    query: {
      tool: 'get_keys',
      ids: selectedIds.value.join(','),
    },
  })
}

const handleFileChange = (_: UploadUserFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const handleUploadDialogClose = () => {
  uploadRef.value?.clearFiles()
  fileList.value = []
}

const submitUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请至少选择一个文件')
    return
  }

  const currentTime = getCurrentTime()
  const newMaterials: Material[] = []

  for (const file of fileList.value) {
    const localUrl = file.raw?.type.startsWith('image/') ? URL.createObjectURL(file.raw) : ''

    newMaterials.push({
      id: `m${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
      name: file.name,
      type: file.raw?.type || 'application/octet-stream',
      url: localUrl,
      thumbnail: localUrl,
      size: file.size || 0,
      createTime: currentTime,
      updateTime: currentTime,
      designer: '上传者',
      creator: '上传者',
      status: 'enabled',
      folderId: folderList.value[0]?.id || 'f1', // Default to first folder
      tags: [],
      platformTags: [],
      auditStatus: 'pending',
      usageCount: 0,
      platform1Usage: 0,
      platform2Usage: 0,
      approvalRate: 0,
      isFavorite: false,
    })
  }

  try {
    // Mock backend request by just adding to the local array
    const promises = newMaterials.map((m) => request.post('/materials', m))
    await Promise.all(promises)
    materials.value.unshift(...newMaterials)

    ElMessage.success(`成功添加 ${newMaterials.length} 个素材`)
    uploadDialog.value.visible = false
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const openExportDialog = () => {
  if (filteredList.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  exportDialogVisible.value = true
}

const selectAllExportFields = () => {
  selectedExportFieldKeys.value = exportFieldOptions.map((field) => field.key)
}

const resetExportFields = () => {
  selectedExportFieldKeys.value = [...defaultExportFieldKeys]
}

const isColumnVisible = (key: string) => selectedTableColumnKeys.value.includes(key)

const selectAllTableColumns = () => {
  selectedTableColumnKeys.value = [...defaultTableColumnKeys]
}

const resetTableColumns = () => {
  selectedTableColumnKeys.value = [...defaultTableColumnKeys]
}

const loadTableColumnSettings = () => {
  const raw = localStorage.getItem(tableColumnStorageKey)
  if (!raw) return
  try {
    const savedKeys = JSON.parse(raw) as string[]
    if (!Array.isArray(savedKeys)) return
    const availableKeys = new Set<string>(defaultTableColumnKeys)
    const nextKeys = savedKeys.filter((key) => availableKeys.has(key))
    if (!nextKeys.includes('platform2Usage')) {
      nextKeys.push('platform2Usage')
    }
    if (nextKeys.length > 0) {
      selectedTableColumnKeys.value = Array.from(new Set([...fixedTableColumnKeys, ...nextKeys]))
    }
  } catch {}
}

watch(
  selectedTableColumnKeys,
  (keys) => {
    if (keys.length === 0) {
      selectedTableColumnKeys.value = ['name']
      return
    }
    const normalizedKeys = Array.from(new Set([...fixedTableColumnKeys, ...keys]))
    if (normalizedKeys.length !== keys.length) {
      selectedTableColumnKeys.value = normalizedKeys
      return
    }
    localStorage.setItem(tableColumnStorageKey, JSON.stringify(normalizedKeys))
  },
  { deep: true },
)

const handleExport = () => {
  if (filteredList.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  if (selectedExportFieldKeys.value.length === 0) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }

  const selectedFields = exportFieldOptions.filter((field) =>
    selectedExportFieldKeys.value.includes(field.key),
  )
  const tableHead = selectedFields.map((field) => `<th>${escapeForHtml(field.label)}</th>`).join('')
  const tableRows = filteredList.value
    .map((item) => {
      const cells = selectedFields
        .map((field) => `<td>${escapeForHtml(field.getter(item))}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`
  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `material_export_${new Date().getTime()}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  exportDialogVisible.value = false
  ElMessage.success(`已导出 ${filteredList.value.length} 条数据`)
}

const handleSync = async () => {
  syncing.value = true
  try {
    // Mock sync: fetching "remote" items and adding them if not exist
    // For demo, we just add one mock item
    const syncItem: Material = {
      id: 'sync_' + Date.now(),
      name: `同步素材_${new Date().getSeconds()}.mp4`,
      type: 'video/mp4',
      url: 'https://via.placeholder.com/600x400?text=Sync',
      thumbnail: 'https://via.placeholder.com/150?text=Sync',
      size: 5000000,
      status: 'enabled',
      folderId: folderList.value[0]?.id || 'f1',
      tags: ['同步'],
      platformTags: [],
      auditStatus: 'approved',
      usageCount: 0,
      platform1Usage: 0,
      platform2Usage: 0,
      approvalRate: 100,
      isFavorite: false,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }
    await request.post('/materials', syncItem)
    materials.value.unshift(syncItem)
    ElMessage.success('外部系统对接同步完成')
  } catch (e) {
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const toggleFavorite = async (row: Material) => {
  const newValue = !row.isFavorite
  try {
    await request.patch(`/materials/${row.id}`, { isFavorite: newValue })
    row.isFavorite = newValue
    ElMessage.success(newValue ? '已加入收藏' : '已取消收藏')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = (row: Material) => {
  ElMessageBox.confirm('确定要删除该素材吗？', '警告', { type: 'warning' })
    .then(async () => {
      try {
        await request.delete(`/materials/${row.id}`)
        materials.value = materials.value.filter((m) => m.id !== row.id)
        ElMessage.success('删除成功')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const handleEditMaterial = (row: Material) => {
  metaForm.value = JSON.parse(JSON.stringify(row))
  metaDialogVisible.value = true
}

const submitMeta = async () => {
  const index = materials.value.findIndex((m) => m.id === metaForm.value.id)
  if (index !== -1) {
    try {
      const updatedItem = { ...materials.value[index], ...(metaForm.value as Material) }
      // Update time
      updatedItem.updateTime = getCurrentTime()

      await request.put(`/materials/${metaForm.value.id}`, updatedItem)
      materials.value[index] = updatedItem
      ElMessage.success('元数据保存成功')
      metaDialogVisible.value = false
    } catch (e) {
      ElMessage.error('保存失败')
    }
  }
}

const submitBatchMove = async () => {
  if (!batchMoveFolderId.value) {
    ElMessage.warning('请选择目标文件夹')
    return
  }
  const ids = [...selectedIds.value]
  try {
    const promises = ids.map((id) =>
      request.patch(`/materials/${id}`, {
        folderId: batchMoveFolderId.value,
        updateTime: getCurrentTime(),
      }),
    )
    await Promise.all(promises)

    // Update local
    materials.value.forEach((m) => {
      if (ids.includes(m.id)) {
        m.folderId = batchMoveFolderId.value
        m.updateTime = getCurrentTime()
      }
    })

    ElMessage.success(`成功移动 ${ids.length} 个素材`)
    batchMoveDialogVisible.value = false
    selectedIds.value = [] // Clear selection
  } catch (e) {
    ElMessage.error('批量移动失败')
  }
}

const submitBatchPersonnel = async () => {
  const updates: Partial<
    Pick<
      Material,
      'designer' | 'creator' | 'photographer' | 'scriptwriter' | 'actors' | 'introMaker' | 'updateTime'
    >
  > = {}
  if (batchPersonnelForm.value.designer) updates.designer = batchPersonnelForm.value.designer
  if (batchPersonnelForm.value.creator) updates.creator = batchPersonnelForm.value.creator
  if (batchPersonnelForm.value.photographer)
    updates.photographer = batchPersonnelForm.value.photographer
  if (batchPersonnelForm.value.scriptwriter)
    updates.scriptwriter = batchPersonnelForm.value.scriptwriter
  if (batchPersonnelForm.value.actors) updates.actors = batchPersonnelForm.value.actors
  if (batchPersonnelForm.value.introMaker) updates.introMaker = batchPersonnelForm.value.introMaker

  if (Object.keys(updates).length === 0) {
    ElMessage.warning('未修改任何信息')
    return
  }

  updates.updateTime = getCurrentTime()
  const ids = [...selectedIds.value]

  try {
    const promises = ids.map((id) => request.patch(`/materials/${id}`, updates))
    await Promise.all(promises)

    // Update local
    materials.value.forEach((m) => {
      if (ids.includes(m.id)) {
        Object.assign(m, updates)
      }
    })

    ElMessage.success(`成功修改 ${ids.length} 个素材的信息`)
    batchPersonnelDialogVisible.value = false
    selectedIds.value = [] // Clear selection
  } catch (e) {
    ElMessage.error('批量修改失败')
  }
}

const batchAction = async (action: string) => {
  const count = selectedIds.value.length
  if (!count) return
  const ids = [...selectedIds.value]

  try {
    await match(action)
      .with('enable', async () => {
        const promises = ids.map((id) => request.patch(`/materials/${id}`, { status: 'enabled' }))
        await Promise.all(promises)
        materials.value.forEach((m) => ids.includes(m.id) && (m.status = 'enabled'))
        ElMessage.success(`已启用 ${count} 个素材`)
      })
      .with('disable', async () => {
        const promises = ids.map((id) => request.patch(`/materials/${id}`, { status: 'disabled' }))
        await Promise.all(promises)
        materials.value.forEach((m) => ids.includes(m.id) && (m.status = 'disabled'))
        ElMessage.success(`已禁用 ${count} 个素材`)
      })
      .with('favorite', async () => {
        const promises = ids.map((id) => request.patch(`/materials/${id}`, { isFavorite: true }))
        await Promise.all(promises)
        materials.value.forEach((m) => ids.includes(m.id) && (m.isFavorite = true))
        ElMessage.success(`已收藏 ${count} 个素材`)
      })
      .with('unfavorite', async () => {
        const promises = ids.map((id) => request.patch(`/materials/${id}`, { isFavorite: false }))
        await Promise.all(promises)
        materials.value.forEach((m) => ids.includes(m.id) && (m.isFavorite = false))
        ElMessage.success(`取消收藏 ${count} 个素材`)
      })
      .with('delete', async () => {
        await ElMessageBox.confirm('确定要删除选中的素材吗？', '警告')
        await Promise.all(ids.map((id) => request.delete(`/materials/${id}`)))
        materials.value = materials.value.filter((m) => !ids.includes(m.id))
        selectedIds.value = []
        ElMessage.success(`删除了 ${count} 个素材`)
      })
      .with('move', () => {
        batchMoveFolderId.value = ''
        batchMoveDialogVisible.value = true
        return Promise.resolve()
      })
      .with('personnel', () => {
        batchPersonnelForm.value = {
          designer: '',
          creator: '',
          photographer: '',
          scriptwriter: '',
          actors: '',
          introMaker: '',
        }
        batchPersonnelDialogVisible.value = true
        return Promise.resolve()
      })
      .otherwise(() => {
        ElMessage.info(`批量操作: ${action} 的弹窗/逻辑`)
        return Promise.resolve()
      })
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

// Utils
const getAuditTagType = (status: string) => {
  return match(status)
    .with('approved', () => 'success')
    .with('rejected', () => 'danger')
    .otherwise(() => 'warning')
}
const getAuditLabel = (status: string) => {
  return match(status)
    .with('approved', () => '已通过')
    .with('rejected', () => '已驳回')
    .otherwise(() => '待审核')
}
const getFolderName = (folderId: string) => {
  const folder = folderList.value.find((item) => item.id === folderId)
  return folder?.name || folderId
}
const escapeForHtml = (value: string | number) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<style scoped lang="scss">
.material-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px); // Adjust based on layout
  padding: 16px;
  background-color: #f0f2f5;
  box-sizing: border-box;
  gap: 16px;

  .filter-card {
    border-radius: 8px;

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .el-form-item {
      margin-bottom: 12px;
      width: 100%;
    }

    .usage-range {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;

      .el-input-number {
        flex: 1;
      }

      .range-separator {
        color: #909399;
      }
    }
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .export-field-group {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 10px;
    column-gap: 8px;
  }

  .table-column-group {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 10px;
    column-gap: 8px;
  }

  .table-card {
    flex: 1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .table-thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      cursor: pointer;
    }

    .name-col {
      display: flex;
      align-items: center;
      gap: 6px;

      .fav-icon {
        font-size: 14px;
      }
    }

    .pagination-wrapper {
      padding: 12px 16px;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      background: #fff;

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
