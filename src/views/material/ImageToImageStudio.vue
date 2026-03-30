<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>图生图任务配置</span>
          <div class="header-actions">
            <el-button @click="handleReset">信息重置</el-button>
            <el-button type="primary" :loading="creatingTask" @click="createTask">图片生成</el-button>
          </div>
        </div>
      </template>
      <el-form :model="form" label-width="95px">
        <el-row :gutter="12">
          <el-col :xs="24" :md="8">
            <el-form-item label="模式">
              <el-select v-model="form.mode" class="w-full">
                <el-option label="参考生图" value="参考生图" />
                <el-option label="组合生图" value="组合生图" />
                <el-option label="图像编辑" value="图像编辑" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="颜色">
              <el-input v-model="form.color" placeholder="例如：冷色调、金属感" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="数量">
              <el-input-number v-model="form.quantity" :min="1" :max="4" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关键字">
          <el-input v-model="form.keywords" placeholder="多个关键字用逗号分隔" />
        </el-form-item>
        <el-form-item label="卖点">
          <el-input v-model="form.sellingPoints" placeholder="例如：4K质感、强场景化" />
        </el-form-item>
        <el-form-item label="Prompt">
          <el-input
            v-model="form.prompt"
            type="textarea"
            :rows="3"
            placeholder="支持文本+图像组合输入，模型支持4K多模态生图"
          />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            accept="image/*"
            multiple
            :on-change="onUploadChange"
            :on-remove="onUploadRemove"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽或点击上传，支持多图上传</div>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="list-card">
          <template #header>
            <span>未完成列表</span>
          </template>
          <el-empty v-if="unfinishedTasks.length === 0" description="暂无未完成任务" />
          <div v-else class="task-list">
            <div v-for="task in unfinishedTasks" :key="task.id" class="task-item">
              <div class="task-title-row">
                <div class="task-title">{{ task.name }}</div>
                <el-tag :type="statusTagType(task.status)">{{ statusText(task.status) }}</el-tag>
              </div>
              <div class="task-meta">参数：{{ task.configSummary }}</div>
              <div class="task-meta">文件：{{ task.fileNames }}</div>
              <el-progress :percentage="task.progress" :status="task.status === 'cancelled' ? 'exception' : undefined" />
              <div class="task-actions">
                <el-button link type="primary" :disabled="task.status !== 'paused'" @click="resumeTask(task.id)"
                  >继续</el-button
                >
                <el-button link type="warning" :disabled="task.status !== 'running'" @click="pauseTask(task.id)"
                  >暂停</el-button
                >
                <el-button link type="danger" @click="cancelTask(task.id)">取消</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="list-card">
          <template #header>
            <span>已完成列表</span>
          </template>
          <el-empty v-if="completedTasks.length === 0" description="暂无完成任务" />
          <div v-else class="task-list">
            <div v-for="task in completedTasks" :key="task.id" class="task-item">
              <div class="task-title-row">
                <div class="task-title">{{ task.name }}</div>
                <el-tag type="success">已完成</el-tag>
              </div>
              <div class="task-meta">参数：{{ task.configSummary }}</div>
              <div class="task-meta">文件详情：{{ task.fileNames }}</div>
              <div class="result-images">
                <img v-for="(url, idx) in task.resultUrls" :key="`${task.id}_${idx}`" :src="url" class="preview-image" alt="result" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { fileToBase64, generateImageToImage } from '@/utils/imageGenerator'

type TaskStatus = 'running' | 'paused' | 'cancelled' | 'completed' | 'failed'

type ImageTask = {
  id: string
  name: string
  status: TaskStatus
  progress: number
  configSummary: string
  fileNames: string
  sourceFiles: File[]
  resultUrls: string[]
  requestStarted: boolean
}

const getDefaultForm = () => ({
  mode: '参考生图',
  color: '品牌主色',
  keywords: '高质感,4K,品牌一致性',
  sellingPoints: '多图融合创作',
  prompt: '',
  quantity: 1,
})

const form = reactive(getDefaultForm())
const fileList = ref<UploadUserFile[]>([])
const creatingTask = ref(false)
const tasks = ref<ImageTask[]>([])
const timerMap = new Map<string, number>()
const controllerMap = new Map<string, AbortController>()
const pageStorageKey = 'material-image-to-image-studio-state'

type PersistedImageTask = Omit<ImageTask, 'sourceFiles' | 'requestStarted'> & {
  sourceFiles?: never
}

const persistState = () => {
  if (typeof window === 'undefined') return
  const persistedTasks: PersistedImageTask[] = tasks.value.map((item) => {
    const { sourceFiles: _sourceFiles, requestStarted: _requestStarted, ...rest } = item
    return rest
  })
  window.localStorage.setItem(
    pageStorageKey,
    JSON.stringify({
      form,
      tasks: persistedTasks,
    }),
  )
}

const restoreState = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(pageStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      form?: ReturnType<typeof getDefaultForm>
      tasks?: PersistedImageTask[]
    }
    Object.assign(form, getDefaultForm(), parsed.form || {})
    const restoredTasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((item) => ({
          ...item,
          status: item.status === 'running' ? 'paused' : item.status,
          sourceFiles: [],
          requestStarted: false,
        }))
      : []
    tasks.value = restoredTasks
  } catch {}
}

const completedTasks = computed(() => tasks.value.filter((item) => item.status === 'completed'))
const unfinishedTasks = computed(() =>
  tasks.value.filter((item) => item.status === 'running' || item.status === 'paused'),
)

