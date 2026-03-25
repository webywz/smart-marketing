import { ElMessage } from 'element-plus'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import seedDb from '../../db.json'

nprogress.configure({ showSpinner: false })

type DbRecord = Record<string, unknown>
type DbCollection = DbRecord[]
type DbStore = Record<string, unknown>

const LOCAL_DB_KEY = 'smart-marketing-local-db'
let dbCache: DbStore | null = null

const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {}
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

const normalizeUrl = (url: string) => {
  return url.split('?')[0]?.split('#')[0]?.replace(/^\/+/, '') ?? ''
}

const parseRoute = (url: string) => {
  const path = normalizeUrl(url)
  const [collection = '', id] = path.split('/').filter(Boolean)
  return { collection, id }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '请求失败'
}

const readLocalDb = (): DbStore | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LOCAL_DB_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DbStore
  } catch {
    return null
  }
}

const persistLocalDb = (db: DbStore) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db))
}

const ensureDb = async (): Promise<DbStore> => {
  if (dbCache) return dbCache
  const local = readLocalDb()
  if (local) {
    dbCache = local
    return dbCache
  }
  dbCache = deepClone(seedDb as DbStore)
  persistLocalDb(dbCache)
  return dbCache
}

const getCollection = (db: DbStore, collection: string) => {
  const value = db[collection]
  if (Array.isArray(value)) {
    return value as DbCollection
  }
  return null
}

const ensureCollection = (db: DbStore, collection: string) => {
  const current = getCollection(db, collection)
  if (current) return current
  const created: DbCollection = []
  db[collection] = created
  return created
}

const runRequest = async <T>(executor: (db: DbStore) => T | Promise<T>) => {
  nprogress.start()
  try {
    const db = await ensureDb()
    const result = await executor(db)
    nprogress.done()
    return deepClone(result)
  } catch (error) {
    nprogress.done()
    const message = getErrorMessage(error)
    ElMessage.error(message)
    return Promise.reject(error)
  }
}

const service = {
  get: <T = unknown>(url: string) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection) throw new Error('请求路径无效')
      const list = getCollection(db, collection)
      if (!list) return [] as T
      if (!id) return list as T
      const item = list.find((entry) => String(entry.id) === String(id))
      if (!item) throw new Error('数据不存在')
      return item as T
    }),

  post: <T = unknown>(url: string, data: DbRecord) =>
    runRequest<T>((db) => {
      const { collection } = parseRoute(url)
      if (!collection) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const payload = { ...data }
      if (payload.id === undefined || payload.id === null || payload.id === '') {
        payload.id = String(Date.now())
      }
      list.push(payload)
      persistLocalDb(db)
      return payload as T
    }),

  put: <T = unknown>(url: string, data: DbRecord) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const targetId = id ?? String(data.id ?? '')
      if (!targetId) throw new Error('缺少数据 ID')
      const payload = { ...data, id: targetId }
      const index = list.findIndex((entry) => String(entry.id) === String(targetId))
      if (index >= 0) {
        list[index] = payload
      } else {
        list.push(payload)
      }
      persistLocalDb(db)
      return payload as T
    }),

  patch: <T = unknown>(url: string, data: DbRecord) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection || !id) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const index = list.findIndex((entry) => String(entry.id) === String(id))
      if (index < 0) throw new Error('数据不存在')
      const current = list[index] ?? {}
      const updated = { ...current, ...data, id }
      list[index] = updated
      persistLocalDb(db)
      return updated as T
    }),

  delete: <T = unknown>(url: string) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection || !id) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const index = list.findIndex((entry) => String(entry.id) === String(id))
      if (index < 0) throw new Error('数据不存在')
      const deleted = list[index]
      list.splice(index, 1)
      persistLocalDb(db)
      return deleted as T
    }),
}

export default service
