<template>
  <div class="album-management-container">
    <div class="album-sidebar">
      <div class="sidebar-header">
        <h2>专辑列表</h2>
        <el-button type="primary" size="small" @click="handleCreateAlbum">新建专辑</el-button>
      </div>

      <!-- Filters -->
      <div class="album-filters">
        <el-input
          v-model="filters.name"
          placeholder="按专辑名称筛选"
          clearable
          class="filter-item"
          :prefix-icon="Search"
        />
        <el-input
          v-model="filters.product"
          placeholder="按产品名称筛选"
          clearable
          class="filter-item"
        />
        <el-select v-model="sortBy" placeholder="专辑排序" class="filter-item">
          <el-option label="按更新时间降序" value="updateDesc" />
          <el-option label="按更新时间升序" value="updateAsc" />
          <el-option label="按创建时间降序" value="createDesc" />
          <el-option label="按创建时间升序" value="createAsc" />
        </el-select>
      </div>

      <!-- Album List -->
      <div class="album-list">
        <div
          v-for="album in filteredAlbums"
          :key="album.id"
          class="album-card"
          :class="{ active: currentAlbum?.id === album.id }"
          @click="selectAlbum(album)"
        >
          <div class="album-title">{{ album.name }}</div>
          <div class="album-meta">产品: {{ album.product }}</div>
          <div class="album-meta">更新: {{ album.updateTime }}</div>
          <div class="album-actions">
            <!-- stop prop to prevent selecting while acting -->
            <el-button link type="primary" size="small" @click.stop="handleEditAlbum(album)"
              >编辑</el-button
            >
            <el-button link type="danger" size="small" @click.stop="handleDeleteAlbum(album)"
              >删除</el-button
            >
          </div>
        </div>
        <el-empty v-if="filteredAlbums.length === 0" description="暂无匹配专辑" />
      </div>
    </div>

    <div class="album-content">
      <template v-if="currentAlbum">
        <div class="content-header">
          <div class="header-left">
            <h2>{{ currentAlbum.name }}</h2>
            <el-tag size="small" type="info">{{ currentAlbum.product }}</el-tag>
            <el-tag size="small" type="success" v-if="currentAlbum.permissions === 'Public'"
              >公开</el-tag
            >
            <el-tag size="small" type="warning" v-else>私有</el-tag>
          </div>
          <div class="header-right">
            <el-button type="success" @click="handleSyncBot" :loading="syncing">
              同步维护机器人
            </el-button>
            <el-button type="primary" @click="handleBatchUpload"> 批量上传素材 </el-button>
            <el-button
              type="danger"
              @click="handleBatchDelete"
              :disabled="selectedMaterials.length === 0"
            >
              批量删除选定
            </el-button>
          </div>
        </div>

        <!-- Materials Grid -->
        <div class="breadcrumb-container">
          <div class="breadcrumb-main">
            <el-breadcrumb separator=">">
              <el-breadcrumb-item>
                <a @click="navigateToPath(-1)">根目录</a>
              </el-breadcrumb-item>
              <el-breadcrumb-item v-for="(part, index) in breadcrumbParts" :key="index">
                <a @click="navigateToPath(index)">{{ part }}</a>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="folder-filter-row">
            <span class="filter-label">筛选档夹</span>
            <el-select
              v-model="folderFilter"
              class="folder-filter"
              placeholder="请选择档夹"
              clearable
              filterable
              no-data-text="当前专辑暂无可筛选档夹"
            >
              <el-option
                v-for="folder in albumFolderOptions"
                :key="folder"
                :label="folder"
                :value="folder"
              />
            </el-select>
            <el-tag v-if="isFolderFilterActive" class="active-filter-tag" size="small" type="success">
              {{ folderFilter }}
            </el-tag>
            <el-button v-if="isFolderFilterActive" link type="primary" @click="folderFilter = ''">
              清空筛选
            </el-button>
          </div>
        </div>

        <div class="materials-grid">
          <el-checkbox-group v-model="selectedMaterials">
            <div
              v-for="item in itemsInCurrentView"
              :key="item.itemType === 'folder' ? 'folder-' + item.name : 'file-' + item.id"
              class="grid-item-wrapper"
              @click="handleItemClick(item)"
            >
              <!-- Folder Item -->
              <el-card
                v-if="item.itemType === 'folder'"
                class="material-card folder-card"
                body-style="padding: 0px"
                shadow="hover"
              >
                <div class="folder-content">
                  <el-icon :size="60" color="#FFCA28"><Folder /></el-icon>
                  <div class="folder-item-name" :title="item.name">{{ item.name }}</div>
                </div>
              </el-card>

              <!-- Material File Item -->
              <el-card v-else class="material-card" body-style="padding: 0px" shadow="hover">
                <div class="image-wrapper">
                  <el-image :src="item.thumbnail" fit="cover" class="material-image" />
                  <div class="checkbox-wrapper">
                    <el-checkbox :label="item.id" @click.stop>&nbsp;</el-checkbox>
                  </div>
                </div>
                <div class="material-info">
                  <div class="material-name" :title="item.name">{{ item.name }}</div>
                  <div class="material-meta">更新: {{ item.updateTime }}</div>
                  <div class="material-actions">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleEditMaterial(item)"
                      >元数据</el-button
                    >
                    <el-button
                      link
                      type="danger"
                      size="small"
                      @click.stop="handleDeleteMaterial(item)"
                      >删除</el-button
                    >
                  </div>
                </div>
              </el-card>
            </div>
          </el-checkbox-group>
        </div>
        <el-empty v-if="itemsInCurrentView.length === 0" :description="emptyDescription" />
      </template>
      <el-empty
        v-else
        description="请选择一个专辑查看素材"
        style="height: 100%; display: flex; align-items: center; justify-content: center"
      />
    </div>

    <!-- Album Create/Edit Dialog -->
    <el-dialog
      v-model="albumDialog.visible"
      :title="albumDialog.isEdit ? '编辑专辑' : '新建专辑'"
      width="400px"
    >
      <el-form :model="albumForm" :rules="albumRules" ref="albumFormRef" label-width="80px">
        <el-form-item label="专辑名称" prop="name">
          <el-input v-model="albumForm.name" placeholder="请输入专辑名称" />
        </el-form-item>
        <el-form-item label="所属产品" prop="product">
          <el-input v-model="albumForm.product" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="权限设置" prop="permissions">
          <el-radio-group v-model="albumForm.permissions">
            <el-radio label="Public">公开</el-radio>
            <el-radio label="Private">私有</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="albumDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitAlbum">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Material Metadata Edit Dialog -->
    <el-dialog v-model="metaDialog.visible" title="编辑素材元数据" width="500px">
      <el-form :model="metaForm" label-width="100px">
        <el-form-item label="所属档夹">
          <el-select v-model="metaForm.folderId" placeholder="请选择档夹" filterable>
            <el-option
              v-for="folder in folderOptions"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="素材名称">
          <el-input v-model="metaForm.name" disabled />
        </el-form-item>
        <el-form-item label="设计师">
          <el-input v-model="metaForm.designer" placeholder="请输入设计师" />
        </el-form-item>
        <el-form-item label="创意人">
          <el-input v-model="metaForm.creator" placeholder="请输入创意人" />
        </el-form-item>
        <el-form-item label="拍摄人员">
          <el-input v-model="metaForm.photographer" placeholder="请输入拍摄人员" />
        </el-form-item>
        <el-form-item label="参演人员">
          <el-input v-model="metaForm.actors" placeholder="请输入参演人员" />
        </el-form-item>
        <el-form-item label="脚本人员">
          <el-input v-model="metaForm.scriptwriter" placeholder="请输入脚本人员" />
        </el-form-item>
        <el-form-item label="片头制作">
          <el-input v-model="metaForm.introMaker" placeholder="请输入片头制作" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="metaDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitMeta">保存</el-button>
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
      <el-form label-width="80px">
        <el-form-item label="目标档夹">
          <el-select
            v-model="uploadFolderId"
            placeholder="请选择档夹"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="folder in folderOptions"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        multiple
        @change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
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
import { ref, computed, onMounted, watch } from 'vue'
import { match } from 'ts-pattern'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, UploadFilled, Folder } from '@element-plus/icons-vue'
import {
  type Album,
  type Material,
  type Folder as FolderType,
  type ViewItem,
} from '@/mock/materialData'
import type { UploadInstance, UploadUserFile } from 'element-plus'
import request from '@/utils/request'
import { getCurrentTime } from '@/utils/time'

