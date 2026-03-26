<template>
  <div class="page-container">
    <div class="iframe-header">
      <h2>图片快速生产</h2>
    </div>
    <div class="workbench">
      <aside class="menu-panel">
        <button
          v-for="item in menus"
          :key="item.key"
          type="button"
          class="menu-item"
          :class="{ active: activeMenu === item.key }"
          @click="activeMenu = item.key"
        >
          {{ item.label }}
        </button>
      </aside>
      <div class="iframe-wrapper">
        <iframe :src="iframeSrc" frameborder="0" width="100%" height="100%" allowfullscreen title="图片快速生产"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type MenuKey = 'none_keys' | 'get_keys' | 'image_shows' | 'text2icon'

const baseUrl = 'https://fuyou.zhonglian.com'
const menus: Array<{ key: MenuKey; label: string; path: string }> = [
  { key: 'none_keys', label: 'none keys', path: '/none_keys' },
  { key: 'get_keys', label: 'get keys', path: '/get_keys' },
  { key: 'image_shows', label: 'image shows', path: '/image_shows' },
  { key: 'text2icon', label: 'text2icon', path: '/text2icon' }
]

const activeMenu = ref<MenuKey>('text2icon')
const iframeSrc = computed(() => {
  const current = menus.find((item) => item.key === activeMenu.value)
  return `${baseUrl}${current?.path || '/none_keys'}`
})
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  padding: 16px;
  background-color: #f0f2f5;
  box-sizing: border-box;

  .iframe-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .workbench {
    display: flex;
    align-items: stretch;
    gap: 12px;
    flex: 1;
    min-height: 0;
  }

  .menu-panel {
    width: 150px;
    background: linear-gradient(180deg, #001529 0%, #09203a 100%);
    border-radius: 8px;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .menu-item {
    border: none;
    height: 36px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    color: #bfcbd9;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    padding: 0 12px;
  }

  .menu-item:hover {
    color: #fff;
    background: rgba(22, 119, 255, 0.45);
  }

  .menu-item.active {
    color: #fff;
    background: #1677ff;
  }

  .iframe-wrapper {
    flex: 1;
    min-width: 0;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    iframe {
      display: block;
      border: none;
    }
  }
}

@media (max-width: 900px) {
  .page-container {
    .workbench {
      flex-direction: column;
    }

    .menu-panel {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .menu-item {
      width: calc(50% - 4px);
    }
  }
}
</style>
