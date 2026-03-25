<template>
  <div class="page-container">
    <div class="iframe-header">
      <h2>图片快速生产</h2>
     
    </div>
    <div class="iframe-wrapper">
      <iframe 
        src="https://fuyou.zhonglian.com/none_keys" 
        frameborder="0" 
        width="100%" 
        height="100%"
        allowfullscreen
        title="图片快速生产"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
// 该页面集成外部工具
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px); // Adjust based on layout
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

  .iframe-wrapper {
    flex: 1;
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
</style>