const statusText = (status: TaskStatus) => {
  if (status === 'running') return '生成中'
  if (status === 'paused') return '已暂停'
  if (status === 'cancelled') return '已取消'
  if (status === 'failed') return '失败'
  return '已完成'
}

const statusTagType = (status: TaskStatus) => {
  if (status === 'running') return ''
  if (status === 'paused') return 'warning'
  if (status === 'cancelled' || status === 'failed') return 'danger'
  return 'success'
}

const onUploadChange = (_file: UploadUserFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const onUploadRemove = (_file: UploadUserFile, files: UploadUserFile[]) => {
  fileList.value = files
}

const handleReset = () => {
  Object.assign(form, getDefaultForm())
  fileList.value = []
}

const getTaskById = (taskId: string) => tasks.value.find((item) => item.id === taskId)

const stopTaskTimer = (taskId: string) => {
  const timerId = timerMap.get(taskId)
  if (timerId) {
    window.clearInterval(timerId)
    timerMap.delete(taskId)
  }
}

const abortTaskRequest = (taskId: string) => {
  const controller = controllerMap.get(taskId)
  if (controller) {
    controller.abort()
    controllerMap.delete(taskId)
  }
}

const runTask = (taskId: string) => {
  stopTaskTimer(taskId)
  const timer = window.setInterval(async () => {
    const task = getTaskById(taskId)
    if (!task || task.status !== 'running') {
      stopTaskTimer(taskId)
      return
    }
    if (!task.requestStarted) {
      task.progress = Math.min(task.progress + 10, 60)
      if (task.progress < 60) {
        return
      }
      task.requestStarted = true
      const controller = new AbortController()
      controllerMap.set(taskId, controller)
      try {
        const binaryData = await Promise.all(task.sourceFiles.map((file) => fileToBase64(file)))
        const prompt = [form.prompt, form.keywords, form.sellingPoints, form.color, `模式:${form.mode}`]
          .filter(Boolean)
          .join(' | ')
        const response = await generateImageToImage(
          {
            prompt,
            size: '2K',
            sequential_image_generation: form.quantity > 1 ? 'auto' : 'disabled',
            generation_num: form.quantity,
            images: binaryData,
          },
          controller.signal,
        )
        if (response.imageUrls.length === 0) {
          throw new Error('接口未返回可用图片地址')
        }
        task.resultUrls = response.imageUrls.slice(0, form.quantity)
        task.progress = 100
        task.status = 'completed'
        stopTaskTimer(taskId)
        controllerMap.delete(taskId)
        ElMessage.success(`${task.name} 已完成`)
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成失败'
        if (message.toLowerCase().includes('abort')) {
          task.status = 'paused'
        } else {
          task.status = 'failed'
          ElMessage.error(message)
        }
        task.requestStarted = false
        stopTaskTimer(taskId)
        controllerMap.delete(taskId)
      }
    }
  }, 1000)
  timerMap.set(taskId, timer)
}

const createTask = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传至少一张图片')
    return
  }
  const rawFiles = fileList.value.map((item) => item.raw).filter((file): file is File => file instanceof File)
  if (rawFiles.length === 0) {
    ElMessage.warning('上传文件无效，请重新上传')
    return
  }
  creatingTask.value = true
  try {
    const id = `i2i_${Date.now()}`
    const task: ImageTask = {
      id,
      name: `图生图任务_${new Date().toLocaleTimeString()}`,
      status: 'running',
      progress: 0,
      configSummary: `${form.mode} / ${form.color} / ${form.keywords || '无关键字'}`,
      fileNames: rawFiles.map((item) => item.name).join('，'),
      sourceFiles: rawFiles,
      resultUrls: [],
      requestStarted: false,
    }
    tasks.value = [task, ...tasks.value]
    runTask(id)
  } finally {
    creatingTask.value = false
  }
}

const pauseTask = (taskId: string) => {
  const task = getTaskById(taskId)
  if (!task || task.status !== 'running') return
  task.status = 'paused'
  abortTaskRequest(taskId)
  stopTaskTimer(taskId)
  task.requestStarted = false
}

const resumeTask = (taskId: string) => {
  const task = getTaskById(taskId)
  if (!task || task.status !== 'paused') return
  if (task.sourceFiles.length === 0) {
    ElMessage.warning('该任务刷新后缺少源图，请重新上传后新建任务')
    return
  }
  task.status = 'running'
  runTask(taskId)
}

const cancelTask = (taskId: string) => {
  const task = getTaskById(taskId)
  if (!task) return
  task.status = 'cancelled'
  abortTaskRequest(taskId)
  stopTaskTimer(taskId)
  tasks.value = tasks.value.filter((item) => item.id !== taskId)
  ElMessage.success('任务已取消')
}

onMounted(() => {
  restoreState()
})

onBeforeUnmount(() => {
  Array.from(timerMap.keys()).forEach((taskId) => stopTaskTimer(taskId))
  Array.from(controllerMap.keys()).forEach((taskId) => abortTaskRequest(taskId))
})

watch(
  [tasks, () => form.mode, () => form.color, () => form.keywords, () => form.sellingPoints, () => form.prompt, () => form.quantity],
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

.list-card {
  min-height: 380px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  font-weight: 600;
  color: #303133;
}

.task-meta {
  color: #606266;
  font-size: 13px;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.result-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-image {
  width: 96px;
  height: 96px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ebeef5;
}

.w-full {
  width: 100%;
}
</style>