// --- State ---
const albums = ref<Album[]>([])
const allFolders = ref<FolderType[]>([])
const currentAlbum = ref<Album | null>(null)

// Filters & Sorting
const filters = ref({
  name: '',
  product: '',
})
const sortBy = ref('updateDesc')
const folderFilter = ref('')
const uploadFolderId = ref('')

const VIEW_CACHE_KEY = 'smart-marketing-album-view-cache'

type AlbumViewCache = {
  folderFilterByAlbum: Record<string, string>
  uploadFolderId: string
}

const folderFilterByAlbum = ref<Record<string, string>>({})

const readViewCache = (): AlbumViewCache | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(VIEW_CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AlbumViewCache>
    return {
      folderFilterByAlbum: parsed.folderFilterByAlbum || {},
      uploadFolderId: parsed.uploadFolderId || '',
    }
  } catch {
    return null
  }
}

const persistViewCache = () => {
  if (typeof window === 'undefined') return
  const payload: AlbumViewCache = {
    folderFilterByAlbum: folderFilterByAlbum.value,
    uploadFolderId: uploadFolderId.value,
  }
  window.localStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(payload))
}

// Materials State
const selectedMaterials = ref<string[]>([])
const syncing = ref(false)
const currentPath = ref('root') // 'root' or folder path like '活动素材/2024大促'

