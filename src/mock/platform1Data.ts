// mock/platform1Data.ts

export interface TargetingPackage {
  id: number | string
  name: string
  createTime: string
}

export interface TitleLibrary {
  id: number | string
  name: string
  product: string
  titles: string[]
  createTime: string
}

export interface LandingPage {
  id: number | string
  name: string
  url: string
  product: string
  siteType: string
  advertiserId: string
  createTime: string
}

export interface KeywordLibrary {
  id: number | string
  name: string
  product: string
  keywords: string[]
  createTime: string
}

export interface ComponentLibrary {
  id: number | string
  name: string
  type: string
  product: string
  advertiserId: string
  createTime: string
}

export interface ProductLibrary {
  id: number | string
  name: string
  libraryName: string
  product: string
  advertiserId: string
  image: string
  video: string
  createTime: string
}

export interface TextSummaryLibrary {
  id: number | string
  name: string
  product: string
  summaries: string[]
  createTime: string
}

// Mock Data Definitions
export const mockTargetingPackages: TargetingPackage[] = [
  { id: 1, name: '定向包 A', createTime: '2023-10-01 10:00:00' },
  { id: 2, name: '核心用户定向', createTime: '2023-10-02 11:30:00' },
  { id: 3, name: '测试组定向包', createTime: '2023-10-05 09:15:00' },
]

export const mockTitleLibraries: TitleLibrary[] = [
  {
    id: 1,
    name: '通用标题组1',
    product: '产品A',
    titles: ['爆款必买', '限时折扣'],
    createTime: '2023-10-01 10:00:00',
  },
  {
    id: 2,
    name: '双十一预热',
    product: '产品B',
    titles: ['全年最低价', '马上抢'],
    createTime: '2023-10-10 14:00:00',
  },
]

export const mockLandingPages: LandingPage[] = [
  {
    id: 101,
    name: '产品A主落地页',
    url: 'https://example.com/a',
    product: '产品A',
    siteType: '移动端',
    advertiserId: 'ADV_001',
    createTime: '2023-10-01 10:00:00',
  },
  {
    id: 102,
    name: '产品B促销页',
    url: 'https://example.com/b-sale',
    product: '产品B',
    siteType: 'PC端',
    advertiserId: 'ADV_002',
    createTime: '2023-10-15 16:20:00',
  },
]

export const mockKeywordLibraries: KeywordLibrary[] = [
  {
    id: 1,
    name: '核心关键词',
    product: '产品A',
    keywords: ['特价', '包邮', '正品'],
    createTime: '2023-09-01 10:00:00',
  },
  {
    id: 2,
    name: '长尾词测试',
    product: '产品A',
    keywords: ['2024最新款', '好用不贵'],
    createTime: '2023-09-05 10:00:00',
  },
]

export const mockComponentLibraries: ComponentLibrary[] = [
  {
    id: 1,
    name: '底部悬浮条',
    type: '转化组件',
    product: '全线产品',
    advertiserId: 'ADV_ALL',
    createTime: '2023-08-01 10:00:00',
  },
  {
    id: 2,
    name: '商品卡片',
    type: '展示组件',
    product: '产品A',
    advertiserId: 'ADV_001',
    createTime: '2023-08-10 10:00:00',
  },
]

export const mockProductLibraries: ProductLibrary[] = [
  {
    id: 1,
    name: '经典爆款商品',
    libraryName: '春季爆款库',
    product: '产品A',
    advertiserId: 'ADV_001',
    image: 'https://via.placeholder.com/150/FF0000',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    createTime: '2023-07-01 10:00:00',
  },
  {
    id: 2,
    name: '新款商品B',
    libraryName: '夏季上新',
    product: '产品B',
    advertiserId: 'ADV_002',
    image: 'https://via.placeholder.com/150/00FF00',
    video: '',
    createTime: '2023-07-15 10:00:00',
  },
]

export const mockTextSummaryLibraries: TextSummaryLibrary[] = [
  {
    id: 1,
    name: '卖点摘要组1',
    product: '产品A',
    summaries: ['全网底价，不容错过', '官方正品，假一赔十'],
    createTime: '2023-06-01 10:00:00',
  },
  {
    id: 2,
    name: '评价摘要',
    product: '产品B',
    summaries: ['好评如潮，买过都说好'],
    createTime: '2023-06-10 10:00:00',
  },
]

// Helper functions for IDs
export const getNextId = (arr: { id: number }[]) => {
  if (arr.length === 0) return 1
  return Math.max(...arr.map((item) => item.id)) + 1
}
