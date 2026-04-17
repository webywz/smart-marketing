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
            <el-form-item label="主题色">
              <div class="color-control">
                <el-radio-group v-model="form.colorMode" size="small">
                  <el-radio-button label="preset">预设</el-radio-button>
                  <el-radio-button label="hex">HEX</el-radio-button>
                </el-radio-group>
                <el-select v-if="form.colorMode === 'preset'" v-model="form.colorPreset" class="w-full">
                  <el-option
                    v-for="preset in COLOR_PRESETS"
                    :key="preset.name"
                    :label="preset.name"
                    :value="preset.name"
                  />
                </el-select>
                <el-input
                  v-else
                  v-model="form.colorHex"
                  class="w-full"
                  placeholder="例如：#409EFF"
                  maxlength="7"
                />
              </div>
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
import type { UploadRawFile, UploadUserFile } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { generateImageToImage, uploadImageFile } from '@/utils/imageGenerator'

type TaskStatus = 'running' | 'paused' | 'cancelled' | 'completed' | 'failed'

type TaskConfig = {
  mode: string
  color: string
  colorConstraintPrompt: string
  keywords: string
  sellingPoints: string
  prompt: string
  quantity: number
}

type ImageTask = {
  id: string
  name: string
  status: TaskStatus
  progress: number
  configSummary: string
  config: TaskConfig
  fileNames: string
  sourceFiles: File[]
  resultUrls: string[]
  requestStarted: boolean
}