// Dialog States
const albumDialog = ref({ visible: false, isEdit: false })
const albumForm = ref<Partial<Album>>({ id: '', name: '', product: '', permissions: 'Public' })
const albumFormRef = ref()
const albumRules = ref({
  name: [{ required: true, message: '请输入专辑名称', trigger: 'blur' }],
  product: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
})

const metaDialog = ref({ visible: false })
const metaForm = ref<Partial<Material>>({})

const uploadDialog = ref({ visible: false })
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])

// --- Computed ---
const filteredAlbums = computed(() => {
  const result = albums.value.filter((album) => {
    const matchName = album.name.toLowerCase().includes(filters.value.name.toLowerCase())
    const matchProduct = album.product.toLowerCase().includes(filters.value.product.toLowerCase())
    return matchName && matchProduct
  })

  result.sort((a, b) => {
    const timeA = new Date(a.updateTime).getTime()
    const timeB = new Date(b.updateTime).getTime()
    const createA = new Date(a.createTime).getTime()
    const createB = new Date(b.createTime).getTime()

    return match(sortBy.value)
      .with('updateDesc', () => timeB - timeA)
      .with('updateAsc', () => timeA - timeB)
      .with('createDesc', () => createB - createA)
      .with('createAsc', () => createA - createB)
      .otherwise(() => 0)
  })

  return result
})

const effectivePath = computed(() => folderFilter.value || currentPath.value)
const isFolderFilterActive = computed(() => Boolean(folderFilter.value))

const breadcrumbParts = computed(() => {
  if (effectivePath.value === 'root') {
    return []
  }
  return effectivePath.value.split('/')
})

