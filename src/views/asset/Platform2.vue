<template>
  <div class="platform2-container">
    <div class="page-header">
      <h2>第三方平台2对接</h2>
    </div>
    
    <div class="main-content">
      <el-tabs v-model="activeName" class="platform-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="行业产品" name="industry-product">
          <IndustryProduct v-if="activeName === 'industry-product'" />
        </el-tab-pane>
        <el-tab-pane label="品牌形象" name="brand-image">
          <BrandImage v-if="activeName === 'brand-image'" />
        </el-tab-pane>
        <el-tab-pane label="头像/昵称跳转页" name="avatar-jump">
          <AvatarJumpPage v-if="activeName === 'avatar-jump'" />
        </el-tab-pane>
        <el-tab-pane label="文案包" name="copywriting">
          <Copywriting v-if="activeName === 'copywriting'" />
        </el-tab-pane>
        <el-tab-pane label="落地页" name="landing-page">
          <LandingPage v-if="activeName === 'landing-page'" />
        </el-tab-pane>
        <el-tab-pane label="定向模板" name="targeting-template">
          <TargetingTemplate v-if="activeName === 'targeting-template'" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TabsPaneContext } from 'element-plus';

// Import child components
import IndustryProduct from './platform2/IndustryProduct.vue';
import BrandImage from './platform2/BrandImage.vue';
import AvatarJumpPage from './platform2/AvatarJumpPage.vue';
import Copywriting from './platform2/Copywriting.vue';
import LandingPage from './platform2/LandingPage.vue';
import TargetingTemplate from './platform2/TargetingTemplate.vue';

const activeName = ref('industry-product');

const handleTabClick = (tab: TabsPaneContext) => {
  // Can execute extra logic on tab switch if needed
};
</script>

<style scoped lang="scss">
.platform2-container {
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

