import { ElMessage } from 'element-plus'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import seedDb from '../../db.json'

nprogress.configure({ showSpinner: false })

type DbRecord = Record<string, unknown>
type DbCollection = DbRecord[]
type DbStore = Record<string, unknown>
type PersonnelDictionary = {
  designers: string[]
  creators: string[]
  photographers: string[]
  actors: string[]
  scriptwriters: string[]
  introMakers: string[]
}

const LOCAL_DB_KEY = 'smart-marketing-local-db'
let dbCache: DbStore | null = null
const PLATFORM1_COLLECTIONS = [
  'targetingPackages',
  'titleLibraries',
  'landingPages',
  'keywordLibraries',
  'componentLibraries',
  'productLibraries',
  'textSummaryLibraries',
] as const
const PLATFORM1_MIN_ITEMS = 11

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

const PERSONNEL_FALLBACK: PersonnelDictionary = {
  designers: ['张三', '孙七', '周八'],
  creators: ['李四', '王九'],
  photographers: ['赵六', '钱十'],
  actors: ['吴磊', '张子枫', '虚拟形象Alpha'],
  scriptwriters: ['王五', '郑十一'],
  introMakers: ['特效组A', '外包工作室B'],
}

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []

const ensurePersonnelDictionary = (db: DbStore): PersonnelDictionary => {
  const source = (db.personnel || {}) as Record<string, unknown>
  const merged: PersonnelDictionary = {
    designers: asStringArray(source.designers),
    creators: asStringArray(source.creators),
    photographers: asStringArray(source.photographers),
    actors: asStringArray(source.actors),
    scriptwriters: asStringArray(source.scriptwriters),
    introMakers: asStringArray(source.introMakers),
  }
  ;(Object.keys(PERSONNEL_FALLBACK) as (keyof PersonnelDictionary)[]).forEach((key) => {
    if (merged[key].length === 0) {
      merged[key] = [...PERSONNEL_FALLBACK[key]]
    }
  })
  return merged
}

const seedFromMaterial = (material: DbRecord, index: number) =>
  String(material.id ?? material.name ?? index)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

const pickValue = (list: string[], seed: number, fallback: string) =>
  list.length > 0 ? list[seed % list.length] : fallback

const hydrateMaterial = (material: DbRecord, index: number, personnel: PersonnelDictionary) => {
  const seed = seedFromMaterial(material, index)
  const next = { ...material }
  if (!next.designer) next.designer = pickValue(personnel.designers, seed, '张三')
  if (!next.creator) next.creator = pickValue(personnel.creators, seed + 1, '李四')
  if (!next.photographer) next.photographer = pickValue(personnel.photographers, seed + 2, '赵六')
  if (!next.actors) next.actors = pickValue(personnel.actors, seed + 3, '吴磊')
  if (!next.scriptwriter) next.scriptwriter = pickValue(personnel.scriptwriters, seed + 4, '王五')
  if (!next.introMaker) next.introMaker = pickValue(personnel.introMakers, seed + 5, '特效组A')
  return next
}

const hydrateDbForMaterialFilters = (db: DbStore) => {
  let changed = false
  const personnel = ensurePersonnelDictionary(db)
  if (JSON.stringify(db.personnel || {}) !== JSON.stringify(personnel)) {
    db.personnel = personnel as unknown as DbRecord
    changed = true
  }

  const materials = getCollection(db, 'materials')
  if (materials) {
    const updated = materials.map((material, index) => hydrateMaterial(material, index, personnel))
    if (JSON.stringify(updated) !== JSON.stringify(materials)) {
      db.materials = updated as unknown as DbCollection
      changed = true
    }
  }

  const albums = getCollection(db, 'albums')
  if (albums) {
    const updatedAlbums = albums.map((album) => {
      const currentMaterials = Array.isArray(album.materials) ? (album.materials as DbCollection) : []
      const updatedMaterials = currentMaterials.map((material, index) =>
        hydrateMaterial(material, index, personnel),
      )
      if (JSON.stringify(updatedMaterials) !== JSON.stringify(currentMaterials)) {
        changed = true
      }
      return {
        ...album,
        materials: updatedMaterials,
      }
    })
    if (JSON.stringify(updatedAlbums) !== JSON.stringify(albums)) {
      db.albums = updatedAlbums as unknown as DbCollection
      changed = true
    }
  }

  return changed
}

const hydrateDbForPlatform1 = (db: DbStore) => {
  let changed = false
  const seed = seedDb as DbStore
  PLATFORM1_COLLECTIONS.forEach((collectionName) => {
    const current = getCollection(db, collectionName) ?? []
    const seedCollection = getCollection(seed, collectionName) ?? []
    if (current.length < PLATFORM1_MIN_ITEMS && seedCollection.length >= PLATFORM1_MIN_ITEMS) {
      db[collectionName] = deepClone(seedCollection) as unknown as DbCollection
      changed = true
    }
  })
  return changed
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
    const changedByMaterialFilters = hydrateDbForMaterialFilters(dbCache)
    const changedByPlatform1 = hydrateDbForPlatform1(dbCache)
    if (changedByMaterialFilters || changedByPlatform1) {
      persistLocalDb(dbCache)
    }
    return dbCache
  }
  dbCache = deepClone(seedDb as DbStore)
  hydrateDbForMaterialFilters(dbCache)
  hydrateDbForPlatform1(dbCache)
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
      if (!id) {
        if (list) return list as T
        const record = db[collection]
        if (record && typeof record === 'object') return record as T
        return [] as T
      }
      if (!list) throw new Error('数据不存在')
      const item = list.find((entry) => String(entry.id) === String(id))
      if (!item) throw new Error('数据不存在')
      return item as T
    }),

  post: <T = unknown, D extends object = DbRecord>(url: string, data: D) =>
    runRequest<T>((db) => {
      const { collection } = parseRoute(url)
      if (!collection) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const payload: DbRecord = { ...(data as DbRecord) }
      if (payload.id === undefined || payload.id === null || payload.id === '') {
        payload.id = String(Date.now())
      }
      list.push(payload)
      persistLocalDb(db)
      return payload as T
    }),

  put: <T = unknown, D extends object = DbRecord>(url: string, data: D) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const source: DbRecord = data as DbRecord
      const targetId = id ?? String(source.id ?? '')
      if (!targetId) throw new Error('缺少数据 ID')
      const payload: DbRecord = { ...source, id: targetId }
      const index = list.findIndex((entry) => String(entry.id) === String(targetId))
      if (index >= 0) {
        list[index] = payload
      } else {
        list.push(payload)
      }
      persistLocalDb(db)
      return payload as T
    }),

  patch: <T = unknown, D extends object = DbRecord>(url: string, data: D) =>
    runRequest<T>((db) => {
      const { collection, id } = parseRoute(url)
      if (!collection || !id) throw new Error('请求路径无效')
      const list = ensureCollection(db, collection)
      const index = list.findIndex((entry) => String(entry.id) === String(id))
      if (index < 0) throw new Error('数据不存在')
      const current = list[index] ?? {}
      const updated: DbRecord = { ...current, ...(data as DbRecord), id }
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
