<template>
  <div class="page-container">
    <el-card shadow="never" class="config-card">
      <template #header>
        <div class="card-header">
          <span>文生图配置</span>
          <div class="header-actions">
            <el-button @click="handleReset">重置填写信息</el-button>
            <el-button type="primary" :loading="generating" @click="handleGenerate">生成图片</el-button>
          </div>
        </div>
      </template>
      <el-form :model="form" label-width="90px" class="config-form">
        <el-row :gutter="12">
          <el-col :xs="24" :md="8">
            <el-form-item label="尺寸">
              <el-select v-model="form.size" class="w-full">
                <el-option label="1024 x 1024" value="1024x1024" />
                <el-option label="1536 x 1024" value="1536x1024" />
                <el-option label="1024 x 1536" value="1024x1536" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="颜色">
              <el-input v-model="form.color" placeholder="例如：蓝白、暖色调" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="数量">
              <el-input-number v-model="form.quantity" :min="1" :max="8" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="卖点">
          <el-input v-model="form.sellingPoints" placeholder="多个卖点用逗号分隔" />
        </el-form-item>
        <el-form-item label="文案">
          <el-input v-model="form.copywriting" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排除项">
          <el-input v-model="form.excludes" placeholder="例如：低清晰度、错别字、水印遮挡" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>生成结果</span>
          <div class="header-actions">
            <el-button :disabled="selectedRows.length === 0" @click="handleBatchDownload">下载数据</el-button>
            <el-button :disabled="selectedRows.length === 0" type="primary" @click="openUploadDialog"
              >上传素材库</el-button
            >
            <el-button :disabled="selectedRows.length === 0" type="danger" @click="handleBatchDelete"
              >删除图片</el-button
            >
          </div>
        </div>
      </template>
      <el-table :data="generatedList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="52" />
        <el-table-column prop="name" label="图片名称" min-width="220" />
        <el-table-column label="预览" width="110">
          <template #default="{ row }">
            <img :src="row.url" class="preview-image" alt="preview" />
          </template>
        </el-table-column>
        <el-table-column prop="generatedAt" label="生成时间" width="180" />
        <el-table-column label="配置摘要" min-width="240">
          <template #default="{ row }">
            {{ row.configSummary }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="downloadSingle(row)">下载</el-button>
            <el-button link type="primary" @click="uploadSingle(row)">上传素材库</el-button>
            <el-button link type="danger" @click="deleteSingle(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadDialogVisible" title="上传到素材库" width="420px">
      <el-form label-width="70px">
        <el-form-item label="素材目录">
          <el-select v-model="selectedFolderId" class="w-full" placeholder="请选择素材目录">
            <el-option v-for="folder in folderList" :key="folder.id" :label="folder.name" :value="folder.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="confirmUpload">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'
import type { Material } from '@/mock/materialData'
import { generateTextToImage } from '@/utils/imageGenerator'

type GeneratedItem = {
  id: string
  name: string
  url: string
  generatedAt: string
  configSummary: string
}

const getDefaultForm = () => ({
  size: '1024x1024',
  color: '品牌蓝',
  quantity: 4,
  sellingPoints: '高转化,高识别',
  copywriting: '',
  excludes: '',
})

const form = ref(getDefaultForm())
const generating = ref(false)
const generatedList = ref<GeneratedItem[]>([])
const selectedRows = ref<GeneratedItem[]>([])
const uploadDialogVisible = ref(false)
const uploading = ref(false)
const folderList = ref<{ id: string; name: string }[]>([])
const selectedFolderId = ref('')
const uploadQueue = ref<GeneratedItem[]>([])
const pageStorageKey = 'material-text-image-studio-state'

const restoreState = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(pageStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      form?: ReturnType<typeof getDefaultForm>
      generatedList?: GeneratedItem[]
      selectedFolderId?: string
    }
    form.value = { ...getDefaultForm(), ...(parsed.form || {}) }
    generatedList.value = Array.isArray(parsed.generatedList) ? parsed.generatedList : []
    if (typeof parsed.selectedFolderId === 'string') {
      selectedFolderId.value = parsed.selectedFolderId
    }
  } catch {}
}

const persistState = () => {
  if (typeof window === 'undefined') return
  const payload = {
    form: form.value,
    generatedList: generatedList.value,
    selectedFolderId: selectedFolderId.value,
  }
  window.localStorage.setItem(pageStorageKey, JSON.stringify(payload))
}

const normalizedPrompt = computed(() =>
  [form.value.copywriting, form.value.sellingPoints, form.value.color, `排除:${form.value.excludes || '无'}`]
    .filter(Boolean)
    .join(' | '),
)

