export interface ProductGroup {
  id: number;
  name: string;
  createTime: string;
}

export interface Product {
  id: number;
  name: string;
  groupId: number | null;
  bid: number;
  image: string;
  status: 'active' | 'inactive';
  createTime: string;
}

// Initial Mock Data
let nextGroupId = 4;
export const mockProductGroups: ProductGroup[] = [
  { id: 1, name: '营销活动', createTime: '2023-10-01 10:00:00' },
  { id: 2, name: '落地页资产', createTime: '2023-10-02 11:30:00' },
  { id: 3, name: '广告创意', createTime: '2023-10-03 09:15:00' }
];

let nextProductId = 11;
export const mockProducts: Product[] = [
  { id: 1, name: '双十一大促活动A', groupId: 1, bid: 500.0, image: 'https://via.placeholder.com/150/FF4500/FFFFFF?Text=11.11', status: 'active', createTime: '2023-10-10 14:00:00' },
  { id: 2, name: '春季拉新落地页', groupId: 2, bid: 150.5, image: 'https://via.placeholder.com/150/32CD32/FFFFFF?Text=Spring', status: 'active', createTime: '2023-10-11 10:20:00' },
  { id: 3, name: '信息流视频素材-跑鞋', groupId: 3, bid: 1000.0, image: 'https://via.placeholder.com/150/1E90FF/FFFFFF?Text=Video', status: 'inactive', createTime: '2023-10-12 16:45:00' },
  { id: 4, name: '618预热营销方案', groupId: 1, bid: 200.0, image: 'https://via.placeholder.com/150/FF69B4/FFFFFF?Text=618', status: 'active', createTime: '2023-10-13 09:30:00' },
  { id: 5, name: 'APP下载引导页', groupId: 2, bid: 80.0, image: 'https://via.placeholder.com/150/8A2BE2/FFFFFF?Text=APP', status: 'active', createTime: '2023-10-14 11:11:00' },
  { id: 6, name: '开屏广告-美妆', groupId: 3, bid: 1500.0, image: 'https://via.placeholder.com/150/FF1493/FFFFFF?Text=Splash', status: 'active', createTime: '2023-10-15 13:25:00' },
  { id: 7, name: '跨年狂欢活动池', groupId: 1, bid: 450.0, image: 'https://via.placeholder.com/150/DC143C/FFFFFF?Text=NewYear', status: 'inactive', createTime: '2023-10-16 15:50:00' },
  { id: 8, name: '表单收集落地页(B端)', groupId: 2, bid: 25.0, image: 'https://via.placeholder.com/150/4682B4/FFFFFF?Text=Form', status: 'active', createTime: '2023-10-17 08:40:00' },
  { id: 9, name: '搜索关键词组件', groupId: 3, bid: 300.0, image: 'https://via.placeholder.com/150/20B2AA/FFFFFF?Text=Search', status: 'active', createTime: '2023-10-18 10:05:00' },
  { id: 10, name: '日常促活活动', groupId: 1, bid: 30.0, image: 'https://via.placeholder.com/150/FF8C00/FFFFFF?Text=Daily', status: 'active', createTime: '2023-10-19 14:30:00' }
];

export const getNextGroupId = () => nextGroupId++;
export const getNextProductId = () => nextProductId++;

export interface AppAsset {
  id: string;
  name: string;
  type: '快应用' | '小程序' | 'Android' | 'iOS' | '鸿蒙';
  productId: number;
  os: 'Android' | 'iOS' | 'None';
  downloadUrl: string;
  subPackages: string[];
  syncStatus: 'synced' | 'unsynced';
  createTime: string;
}

export const mockApps: AppAsset[] = [
  {
    id: 'app_1001',
    name: '电商极速版快应用',
    type: '快应用',
    productId: 1, // 双十一大促活动A
    os: 'Android',
    downloadUrl: 'hap://app/com.ecommerce.fast',
    subPackages: ['/pages/home/index', '/pages/cart/index'],
    syncStatus: 'synced',
    createTime: '2023-11-01 10:00:00'
  },
  {
    id: 'app_1002',
    name: '品牌特卖小程序',
    type: '小程序',
    productId: 2, // 春季拉新落地页
    os: 'None',
    downloadUrl: 'weixin://app/wx1234567890abcdef',
    subPackages: ['/pkg_activity/pages/main'],
    syncStatus: 'unsynced',
    createTime: '2023-11-02 14:30:00'
  },
  {
    id: 'app_1003',
    name: '官方旗舰店App',
    type: 'iOS',
    productId: 4, // 618预热营销方案
    os: 'iOS',
    downloadUrl: 'https://apps.apple.com/app/id123456789',
    subPackages: [],
    syncStatus: 'synced',
    createTime: '2023-11-05 09:15:00'
  },
  {
    id: 'app_1004',
    name: '游戏联运Android包',
    type: 'Android',
    productId: 10, // 日常促活活动
    os: 'Android',
    downloadUrl: 'https://cdn.example.com/downloads/game_v1.2.apk',
    subPackages: ['sub_res_01.zip', 'sub_res_02.zip'],
    syncStatus: 'unsynced',
    createTime: '2023-11-08 16:45:00'
  },
  {
    id: 'app_1005',
    name: '智能家居控制端',
    type: '鸿蒙',
    productId: 5, // APP下载引导页
    os: 'None',
    downloadUrl: 'appgallery://details?id=com.smarthome.harmony',
    subPackages: [],
    syncStatus: 'synced',
    createTime: '2023-11-10 11:20:00'
  }
];

export const getNextAppId = () => `app_${Date.now()}`;
