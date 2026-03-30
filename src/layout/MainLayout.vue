<template>
  <div class="layout-container">
    <el-container class="full-height">
      <!-- 桌面端侧边栏 -->
      <el-aside v-if="!isMobile" :width="isCollapsed ? '64px' : '240px'" class="layout-aside">
        <div class="logo">
          <img src="/logo.png" alt="Logo" class="logo-image" />
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          :collapse="isCollapsed"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-sub-menu index="/material">
            <template #title>
              <el-icon><Picture /></el-icon>
              <span>素材上传及管理</span>
            </template>
            <el-menu-item index="/material/album">素材专辑管理</el-menu-item>
            <el-menu-item index="/material/list">素材管理</el-menu-item>
            <el-menu-item index="/material/tag">素材标签</el-menu-item>
            <el-menu-item index="/material/text-image-studio">文生图配置生成</el-menu-item>
            <el-menu-item index="/material/image-generation">图生图任务中心</el-menu-item>
            <el-menu-item index="/material/icon-generation">图示生成中心</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="/asset">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>资产管理</span>
            </template>
            <el-menu-item index="/asset/product">通用产品</el-menu-item>
            <el-menu-item index="/asset/app">通用应用管理</el-menu-item>
            <el-menu-item index="/asset/platform1">第三方平台1对接</el-menu-item>
            <el-menu-item index="/asset/platform2">第三方平台2对接</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 移动端抽屉侧边栏 -->
      <el-drawer
        v-model="drawerVisible"
        direction="ltr"
        :size="240"
        :with-header="false"
        :z-index="1001"
      >
        <div class="drawer-menu-wrapper">
          <div class="logo">
            <img src="/logo.png" alt="Logo" class="logo-image" />
          </div>
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            router
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
            @select="drawerVisible = false"
          >
            <el-sub-menu index="/material">
              <template #title>
                <el-icon><Picture /></el-icon>
                <span>素材上传及管理</span>
              </template>
              <el-menu-item index="/material/album">素材专辑管理</el-menu-item>
              <el-menu-item index="/material/list">素材管理</el-menu-item>
              <el-menu-item index="/material/tag">素材标签</el-menu-item>
              <el-menu-item index="/material/text-image-studio">文生图配置生成</el-menu-item>
              <el-menu-item index="/material/image-generation">图生图任务中心</el-menu-item>
              <el-menu-item index="/material/icon-generation">图示生成中心</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="/asset">
              <template #title>
                <el-icon><Box /></el-icon>
                <span>资产管理</span>
              </template>
              <el-menu-item index="/asset/product">通用产品</el-menu-item>
              <el-menu-item index="/asset/app">通用应用管理</el-menu-item>
              <el-menu-item index="/asset/platform1">第三方平台1对接</el-menu-item>
              <el-menu-item index="/asset/platform2">第三方平台2对接</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </el-drawer>

      <!-- 右侧内容区 -->
      <el-container class="right-container">
        <!-- 头部 -->
        <el-header class="layout-header">
          <div class="header-left">
            <el-icon class="hamburger" @click="toggleSidebar"
              ><Fold v-if="!isCollapsed && !isMobile" /><Expand v-else
            /></el-icon>
          </div>
          <div class="header-center">
            <span class="system-title">智慧营销广告资产管理子系统</span>
          </div>
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                Admin <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主内容 -->
        <el-main class="layout-main">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Picture, Box, Fold, Expand } from '@element-plus/icons-vue'
import { logout } from '@/utils/auth'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)

const handleLogout = () => {
  logout()
  ElMessage.success('已退出登录')
  router.replace({ name: 'Login' })
}

// --- 响应式状态 ---
const MOBILE_WIDTH = 768
const TABLET_WIDTH = 992

const isCollapsed = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

function handleResize() {
  const width = window.innerWidth
  if (width < MOBILE_WIDTH) {
    isMobile.value = true
    isCollapsed.value = false
    drawerVisible.value = false
  } else if (width < TABLET_WIDTH) {
    isMobile.value = false
    isCollapsed.value = true
  } else {
    isMobile.value = false
    isCollapsed.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.full-height {
  height: 100%;
}

/* --- 侧边栏 --- */
.layout-aside {
  background-color: #304156;
  display: flex;
  flex-direction: column;
  transition: width 0.28s ease;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    flex-shrink: 0;
    overflow: hidden;
    padding: 0 10px;
    box-sizing: border-box;

    .logo-image {
      max-height: 40px;
      max-width: 100%;
      object-fit: contain;
    }
  }
}

.el-menu-vertical {
  border-right: none;
  flex: 1;
  overflow-y: auto;

  &:not(.el-menu--collapse) {
    width: 240px;
  }
}

/* --- 抽屉菜单 --- */
.drawer-menu-wrapper {
  height: 100%;
  background-color: #304156;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    padding: 0 10px;
    box-sizing: border-box;

    .logo-image {
      max-height: 40px;
      max-width: 100%;
      object-fit: contain;
    }
  }

  .el-menu-vertical {
    border-right: none;
  }
}

/* --- 右侧 --- */
.right-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-center {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.hamburger {
  font-size: 22px;
  cursor: pointer;
  color: #5a5e66;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}

.layout-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* --- 页面切换动画 --- */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* --- 移动端微调 --- */
@media (max-width: 768px) {
  .layout-main {
    padding: 12px;
  }
}
</style>
