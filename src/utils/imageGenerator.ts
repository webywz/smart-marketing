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

export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result || '')
      const base64 = raw.includes(',') ? raw.split(',')[1] || '' : raw
      if (!base64) {
        reject(new Error('图片转码失败'))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

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