const handleSelectionChange = (rows: GeneratedItem[]) => {
  selectedRows.value = rows
}

const loadFolders = async () => {
  const folders = (await request.get('/folders')) as { id: string; name: string }[]
  folderList.value = folders || []
  if (!selectedFolderId.value && folderList.value[0]) {
    selectedFolderId.value = folderList.value[0].id
  }
}

const handleReset = () => {
  form.value = getDefaultForm()
}

const handleGenerate = async () => {
  generating.value = true
  try {
    const now = Date.now()
    const responses = await Promise.all(
      Array.from({ length: form.value.quantity }, () =>
        generateTextToImage({
          prompt: normalizedPrompt.value,
          size: '1K',
          sequential_image_generation: form.value.quantity > 1 ? 'auto' : 'disabled',
          generation_num: form.value.quantity,
        }),
      ),
    )
    const items = responses.map((response, index) => {
      const firstUrl = response.imageUrls[0]
      if (!firstUrl) {
        throw new Error('接口未返回可用图片地址')
      }
      return {
        id: `txt_${now}_${index}`,
        name: `文生图_${index + 1}_${now}.png`,
        url: firstUrl,
        generatedAt: getCurrentTime(),
        configSummary: `${form.value.size} / ${form.value.color} / ${form.value.sellingPoints || '无卖点'}`,
      }
    })
    generatedList.value = [...items, ...generatedList.value]
    ElMessage.success(`已生成 ${items.length} 张图片`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片生成失败'
    ElMessage.error(message)
  } finally {
    generating.value = false
  }
}

const downloadByUrl = (url: string, name: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadSingle = (row: GeneratedItem) => {
  downloadByUrl(row.url, row.name)
}

const handleBatchDownload = () => {
  selectedRows.value.forEach((row) => downloadByUrl(row.url, row.name))
  ElMessage.success(`已触发 ${selectedRows.value.length} 张图片下载`)
}

const deleteSingle = (id: string) => {
  generatedList.value = generatedList.value.filter((item) => item.id !== id)
  selectedRows.value = selectedRows.value.filter((item) => item.id !== id)
  ElMessage.success('已删除图片')
}

const handleBatchDelete = () => {
  const selectedIds = new Set(selectedRows.value.map((item) => item.id))
  generatedList.value = generatedList.value.filter((item) => !selectedIds.has(item.id))
  selectedRows.value = []
  ElMessage.success('已批量删除图片')
}

const toMaterial = (item: GeneratedItem, folderId: string): Material & Record<string, unknown> => ({
  id: `m_${item.id}_${Date.now()}`,
  name: item.name,
  type: 'image/png',
  url: item.url,
  thumbnail: item.url,
  size: 0,
  createTime: item.generatedAt,
  updateTime: item.generatedAt,
  designer: 'AI文生图',
  creator: 'AI文生图',
  status: 'enabled',
  folderId,
  tags: ['文生图', form.value.color].filter(Boolean),
  platformTags: [],
  auditStatus: 'pending',
  usageCount: 0,
  platform1Usage: 0,
  platform2Usage: 0,
  approvalRate: 0,
  isFavorite: false,
  generationConfig: {
    ...form.value,
    generatedAt: item.generatedAt,
  },
})

const openUploadDialog = () => {
  uploadQueue.value = [...selectedRows.value]
  uploadDialogVisible.value = true
}

const uploadSingle = (row: GeneratedItem) => {
  uploadQueue.value = [row]
  uploadDialogVisible.value = true
}

const confirmUpload = async () => {
  if (!selectedFolderId.value) {
    ElMessage.warning('请先选择素材目录')
    return
  }
  if (uploadQueue.value.length === 0) {
    ElMessage.warning('暂无可上传图片')
    return
  }
  uploading.value = true
  try {
    const payloads = uploadQueue.value.map((item) => toMaterial(item, selectedFolderId.value))
    await Promise.all(payloads.map((item) => request.post('/materials', item)))
    ElMessage.success(`成功上传 ${payloads.length} 张图片到素材库`)
    uploadDialogVisible.value = false
  } finally {
    uploading.value = false
  }
}

onMounted(async () => {
  restoreState()
  await loadFolders()
})

watch(
  [form, generatedList, selectedFolderId],
  () => {
    persistState()
  },
  { deep: true },
)
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.config-form {
  margin-top: 4px;
}

.preview-image {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ebeef5;
}

.w-full {
  width: 100%;
}
</style>
