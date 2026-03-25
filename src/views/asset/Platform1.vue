<template>
  <div class="platform1-container">
    <div class="page-header">
      <h2>第三方平台1对接</h2>
    </div>
    
    <div class="main-content">
      <el-tabs v-model="activeName" class="platform-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="定向包" name="targeting">
          <Targeting v-if="activeName === 'targeting'" />
        </el-tab-pane>
        <el-tab-pane label="标题库" name="title">
          <TitleLib v-if="activeName === 'title'" />
        </el-tab-pane>
        <el-tab-pane label="落地页" name="landing-page">
          <LandingPage v-if="activeName === 'landing-page'" />
        </el-tab-pane>
        <el-tab-pane label="关键词库" name="keyword">
          <Keyword v-if="activeName === 'keyword'" />
        </el-tab-pane>
        <el-tab-pane label="组件库" name="component">
          <ComponentLib v-if="activeName === 'component'" />
        </el-tab-pane>
        <el-tab-pane label="商品库" name="product">
          <ProductLib v-if="activeName === 'product'" />
        </el-tab-pane>
        <el-tab-pane label="文本摘要库" name="text-summary">
          <TextSummary v-if="activeName === 'text-summary'" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TabsPaneContext } from 'element-plus';

// Import child components
import Targeting from './platform1/Targeting.vue';
import TitleLib from './platform1/Title.vue';
import LandingPage from './platform1/LandingPage.vue';
import Keyword from './platform1/Keyword.vue';
import ComponentLib from './platform1/Component.vue';
import ProductLib from './platform1/Product.vue';
import TextSummary from './platform1/TextSummary.vue';

const activeName = ref('targeting');

const handleTabClick = (tab: TabsPaneContext) => {
  // Can execute extra logic on tab switch if needed
};
</script>

<style scoped lang="scss">
.platform1-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .page-header {
    margin-bottom: 20px;
    h2 {
      margin: 0;
      font-size: 20px;
      color: var(--el-text-color-primary);
    }
  }

  .main-content {
    flex: 1;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .platform-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;
        padding: 16px 0 0 0;
        
        .el-tab-pane {
          height: 100%;
        }
      }
    }
  }
}
</style>

