export interface Material {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnail: string;
  size: number;

  // Personnel Metadata
  designer?: string;
  creator?: string;
  photographer?: string;
  actors?: string;
  scriptwriter?: string;
  introMaker?: string;

  // New Management Fields
  status: 'enabled' | 'disabled';
  folderId: string;
  tags: string[]; // Custom labels
  platformTags: string[]; // 3rd party tags
  auditStatus: 'pending' | 'approved' | 'rejected'; // 3rd party audit
  usageCount: number; // Total uses
  platform1Usage: number; // 3rd party platform 1
  platform2Usage: number; // 3rd party platform 2
  approvalRate: number; // calculated % (e.g. 98.5)
  isFavorite: boolean;

  createTime: string;
  updateTime: string;
}

export interface Album {
  id: string;
  name: string;
  product: string;
  author: string;
  permissions: string;
  createTime: string;
  updateTime: string;
  materials: Material[]; // Reference mainly for Album view backward compatibility
}

// Global Material Pool (Flattened for Material Management View)
export const mockMaterials: Material[] = [
  {
    id: 'm1',
    name: '24夏大促_主KV_最终版.png',
    type: 'image/png',
    url: 'https://via.placeholder.com/600x400?text=KV',
    thumbnail: 'https://via.placeholder.com/150?text=KV',
    size: 2048000,
    designer: '张三',
    creator: '李四',
    status: 'enabled',
    folderId: 'f1',
    tags: ['S级', '夏季大促'],
    platformTags: ['高光影', '明亮'],
    auditStatus: 'approved',
    usageCount: 1542,
    platform1Usage: 1200,
    platform2Usage: 342,
    approvalRate: 99.5,
    isFavorite: true,
    createTime: '2024-05-02 11:00:00',
    updateTime: '2024-05-02 11:00:00',
  },
  {
    id: 'm2',
    name: '品牌宣传_15s短视频.mp4',
    type: 'video/mp4',
    url: 'https://via.placeholder.com/600x400?text=Video',
    thumbnail: 'https://via.placeholder.com/150?text=Video',
    size: 51200000,
    scriptwriter: '王五',
    photographer: '赵六',
    actors: '吴磊',
    introMaker: '特效组A',
    status: 'enabled',
    folderId: 'f2',
    tags: ['品牌向'],
    platformTags: ['年轻化', '动感'],
    auditStatus: 'pending',
    usageCount: 890,
    platform1Usage: 500,
    platform2Usage: 390,
    approvalRate: 85.0,
    isFavorite: false,
    createTime: '2024-05-10 09:00:00',
    updateTime: '2024-05-15 14:30:00',
  },
  {
    id: 'm3',
    name: 'Logo_源文件_2024版.ai',
    type: 'application/postscript',
    url: 'https://via.placeholder.com/600x400?text=Logo',
    thumbnail: 'https://via.placeholder.com/150?text=Logo',
    size: 5120000,
    designer: '孙七',
    status: 'disabled', // Historically disabled
    folderId: 'f3',
    tags: ['基础物料', '机密'],
    platformTags: [],
    auditStatus: 'approved',
    usageCount: 50,
    platform1Usage: 10,
    platform2Usage: 40,
    approvalRate: 100,
    isFavorite: true,
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-01-15 10:00:00',
  },
  {
    id: 'm4',
    name: '双十一_预热海报_草稿.jpg',
    type: 'image/jpeg',
    url: 'https://via.placeholder.com/600x400?text=Draft',
    thumbnail: 'https://via.placeholder.com/150?text=Draft',
    size: 1548000,
    designer: '张三',
    creator: '李四',
    status: 'enabled',
    folderId: 'f1',
    tags: ['草稿', '双十一'],
    platformTags: ['促销'],
    auditStatus: 'rejected',
    usageCount: 0,
    platform1Usage: 0,
    platform2Usage: 0,
    approvalRate: 0,
    isFavorite: false,
    createTime: '2024-09-01 09:00:00',
    updateTime: '2024-09-02 10:00:00',
  }
];