const albumFolderOptions = computed(() => {
  if (!currentAlbum.value) return []

  const folderMap = new Map(allFolders.value.map((f) => [f.id, f.name]))
  return Array.from(
    new Set(
      currentAlbum.value.materials
        .map((material) => folderMap.get(material.folderId))
        .filter((folderPath): folderPath is string => Boolean(folderPath)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

const folderOptions = computed(() =>
  [...allFolders.value].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
)

const folderNameIdMap = computed(() => new Map(allFolders.value.map((folder) => [folder.name, folder.id])))

const itemsInCurrentView = computed<ViewItem[]>(() => {
  if (!currentAlbum.value) return []

  const allItems: ViewItem[] = []
  const seenFolders = new Set<string>()
  const currentMaterials = currentAlbum.value.materials || []
  const folderMap = new Map(allFolders.value.map((f) => [f.id, f.name]))
  const path = effectivePath.value

  if (path === 'root') {
    currentMaterials.forEach((material) => {
      const folderPath = folderMap.get(material.folderId)
      if (folderPath) {
        const topLevelFolder = folderPath.split('/')[0]
        if (topLevelFolder && !seenFolders.has(topLevelFolder)) {
          allItems.push({ itemType: 'folder', name: topLevelFolder, path: topLevelFolder })
          seenFolders.add(topLevelFolder)
        }
      } else {
        allItems.push({ ...material, itemType: 'file' })
      }
    })
  } else {
    const currentPathPrefix = path + '/'
    currentMaterials.forEach((material) => {
      const folderPath = folderMap.get(material.folderId)
      if (folderPath && folderPath.startsWith(currentPathPrefix)) {
        const subPath = folderPath.substring(currentPathPrefix.length)
        const nextFolder = subPath.split('/')[0]
        if (nextFolder && !seenFolders.has(nextFolder)) {
          allItems.push({
            itemType: 'folder',
            name: nextFolder,
            path: `${path}/${nextFolder}`,
          })
          seenFolders.add(nextFolder)
        }
      } else if (folderPath === path) {
        allItems.push({ ...material, itemType: 'file' })
      }
    })
  }

  return allItems
})

const emptyDescription = computed(() => {
  if (isFolderFilterActive.value) {
    return '当前档夹下暂无内容'
  }
  return effectivePath.value === 'root' ? '当前专辑暂无内容' : '该文件夹下暂无内容'
})

// --- Lifecycle ---
onMounted(async () => {
  const viewCache = readViewCache()
  if (viewCache) {
    folderFilterByAlbum.value = viewCache.folderFilterByAlbum || {}
    uploadFolderId.value = viewCache.uploadFolderId || ''
  }

  // Load data
  try {
    const [albumsRes, foldersRes] = await Promise.all([
      request.get('/albums'),
      request.get('/folders'),
    ])
    albums.value = (albumsRes as unknown as Album[]) || []
    allFolders.value = (foldersRes as unknown as FolderType[]) || []
  } catch (e) {
    ElMessage.error('获取基础数据失败')
  }
})

// --- Actions ---
const handleItemClick = (item: any) => {
  if (item.itemType === 'folder') {
    if (isFolderFilterActive.value) {
      folderFilter.value = ''
    }
    currentPath.value = item.path
  } else {
    // This is a file, you can add preview logic here if needed
    console.log('Clicked on file:', item.name)
  }
}

const navigateToPath = (pathIndex: number) => {
  const targetPath =
    pathIndex < 0 ? 'root' : breadcrumbParts.value.slice(0, pathIndex + 1).join('/') || 'root'

  if (isFolderFilterActive.value) {
    folderFilter.value = ''
  }

  currentPath.value = targetPath
}

const selectAlbum = (album: Album) => {
  currentAlbum.value = album
  currentPath.value = 'root' // Reset path when switching albums
  folderFilter.value = folderFilterByAlbum.value[album.id] || ''
  selectedMaterials.value = [] // Reset selection
}

const handleCreateAlbum = () => {
  albumDialog.value = { visible: true, isEdit: false }
  albumForm.value = { id: '', name: '', product: '', permissions: 'Public' }
}

const handleEditAlbum = (album: Album) => {
  albumDialog.value = { visible: true, isEdit: true }
  albumForm.value = { ...album }
}

const submitAlbum = async () => {
  if (!albumFormRef.value) return
  await (albumFormRef.value as any).validate(async (valid: boolean) => {
    if (valid) {
      try {
        const currentTime = getCurrentTime()
        if (albumDialog.value.isEdit) {
          const index = albums.value.findIndex((a) => a.id === albumForm.value.id)
          if (index > -1) {
            const updatedAlbum: Album = {
              ...albums.value[index],
              ...(albumForm.value as Album),
              updateTime: currentTime, // Ensure update time is current
            }
            await request.put(`/albums/${albumForm.value.id}`, updatedAlbum)
            albums.value[index] = updatedAlbum
            if (currentAlbum.value?.id === albumForm.value.id) {
              currentAlbum.value = updatedAlbum
            }
            ElMessage.success('专辑已更新')
          }
        } else {
          const newAlbum: Album = {
            id: 'a' + Date.now(),
            author: 'Admin',
            createTime: currentTime,
            updateTime: currentTime,
            materials: [],
            name: albumForm.value.name || '',
            product: albumForm.value.product || '',
            permissions: albumForm.value.permissions || 'Public',
          }
          await request.post('/albums', newAlbum)
          albums.value.unshift(newAlbum)
          ElMessage.success('专辑已创建')
        }
        albumDialog.value.visible = false
      } catch (e) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDeleteAlbum = (album: Album) => {
  ElMessageBox.confirm(
    `确定要永久删除专辑 "${album.name}" 及其关联的所有文件吗？此操作不可逆！`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(() => {
      albums.value = albums.value.filter((a) => a.id !== album.id)
      if (currentAlbum.value?.id === album.id) {
        currentAlbum.value = null
      }
      ElMessage.success('专辑已删除')
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// Material Actions
const handleSyncBot = () => {
  syncing.value = true
  setTimeout(() => {
    syncing.value = false
    ElMessage.success('成功同步至维护机器人!')
  }, 1500)
}

const handleBatchUpload = () => {
  if (!uploadFolderId.value || !folderOptions.value.find((folder) => folder.id === uploadFolderId.value)) {
    const folderIdFromFilter = folderNameIdMap.value.get(folderFilter.value)
    uploadFolderId.value = folderIdFromFilter || folderOptions.value[0]?.id || ''
  }
  uploadDialog.value.visible = true
}

const handleFileChange = (_: UploadUserFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const handleUploadDialogClose = () => {
  uploadRef.value?.clearFiles()
  fileList.value = []
}

const submitUpload = async () => {
  if (currentAlbum.value && fileList.value.length > 0) {
    if (!uploadFolderId.value) {
      ElMessage.warning('请先选择目标档夹')
      return
    }

    const currentTime = getCurrentTime()
    const newMaterials: Material[] = []

    for (const file of fileList.value) {
      // Generate a local blob URL for previewing images
      const localUrl = file.raw?.type.startsWith('image/') ? URL.createObjectURL(file.raw) : ''

      newMaterials.push({
        id: `m${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
        name: file.name,
        type: file.raw?.type || 'application/octet-stream',
        url: localUrl,
        thumbnail: localUrl, // Use the same local URL for the thumbnail
        size: file.size || 0,
        createTime: currentTime,
        updateTime: currentTime,
        designer: '上传者',
        creator: '上传者',
        status: 'enabled',
        folderId: uploadFolderId.value,
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

    const updatedAlbum = {
      ...currentAlbum.value,
      materials: [...currentAlbum.value.materials, ...newMaterials],
      updateTime: currentTime,
    }

    try {
      // This is still a mock request, but it updates the local state realistically
      await request.put(`/albums/${currentAlbum.value.id}`, updatedAlbum)
      currentAlbum.value = updatedAlbum

      const idx = albums.value.findIndex((a) => a.id === currentAlbum.value!.id)
      if (idx > -1) albums.value[idx] = updatedAlbum

      ElMessage.success(`成功添加 ${newMaterials.length} 个素材`)
      uploadDialog.value.visible = false // The @close event will handle cleanup
    } catch (e) {
      ElMessage.error('添加失败')
    }
  }
}

const handleDeleteMaterial = (material: Material) => {
  ElMessageBox.confirm(`确定要删除素材 "${material.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      if (currentAlbum.value) {
        const currentTime = getCurrentTime()
        const updatedAlbum = {
          ...currentAlbum.value,
          updateTime: currentTime,
        }
        updatedAlbum.materials = updatedAlbum.materials.filter((m) => m.id !== material.id)

        try {
          await request.put(`/albums/${currentAlbum.value.id}`, updatedAlbum)
          currentAlbum.value = updatedAlbum

          const idx = albums.value.findIndex((a) => a.id === currentAlbum.value!.id)
          if (idx > -1) albums.value[idx] = updatedAlbum

          ElMessage.success('素材已删除')
        } catch (e) {
          ElMessage.error('删除失败')
        }
      }
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  if (!selectedMaterials.value.length) return
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedMaterials.value.length} 个素材吗？`,
    '批量删除',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
  )
    .then(async () => {
      if (currentAlbum.value) {
        const currentTime = getCurrentTime()
        const selectedSet = new Set(selectedMaterials.value)
        const updatedAlbum = {
          ...currentAlbum.value,
          updateTime: currentTime,
        }
        updatedAlbum.materials = updatedAlbum.materials.filter((m) => !selectedSet.has(m.id))

        try {
          await request.put(`/albums/${currentAlbum.value.id}`, updatedAlbum)
          currentAlbum.value = updatedAlbum

          const idx = albums.value.findIndex((a) => a.id === currentAlbum.value!.id)
          if (idx > -1) albums.value[idx] = updatedAlbum

          selectedMaterials.value = []
          ElMessage.success('选定素材已批量删除')
        } catch (e) {
          ElMessage.error('删除失败')
        }
      }
    })
    .catch(() => {})
}

const handleEditMaterial = (material: Material) => {
  metaForm.value = { ...material }
  metaDialog.value.visible = true
}

watch(
  [folderFilter, currentAlbum],
  ([filterValue, album]) => {
    if (!album) return
    if (filterValue) {
      folderFilterByAlbum.value[album.id] = filterValue
    } else {
      delete folderFilterByAlbum.value[album.id]
    }
    persistViewCache()
  },
  { deep: false },
)

watch(
  uploadFolderId,
  () => {
    persistViewCache()
  },
  { deep: false },
)

const submitMeta = async () => {
  if (currentAlbum.value) {
    const index = currentAlbum.value.materials.findIndex((m) => m.id === metaForm.value.id)
    if (index > -1) {
      const updatedMaterial = {
        ...currentAlbum.value.materials[index],
        ...(metaForm.value as Material),
      }
      const currentTime = getCurrentTime()
      updatedMaterial.updateTime = currentTime

      const updatedAlbum = {
        ...currentAlbum.value,
        updateTime: currentTime,
      }
      updatedAlbum.materials = [...updatedAlbum.materials]
      updatedAlbum.materials[index] = updatedMaterial

      try {
        await request.put(`/albums/${currentAlbum.value.id}`, updatedAlbum)
        currentAlbum.value = updatedAlbum

        const idx = albums.value.findIndex((a) => a.id === currentAlbum.value!.id)
        if (idx > -1) albums.value[idx] = updatedAlbum

        ElMessage.success('元数据已保存')
        metaDialog.value.visible = false
      } catch (e) {
        ElMessage.error('保存失败')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.album-management-container {
  display: flex;
  height: calc(100vh - 120px); // Adjust based on layout headers
  gap: 20px;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.album-sidebar {
  width: 320px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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

  .album-filters {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-bottom: 1px solid #ebeef5;
    background-color: #fafafa;
  }

  .album-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;

    .album-card {
      padding: 12px;
      border: 1px solid #ebeef5;
      border-radius: 6px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #c6e2ff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      &.active {
        border-color: #409eff;
        background-color: #ecf5ff;
      }

      .album-title {
        font-weight: 600;
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
      }

      .album-meta {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .album-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
    }
  }
}

.album-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .content-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
    }
  }

  .breadcrumb-container {
    padding: 10px 20px;
    background-color: #fcfcfc;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .breadcrumb-main {
      min-width: 0;
    }

    a {
      cursor: pointer;
      font-weight: 500;
      &:hover {
        color: #409eff;
      }
    }

    .folder-filter-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 13px;
      color: #606266;
      white-space: nowrap;
    }

    .folder-filter {
      width: 280px;
    }

    .active-filter-tag {
      max-width: 320px;
      :deep(.el-tag__content) {
        display: block;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .materials-grid {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    // Checkbox group wrapper overrides
    :deep(.el-checkbox-group) {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }

    .grid-item-wrapper {
      cursor: pointer;
    }

    .folder-card {
      .folder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 140px; // Match image wrapper height
        padding: 12px;
        text-align: center;
      }
      .folder-item-name {
        margin-top: 10px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        line-height: 1.5; /* Ensure sufficient line height */
      }
    }

    .material-card {
      display: flex;
      flex-direction: column;
      height: 100%;

      .image-wrapper {
        position: relative;
        height: 140px;
        background: #f5f7fa;

        .material-image {
          width: 100%;
          height: 100%;
          display: block;
        }

        .checkbox-wrapper {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 4px;
          padding: 2px 4px;
          line-height: 1;
        }
      }

      .material-info {
        padding: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .material-name {
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .material-meta {
          font-size: 12px;
          color: #909399;
          margin-bottom: 10px;
        }

        .material-actions {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #ebeef5;
          padding-top: 8px;
        }
      }
    }
  }
}
</style>
