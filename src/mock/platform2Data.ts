// mock/platform2Data.ts

export interface IndustryProduct {
  id: number | string
  name: string
  product: string
  advertiserId: string
  createTime: string
}

export interface BrandImage {
  id: number | string
  name: string
  product: string
  advertiserId: string
  image: string
  createTime: string
}

export interface AvatarJumpPage {
  id: number | string
  name: string
  product: string
  advertiserId: string
  url: string
  createTime: string
}

export interface CopywritingPackage {
  id: number | string
  name: string
  product: string
  creator: string
  content: string[]
  createTime: string
}

export interface LandingPageV2 {
  id: number | string
  name: string
  url: string
  product: string
  creator: string
  createTime: string
}

export interface TargetingTemplate {
  id: number | string
  name: string
  product: string
  advertiserId: string
  conditions: string[]
  createTime: string
}

// Mock Data Definitions
export const mockIndustryProducts: IndustryProduct[] = [
  {
    id: 1,
    name: '教育类通用包',
    product: '在线课程A',
    advertiserId: 'ADV_501',
    createTime: '2023-11-01 10:00:00',
  },
  {
    id: 2,
    name: '游戏类推广包',
    product: '手游B',
    advertiserId: 'ADV_502',
    createTime: '2023-11-02 11:30:00',
  },
]

export const mockBrandImages: BrandImage[] = [
  {
    id: 1,
    name: '品牌Logo主图',
    product: '全线产品',
    advertiserId: 'ADV_ALL',
    image: 'https://via.placeholder.com/150/111111',
    createTime: '2023-11-03 10:00:00',
  },
  {
    id: 2,
    name: '节日限定形象',
    product: '产品A',
    advertiserId: 'ADV_501',
    image: 'https://via.placeholder.com/150/FF5555',
    createTime: '2023-11-10 14:00:00',
  },
]

export const mockAvatarJumpPages: AvatarJumpPage[] = [
  {
    id: 101,
    name: '官方号主页跳转',
    url: 'https://jump.example.com/official',
    product: '全线产品',
    advertiserId: 'ADV_ALL',
    createTime: '2023-11-01 10:00:00',
  },
  {
    id: 102,
    name: '达人合作页',
    url: 'https://jump.example.com/daren01',
    product: '产品A',
    advertiserId: 'ADV_501',
    createTime: '2023-11-15 16:20:00',
  },
]

export const mockCopywritingPackages: CopywritingPackage[] = [
  {
    id: 1,
    name: '双十二促销文案',
    product: '产品A',
    creator: '李白 (运营)',
    content: ['全场半价，错过等一年', '限时秒杀，数量有限'],
    createTime: '2023-10-01 10:00:00',
  },
  {
    id: 2,
    name: '拉新迎新文案',
    product: '产品B',
    creator: '杜甫 (商务)',
    content: ['新人注册送大礼', '点击领取新人券'],
    createTime: '2023-10-05 10:00:00',
  },
]

export const mockLandingPagesV2: LandingPageV2[] = [
  {
    id: 1,
    name: '核心转化落地页',
    url: 'https://example.com/p2/convert',
    product: '在线课程A',
    creator: '李清照 (前端)',
    createTime: '2023-11-01 10:00:00',
  },
  {
    id: 2,
    name: '双十一活动页',
    url: 'https://example.com/p2/1111',
    product: '产品A',
    creator: '辛弃疾 (UI)',
    createTime: '2023-10-20 10:00:00',
  },
]

export const mockTargetingTemplates: TargetingTemplate[] = [
  {
    id: 1,
    name: '一二线城市白领模板',
    product: '全线产品',
    advertiserId: 'ADV_ALL',
    conditions: ['年龄: 25-35', '地域: 一二线城市', '兴趣: 科技、投资'],
    createTime: '2023-11-01 10:00:00',
  },
  {
    id: 2,
    name: '下沉市场拉新模板',
    product: '产品B',
    advertiserId: 'ADV_502',
    conditions: ['年龄: 18-45', '地域: 三四线城市', '设备: 安卓'],
    createTime: '2023-11-10 10:00:00',
  },
]

// Helper functions for IDs
export const getNextId = (arr: { id: number }[]) => {
  if (arr.length === 0) return 1
  return Math.max(...arr.map((item) => item.id)) + 1
}