// Reconstruct mockAlbums utilizing mockMaterials points by ID conceptually.
export const mockAlbums: Album[] = [
  {
    id: 'a1',
    name: '2024夏季大促',
    product: '智能手机X系列',
    author: 'Admin',
    permissions: 'Public',
    createTime: '2024-05-01 10:00:00',
    updateTime: '2024-05-15 14:30:00',
    materials: [mockMaterials[0] as Material, mockMaterials[1] as Material]
  },
  {
    id: 'a2',
    name: '品牌形象升级',
    product: '全线产品',
    author: 'Admin',
    permissions: 'Private',
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-03-20 16:00:00',
    materials: [mockMaterials[2] as Material]
  }
];

export interface TagGroup {
  id: string;
  name: string;
  createTime: string;
  updateTime: string;
}

export interface Tag {
  id: string;
  name: string;
  groupId: string;
  materialCount: number;
  createTime: string;
  updateTime: string;
}

export const mockTagGroups: TagGroup[] = [
  { id: 'g1', name: '优先级', createTime: '2024-01-01 10:00:00', updateTime: '2024-01-01 10:00:00' },
  { id: 'g2', name: '活动属性', createTime: '2024-01-05 10:00:00', updateTime: '2024-01-05 10:00:00' },
  { id: 'g3', name: '物料类型', createTime: '2024-02-01 10:00:00', updateTime: '2024-02-01 10:00:00' }
];

export const mockStructuredTags: Tag[] = [
  { id: 't1', name: 'S级', groupId: 'g1', materialCount: 154, createTime: '2024-01-01 10:00:00', updateTime: '2024-01-01 10:00:00' },
  { id: 't2', name: 'A级', groupId: 'g1', materialCount: 890, createTime: '2024-01-01 10:00:00', updateTime: '2024-01-01 10:00:00' },
  { id: 't3', name: '夏季大促', groupId: 'g2', materialCount: 320, createTime: '2024-01-05 10:00:00', updateTime: '2024-01-05 10:00:00' },
  { id: 't4', name: '双十一', groupId: 'g2', materialCount: 500, createTime: '2024-01-05 10:00:00', updateTime: '2024-01-05 10:00:00' },
  { id: 't5', name: '品牌向', groupId: 'g3', materialCount: 120, createTime: '2024-02-01 10:00:00', updateTime: '2024-02-01 10:00:00' },
  { id: 't6', name: '基础物料', groupId: 'g3', materialCount: 2000, createTime: '2024-02-01 10:00:00', updateTime: '2024-02-01 10:00:00' },
  { id: 't7', name: '草稿', groupId: 'g3', materialCount: 50, createTime: '2024-02-01 10:00:00', updateTime: '2024-02-01 10:00:00' }
];

// Helper dictionaries for dropdowns
export const mockTags = mockStructuredTags.map(t => t.name);
export const mockPlatformTags = ['高光影', '明亮', '年轻化', '动感', '促销', '教育'];

export interface Folder {
  id: string;
  name: string;
}

export type ViewItem = (Material & { itemType: 'file' }) | { itemType: 'folder'; name: string; path: string };

export const mockFolders = [
  { id: 'f1', name: '活动素材/2024大促' },
  { id: 'f2', name: '视频库/品牌宣发' },
  { id: 'f3', name: 'VI视觉系统/源文件' },
  { id: 'f4', name: '日常投放/图文' }
];

export const mockPersonnel = {
  designers: ['张三', '孙七', '周八'],
  creators: ['李四', '王九'],
  photographers: ['赵六', '钱十'],
  actors: ['吴磊', '张子枫', '虚拟形象Alpha'],
  scriptwriters: ['王五', '郑十一'],
  introMakers: ['特效组A', '外包工作室B']
};
