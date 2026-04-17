<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>图示生成配置</span>
          <div class="header-actions">
            <el-button @click="handleReset">信息重置</el-button>
            <el-button type="primary" :loading="creating" @click="createTask">生成图示</el-button>
          </div>
        </div>
      </template>
      <el-form :model="form" label-width="90px">
        <el-row :gutter="12">
          <el-col :xs="24" :md="8">
            <el-form-item label="模式">
              <el-select v-model="form.mode" class="w-full">
                <el-option label="扁平图示" value="扁平图示" />
                <el-option label="3D图示" value="3D图示" />
                <el-option label="线性图示" value="线性图示" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="颜色">
              <el-input v-model="form.color" placeholder="例如：渐变蓝紫" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="数量">
              <el-input-number v-model="form.quantity" :min="1" :max="8" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关键字">
          <el-input v-model="form.keywords" placeholder="例如：购物车、优惠券、电商入口" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <span>查看未完成的信息</span>
          </template>
          <el-empty v-if="unfinishedList.length === 0" description="暂无正在生成或暂停任务" />
          <div v-else class="task-list">
            <div v-for="task in unfinishedList" :key="task.id" class="task-item">
              <div class="task-title-row">
                <div class="task-title">{{ task.name }}</div>
                <el-tag :type="task.status === 'paused' ? 'warning' : ''">{{
                  task.status === 'paused' ? '已暂停' : '生成中'
                }}</el-tag>
              </div>
              <div class="task-meta">{{ task.summary }}</div>
              <el-progress :percentage="task.progress" />
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
        <el-card shadow="never" class="panel-card">
          <template #header>
            <span>查看已完成信息</span>
          </template>
          <el-empty v-if="completedList.length === 0" description="暂无已完成图示" />
          <div v-else class="result-grid">
            <div v-for="item in completedList" :key="item.id" class="result-item">
              <img :src="item.url" class="result-image" alt="icon" />
              <div class="result-name">{{ item.name }}</div>
              <div class="result-time">{{ item.createdAt }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getCurrentTime } from '@/utils/time'
import { generateTextToImage } from '@/utils/imageGenerator'

type TaskStatus = 'running' | 'paused'

type TaskConfig = {
  mode: string
  color: string
  keywords: string
  quantity: number
}

type IconTask = {
  id: string
  name: string
  summary: string
  config: TaskConfig
  status: TaskStatus
  progress: number
  createdAt: string
  requestStarted: boolean
}

type IconResult = {
  id: string
  name: string
  url: string
  createdAt: string
}

const getDefaultForm = () => ({
  mode: '扁平图示',
  color: '品牌蓝',
  keywords: '',
  quantity: 4,
})

const form = reactive(getDefaultForm())
const creating = ref(false)
const tasks = ref<IconTask[]>([])
const results = ref<IconResult[]>([])
const timerMap = new Map<string, number>()
const controllerMap = new Map<string, AbortController>()
const pageStorageKey = 'material-icon-generation-studio-state'

type PersistedIconTask = Omit<IconTask, 'requestStarted'> & { requestStarted?: never }

