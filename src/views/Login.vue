<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>智慧营销广告资产管理子系统</h3>
        </div>
      </template>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="账号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            class="login-button"
            size="large"
            :loading="loading"
            >登 录</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login as setLoggedIn } from '@/utils/auth'

const router = useRouter()

const form = reactive({
  username: 'admin',
  password: 'Admin123',
})

const loading = ref(false)

const handleLogin = () => {
  loading.value = true
  setTimeout(() => {
    if (form.username === 'admin' && form.password === 'Admin123') {
      setLoggedIn()
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
    }
    loading.value = false
  }, 500)
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;

  .card-header {
    text-align: center;
    h3 {
      margin: 0;
      font-size: 20px;
    }
  }

  .login-button {
    width: 100%;
  }
}
</style>
