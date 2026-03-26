<template>
  <div class="page-container">
    <div class="iframe-header">
      <h2>图片快速生产</h2>
      <el-button v-if="canUploadToLibrary" type="primary" @click="openUploadDialog"
        >上传素材库</el-button
      >
    </div>
    <div class="workbench">
      <div class="iframe-wrapper">
        <iframe :src="iframeSrc" frameborder="0" width="100%" height="100%" allowfullscreen title="图片快速生产"></iframe>
      </div>
    </div>
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传到素材库"
      width="420px"
      @close="handleUploadDialogClose"
    >
      <el-form label-width="70px">
        <el-form-item label="素材目录">
          <el-select v-model="selectedFolderId" class="upload-folder-select" placeholder="请选择素材目录">
            <el-option
              v-for="folder in folderList"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-upload
        ref="uploadRef"
        drag
        action="#"
        :auto-upload="false"
        accept="image/*"
        multiple
        @change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽图片到此处或 <em>点击上传</em></div>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="fileList.length === 0" @click="submitUpload"
            >确认上传</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadUserFile } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type Material } from '@/mock/materialData'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'

const baseUrl = 'https://fuyou.zhonglian.com'
const route = useRoute()
const router = useRouter()

const toolOptions = [
  { key: 'none_keys', label: 'none keys' },
  { key: 'get_keys', label: 'get keys' },
  { key: 'image_shows', label: 'image shows' },
  { key: 'text2icon', label: 'text2icon' },
]

const defaultToolKey = 'none_keys'

const normalizeToolKey = (value: unknown) => {
  if (typeof value !== 'string') {
    return defaultToolKey
  }
  return toolOptions.some((item) => item.key === value) ? value : defaultToolKey
}

const activeToolKey = ref(normalizeToolKey(route.query.tool))

const iframeSrc = computed(() => `${baseUrl}/${activeToolKey.value}`)
const canUploadToLibrary = computed(() => activeToolKey.value === 'none_keys')

const uploadDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const folderList = ref<{ id: string; name: string }[]>([])
const selectedFolderId = ref('')

watch(
  () => route.query.tool,
  (tool) => {
    const normalized = normalizeToolKey(tool)
    if (normalized !== activeToolKey.value) {
      activeToolKey.value = normalized
    }
  },
)

const handleToolChange = (toolKey: string) => {
  const normalized = normalizeToolKey(toolKey)
  if (normalized === activeToolKey.value) {
    return
  }
  activeToolKey.value = normalized
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tool: normalized,
    },
  })
}

const loadFolderList = async () => {
  try {
    const response = await request.get('/folders')
    const folders = (response as { id: string; name: string }[]) || []
    folderList.value = folders
    const firstFolder = folders[0]
    if (!selectedFolderId.value && firstFolder) {
      selectedFolderId.value = firstFolder.id
    }
  } catch {
    ElMessage.error('获取素材目录失败')
  }
}

const openUploadDialog = () => {
  if (folderList.value.length === 0) {
    ElMessage.warning('暂无可用素材目录')
    return
  }
  uploadDialogVisible.value = true
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
    ElMessage.warning('请至少选择一张图片')
    return
  }
  if (!selectedFolderId.value) {
    ElMessage.warning('请选择素材目录')
    return
  }
  const currentTime = getCurrentTime()
  const newMaterials: Material[] = fileList.value.map((file) => {
    const localUrl = file.raw?.type.startsWith('image/') ? URL.createObjectURL(file.raw) : ''
    return {
      id: `m${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
      name: file.name,
      type: file.raw?.type || 'image/png',
      url: localUrl,
      thumbnail: localUrl,
      size: file.size || 0,
      createTime: currentTime,
      updateTime: currentTime,
      designer: '上传者',
      creator: '上传者',
      status: 'enabled',
      folderId: selectedFolderId.value,
      tags: [],
      platformTags: [],
      auditStatus: 'pending',
      usageCount: 0,
      platform1Usage: 0,
      platform2Usage: 0,
      approvalRate: 0,
      isFavorite: false,
    }
  })
  try {
    await Promise.all(newMaterials.map((material) => request.post('/materials', material)))
    ElMessage.success(`成功上传 ${newMaterials.length} 张图片到素材库`)
    uploadDialogVisible.value = false
  } catch {
    ElMessage.error('上传素材失败')
  }
}

onMounted(() => {
  loadFolderList()
})
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  padding: 16px;
  background-color: #f0f2f5;
  box-sizing: border-box;

  .iframe-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .upload-folder-select {
    width: 100%;
  }

  .workbench {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-height: 0;
    gap: 12px;
  }

  .tool-menu {
    width: 180px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .tool-menu-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    color: #606266;
    font-size: 14px;
    line-height: 20px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .tool-menu-item:hover {
    border-color: #409eff;
    color: #409eff;
  }

  .tool-menu-item.active {
    border-color: #409eff;
    background: #ecf5ff;
    color: #409eff;
    font-weight: 600;
  }

  .iframe-wrapper {
    flex: 1;
    min-width: 0;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    iframe {
      display: block;
      border: none;
    }
  }
}

@media (max-width: 900px) {
  .page-container {
    .workbench {
      flex-direction: column;
    }

    .tool-menu {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .tool-menu-item {
      flex: 1 1 calc(50% - 8px);
      text-align: center;
    }
  }
}
</style>