const persistState = () => {
  if (typeof window === 'undefined') return
  const persistedTasks: PersistedIconTask[] = tasks.value.map((item) => {
    const { requestStarted: _requestStarted, ...rest } = item
    return rest
  })
  window.localStorage.setItem(
    pageStorageKey,
    JSON.stringify({
      form,
      tasks: persistedTasks,
      results: results.value,
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
      tasks?: PersistedIconTask[]
      results?: IconResult[]
    }
    Object.assign(form, getDefaultForm(), parsed.form || {})
    tasks.value = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((item) => ({
          ...item,
          status: item.status === 'running' ? 'paused' : item.status,
          requestStarted: false,
        }))
      : []
    results.value = Array.isArray(parsed.results) ? parsed.results : []
  } catch {}
}

const unfinishedList = computed(() => tasks.value)
const completedList = computed(() => results.value)

const handleReset = () => {
  Object.assign(form, getDefaultForm())
}

const stopTimer = (taskId: string) => {
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

const MAX_PROMPT_LENGTH = 300

const shortenSegment = (value: string, maxLength: number) => {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

const buildTaskConfig = (): TaskConfig => ({
  mode: form.mode,
  color: form.color.trim() || '品牌主色',
  keywords: form.keywords.trim(),
  quantity: Math.min(8, Math.max(1, Number(form.quantity) || 1)),
})

const buildIconPrompt = (config: TaskConfig) => {
  const segments = [
    `图标风格:${config.mode}`,
    `主题色硬约束:${config.color}`,
    `关键词硬约束:${config.keywords || '通用电商图标'}`,
    `数量硬约束:${config.quantity}张`,
    '规则:图标简洁清晰,主题色占比高,禁止偏色和随机多色污染',
  ]
  return shortenSegment(segments.join(' | '), MAX_PROMPT_LENGTH)
}

const finishTask = (task: IconTask, imageUrls: string[]) => {
  const generated = imageUrls.map((url, index) => ({
    id: `${task.id}_${index}`,
    name: `${task.config.mode}_${index + 1}.png`,
    url,
    createdAt: task.createdAt,
  }))
  results.value = [...generated, ...results.value]
  tasks.value = tasks.value.filter((item) => item.id !== task.id)
  ElMessage.success(`${task.name} 已完成`)
}

const runTask = (taskId: string) => {
  stopTimer(taskId)
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task || task.status !== 'running' || task.requestStarted) return
  task.requestStarted = true
  task.progress = Math.max(task.progress, 10)
  const controller = new AbortController()
  controllerMap.set(taskId, controller)
  const timer = window.setInterval(() => {
    const task = tasks.value.find((item) => item.id === taskId)
    if (!task || task.status !== 'running') {
      stopTimer(taskId)
      return
    }
    task.progress = Math.min(task.progress + 10, 90)
  }, 1000)
  timerMap.set(taskId, timer)
  ;(async () => {
    try {
      const response = await generateTextToImage(
        {
          prompt: buildIconPrompt(task.config),
          size: '1K',
          sequential_image_generation: task.config.quantity > 1 ? 'auto' : 'disabled',
          generation_num: task.config.quantity,
        },
        controller.signal,
      )
      if (response.imageUrls.length === 0) {
        throw new Error('图示生成失败：接口未返回图片')
      }
      task.progress = 100
      stopTimer(taskId)
      controllerMap.delete(taskId)
      const finalUrls = response.imageUrls.slice(0, task.config.quantity)
      finishTask(task, finalUrls)
    } catch (error) {
      const message = error instanceof Error ? error.message : '图示生成失败'
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        message.toLowerCase().includes('abort')
      ) {
        task.status = 'paused'
      } else {
        ElMessage.error(message)
      }
      task.requestStarted = false
      stopTimer(taskId)
      controllerMap.delete(taskId)
    }
  })()
}

const createTask = async () => {
  const taskConfig = buildTaskConfig()
  creating.value = true
  try {
    const id = `icon_${Date.now()}`
    const task: IconTask = {
      id,
      name: `图示任务_${new Date().toLocaleTimeString()}`,
      summary: `${taskConfig.mode} / ${taskConfig.color} / 数量:${taskConfig.quantity} / ${taskConfig.keywords || '无关键字'}`,
      config: taskConfig,
      status: 'running',
      progress: 0,
      createdAt: getCurrentTime(),
      requestStarted: false,
    }
    tasks.value = [task, ...tasks.value]
    runTask(id)
  } finally {
    creating.value = false
  }
}

const pauseTask = (taskId: string) => {
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task || task.status !== 'running') return
  task.status = 'paused'
  task.requestStarted = false
  abortTaskRequest(taskId)
  stopTimer(taskId)
}

const resumeTask = (taskId: string) => {
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task || task.status !== 'paused') return
  task.status = 'running'
  runTask(taskId)
}

const cancelTask = (taskId: string) => {
  abortTaskRequest(taskId)
  stopTimer(taskId)
  tasks.value = tasks.value.filter((item) => item.id !== taskId)
  ElMessage.success('任务已取消')
}

onMounted(() => {
  restoreState()
})

onBeforeUnmount(() => {
  Array.from(timerMap.keys()).forEach((taskId) => stopTimer(taskId))
  Array.from(controllerMap.keys()).forEach((taskId) => abortTaskRequest(taskId))
})

watch(
  [tasks, results, () => form.mode, () => form.color, () => form.keywords, () => form.quantity],
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

.panel-card {
  min-height: 360px;
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

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.result-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px;
}

.result-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
}

.result-name {
  margin-top: 6px;
  font-size: 13px;
  color: #303133;
}

.result-time {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.w-full {
  width: 100%;
}
</style>
