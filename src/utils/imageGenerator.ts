export type MultiImageToImagePayload = {
  prompt: string
  size?: string
  sequential_image_generation?: 'auto' | 'disabled'
  generation_num?: number
  images?: string[]
}

export type TextToImagePayload = {
  prompt: string
  size?: string
  sequential_image_generation?: 'auto' | 'disabled'
  generation_num?: number
}

const IMAGE_GENERATOR_ENDPOINT = 'http://115.190.58.190:7100/api/v1/generate/multi-image-to-image'
const TEXT_IMAGE_GENERATOR_ENDPOINT = 'http://115.190.58.190:7100/api/v1/generate/text-to-image'
const FILE_UPLOAD_ENDPOINT = 'https://pluginapi.laidianbanlv.cn/file/upload'

const isString = (value: unknown): value is string => typeof value === 'string'

const isHttpUrl = (value: unknown): value is string =>
  isString(value) && /^https?:\/\//i.test(value.trim())

const isDataImage = (value: unknown): value is string =>
  isString(value) && /^data:image\//i.test(value.trim())

const collectUrlsFromUnknown = (value: unknown, bucket: Set<string>) => {
  if (!value) return
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrlsFromUnknown(item, bucket))
    return
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    Object.values(record).forEach((item) => collectUrlsFromUnknown(item, bucket))
    return
  }
  if (isHttpUrl(value) || isDataImage(value)) {
    bucket.add(value.trim())
  }
}

export const extractImageUrls = (raw: unknown) => {
  const bucket = new Set<string>()
  collectUrlsFromUnknown(raw, bucket)
  return Array.from(bucket)
}

const parseJsonResponse = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

const readUploadUrl = (data: unknown) => {
  const imageUrls = extractImageUrls(data)
  if (imageUrls.length > 0) {
    return imageUrls[0]
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const direct = record.url
    if (typeof direct === 'string' && direct.trim()) {
      return direct.trim()
    }
    if (record.data && typeof record.data === 'object') {
      const nested = (record.data as Record<string, unknown>).url
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim()
      }
    }
  }
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  return ''
}

export const uploadImageFile = async (file: File, signal?: AbortSignal) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(FILE_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData,
    signal,
  })
  const data = await parseJsonResponse(response)
  if (!response.ok) {
    throw new Error(`图片上传失败: ${response.status}`)
  }
  if (data && typeof data === 'object') {
    const code = (data as Record<string, unknown>).code
    if (code !== undefined && ![0, 200, '0', '200'].includes(code as never)) {
      throw new Error('图片上传失败: 接口返回异常')
    }
  }
  const imageUrl = readUploadUrl(data)
  if (!imageUrl) {
    throw new Error('图片上传失败: 未返回可用图片地址')
  }
  return imageUrl
}

export const generateImageToImage = async (payload: MultiImageToImagePayload, signal?: AbortSignal) => {
  const normalizedPayload: MultiImageToImagePayload = {
    prompt: payload.prompt,
    size: payload.size || '2K',
    sequential_image_generation: payload.sequential_image_generation || 'disabled',
    generation_num: Math.max(1, payload.generation_num || 1),
  }
  const normalizedImages = (payload.images || []).slice(0, 10)
  if (normalizedImages.length > 0) {
    normalizedPayload.images = normalizedImages
  }
  const response = await fetch(IMAGE_GENERATOR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedPayload),
    signal,
  })
  if (!response.ok) {
    throw new Error(`图生图请求失败: ${response.status}`)
  }
  const data = await response.json()
  return {
    raw: data,
    imageUrls: extractImageUrls(data),
  }
}

export const generateTextToImage = async (payload: TextToImagePayload, signal?: AbortSignal) => {
  const normalizedPayload: TextToImagePayload = {
    prompt: payload.prompt,
    size: payload.size || '1K',
    sequential_image_generation: payload.sequential_image_generation || 'disabled',
    generation_num: Math.max(1, payload.generation_num || 1),
  }
  const response = await fetch(TEXT_IMAGE_GENERATOR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedPayload),
    signal,
  })
  if (!response.ok) {
    throw new Error(`文生图请求失败: ${response.status}`)
  }
  const data = await response.json()
  return {
    raw: data,
    imageUrls: extractImageUrls(data),
  }
}