const getDefaultForm = () => ({
  mode: '参考生图',
  colorMode: 'preset' as 'preset' | 'hex',
  colorPreset: '品牌主色',
  colorHex: '#409EFF',
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

const isUploadRawFile = (file: UploadUserFile['raw']): file is UploadRawFile => Boolean(file)

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

type ColorPreset = {
  name: string
  aliases: string[]
  rule: string
  palette?: string[]
  forbidden?: string
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: '品牌主色',
    aliases: ['品牌主色', '品牌色', 'brand', 'brand color'],
    rule: '主色严格使用品牌主色，画面其他主题色仅做低饱和陪衬，不得喧宾夺主',
    palette: ['#409EFF', '#66B1FF', '#8CC5FF'],
    forbidden: '高饱和杂色、霓虹荧光色',
  },
  {
    name: '冷色调',
    aliases: ['冷色调', '冷色', 'cool', 'cool tone'],
    rule: '主色限定为冷色系（蓝、青、紫）并保持低色温，避免暖色大面积出现',
    palette: ['#2F54EB', '#13C2C2', '#722ED1'],
    forbidden: '红橙黄暖色大面积覆盖',
  },
  {
    name: '暖色调',
    aliases: ['暖色调', '暖色', 'warm', 'warm tone'],
    rule: '主色限定为暖色系（红、橙、黄）并保持温暖氛围，避免冷色主导画面',
    palette: ['#F5222D', '#FA8C16', '#FADB14'],
    forbidden: '蓝青紫冷色大面积覆盖',
  },
  {
    name: '金属感',
    aliases: ['金属感', 'metal', 'metallic'],
    rule: '主色采用金属质感配色（银灰/枪灰/金属蓝），高光与反射需保持统一',
    palette: ['#8C8C8C', '#595959', '#597EF7'],
    forbidden: '高饱和卡通色块、荧光色',
  },
  {
    name: '黑金',
    aliases: ['黑金', 'black gold'],
    rule: '配色严格限定黑金体系：黑色为底、金色点缀，禁止出现高饱和彩色元素',
    palette: ['#000000', '#1F1F1F', '#D4B106'],
    forbidden: '蓝绿紫等彩色大面积覆盖',
  },
  {
    name: '莫兰迪',
    aliases: ['莫兰迪', 'morandi'],
    rule: '主色使用莫兰迪低饱和配色，降低对比度与饱和度，保持柔和高级感',
    palette: ['#A3B18A', '#B7A99A', '#8D99AE'],
    forbidden: '高饱和高对比撞色',
  },
]

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const normalizeColorKey = (value: string) => value.trim().toLowerCase()

const normalizeHexColor = (input: string) => {
  const raw = input.trim().replace(/^#/, '').toUpperCase()
  const hex6 =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => `${ch}${ch}`)
          .join('')
      : raw
  const r = Number.parseInt(hex6.slice(0, 2), 16)
  const g = Number.parseInt(hex6.slice(2, 4), 16)
  const b = Number.parseInt(hex6.slice(4, 6), 16)
  return {
    hex: `#${hex6}`,
    r,
    g,
    b,
  }
}

const buildHardColorPrompt = (color: string, palette: string[], forbidden: string) => {
  const paletteText = palette.length > 0 ? palette.join(',') : color
  return [
    `主题色硬约束:${color}`,
    `调色板:${paletteText}`,
    '占比:主色>=75%,辅色<=20%,点缀<=5%',
    `禁用:${forbidden}`,
    '必须不透明(alpha=1),禁止透明灰雾和随机多色',
  ].join('；')
}

const resolveColorConstraint = (rawColor: string) => {
  const input = rawColor.trim()
  if (!input) {
    const preset = COLOR_PRESETS[0]
    const forbidden = preset.forbidden || '与主色冲突的高饱和杂色'
    const palette = preset.palette || []
    return {
      color: preset.name,
      rule: buildHardColorPrompt(preset.name, palette, forbidden),
      fallback: false,
      fromHex: false,
    }
  }
  if (HEX_COLOR_PATTERN.test(input)) {
    const normalizedHex = normalizeHexColor(input)
    const color = normalizedHex.hex
    return {
      color,
      rule: buildHardColorPrompt(
        color,
        [color],
        '与该HEX互补色或高饱和彩色块大面积覆盖',
      ),
      fallback: false,
      fromHex: true,
    }
  }
  const normalized = normalizeColorKey(input)
  const preset = COLOR_PRESETS.find((item) =>
    item.aliases.some((alias) => normalizeColorKey(alias) === normalized),
  )
  if (preset) {
    const forbidden = preset.forbidden || '与主色冲突的高饱和杂色'
    const palette = preset.palette || []
    return {
      color: preset.name,
      rule: buildHardColorPrompt(preset.name, palette, forbidden),
      fallback: false,
      fromHex: false,
    }
  }
  const defaultPreset = COLOR_PRESETS[0]
  const forbidden = defaultPreset.forbidden || '与主色冲突的高饱和杂色'
  const palette = defaultPreset.palette || []
  return {
    color: defaultPreset.name,
    rule: buildHardColorPrompt(defaultPreset.name, palette, forbidden),
    fallback: true,
    fromHex: false,
  }
}

const getRawColorInput = () => (form.colorMode === 'hex' ? form.colorHex : form.colorPreset)

const MAX_PROMPT_LENGTH = 300

const shortenSegment = (value: string, maxLength: number) => {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

const buildConstrainedPrompt = (config: TaskConfig) => {
  const prioritizedSegments = [
    { text: config.colorConstraintPrompt, max: 130 },
    { text: `主题色锁定:${config.color}`, max: 28 },
    { text: `关键词硬约束:${config.keywords || '无'}`, max: 90 },
    { text: `数量硬约束:${config.quantity}张`, max: 24 },
    { text: `模式:${config.mode}`, max: 20 },
    { text: config.prompt ? `补充提示:${config.prompt}` : '', max: 70 },
    { text: config.sellingPoints ? `卖点:${config.sellingPoints}` : '', max: 48 },
  ].filter((item) => Boolean(item.text))

  const result: string[] = []
  let usedLength = 0
  for (const segment of prioritizedSegments) {
    const reservedSeparator = result.length > 0 ? 3 : 0
    const remaining = MAX_PROMPT_LENGTH - usedLength - reservedSeparator
    if (remaining <= 0) break
    const piece = shortenSegment(segment.text, Math.min(segment.max, remaining))
    if (!piece) break
    result.push(piece)
    usedLength += reservedSeparator + piece.length
  }
  return result.join(' | ')
}

const buildTaskConfig = (): TaskConfig => {
  const resolved = resolveColorConstraint(getRawColorInput())
  return {
    mode: form.mode,
    color: resolved.color,
    colorConstraintPrompt: resolved.rule,
    keywords: form.keywords,
    sellingPoints: form.sellingPoints,
    prompt: form.prompt,
    quantity: Math.min(4, Math.max(1, Number(form.quantity) || 1)),
  }
}

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
  const task = getTaskById(taskId)
  if (!task || task.status !== 'running' || task.requestStarted) {
    return
  }
  if (task.sourceFiles.length === 0) {
    task.status = 'failed'
    task.requestStarted = false
    ElMessage.error('任务缺少源图，未触发上传接口，请重新上传后新建任务')
    return
  }
  task.progress = Math.max(task.progress, 10)
  task.requestStarted = true
  const controller = new AbortController()
  controllerMap.set(taskId, controller)
  const timer = window.setInterval(() => {
    const task = getTaskById(taskId)
    if (!task || task.status !== 'running') {
      stopTaskTimer(taskId)
      return
    }
    task.progress = Math.min(task.progress + 10, 90)
  }, 1000)
  timerMap.set(taskId, timer)
  ;(async () => {
    try {
      const uploadedUrls = await Promise.all(task.sourceFiles.map((file) => uploadImageFile(file, controller.signal)))
      if (uploadedUrls.length === 0) {
        throw new Error('上传接口未返回可用图片地址')
      }
      const prompt = buildConstrainedPrompt(task.config)
      const response = await generateImageToImage(
        {
          prompt,
          size: '2K',
          sequential_image_generation: task.config.quantity > 1 ? 'auto' : 'disabled',
          generation_num: task.config.quantity,
          images: uploadedUrls,
        },
        controller.signal,
      )
      if (response.imageUrls.length === 0) {
        throw new Error('接口未返回可用图片地址')
      }
      const uploadedSet = new Set(uploadedUrls)
      const generatedUrls = response.imageUrls.filter((url) => !uploadedSet.has(url))
      const finalUrls = (generatedUrls.length > 0 ? generatedUrls : response.imageUrls).slice(
        0,
        task.config.quantity,
      )
      task.resultUrls = finalUrls
      task.progress = 100
      task.status = 'completed'
      stopTaskTimer(taskId)
      controllerMap.delete(taskId)
      ElMessage.success(`${task.name} 已完成`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败'
      if ((error instanceof DOMException && error.name === 'AbortError') || message.toLowerCase().includes('abort')) {
        task.status = 'paused'
      } else {
        task.status = 'failed'
        ElMessage.error(message)
      }
      task.requestStarted = false
      stopTaskTimer(taskId)
      controllerMap.delete(taskId)
    }
  })()
}

const createTask = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传至少一张图片')
    return
  }
  const rawFiles = fileList.value.map((item) => item.raw).filter(isUploadRawFile)
  if (rawFiles.length === 0) {
    ElMessage.warning('上传文件无效，请重新上传')
    return
  }
  creatingTask.value = true
  try {
    const id = `i2i_${Date.now()}`
    const taskConfig = buildTaskConfig()
    const resolvedColor = resolveColorConstraint(getRawColorInput())
    if (resolvedColor.fallback) {
      ElMessage.warning('主题色未命中预设或HEX格式，已自动按“品牌主色”强约束执行')
    }
    const task: ImageTask = {
      id,
      name: `图生图任务_${new Date().toLocaleTimeString()}`,
      status: 'running',
      progress: 0,
      configSummary: `${taskConfig.mode} / ${taskConfig.color} / 数量:${taskConfig.quantity} / ${taskConfig.keywords || '无关键字'}`,
      config: taskConfig,
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
  [
    tasks,
    () => form.mode,
    () => form.colorMode,
    () => form.colorPreset,
    () => form.colorHex,
    () => form.keywords,
    () => form.sellingPoints,
    () => form.prompt,
    () => form.quantity,
  ],
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

.color-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
