import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layout/MainLayout.vue'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import { isAuthenticated } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true }, // All children of this route require authentication
      children: [
        {
          path: '',
          redirect: '/material/album',
        },
        {
          path: 'material',
          name: 'MaterialManagement',
          meta: { title: '素材上传及管理' },
          children: [
            {
              path: 'album',
              name: 'Album',
              component: () => import('@/views/material/Album.vue'),
              meta: { title: '素材专辑管理' },
            },
            {
              path: 'list',
              name: 'MaterialList',
              component: () => import('@/views/material/Material.vue'),
              meta: { title: '素材管理' },
            },
            {
              path: 'tag',
              name: 'MaterialTag',
              component: () => import('@/views/material/Tag.vue'),
              meta: { title: '素材标签' },
            },
            {
              path: 'quick-image',
              name: 'QuickImage',
              component: () => import('@/views/material/QuickImage.vue'),
              meta: { title: '图片快速生产' },
            },
          ],
        },
        {
          path: 'asset',
          name: 'AssetManagement',
          meta: { title: '资产管理' },
          children: [
            {
              path: 'product',
              name: 'AssetProduct',
              component: () => import('@/views/asset/Product.vue'),
              meta: { title: '通用产品' },
            },
            {
              path: 'app',
              name: 'AssetApp',
              component: () => import('@/views/asset/App.vue'),
              meta: { title: '通用应用管理' },
            },
            {
              path: 'platform1',
              name: 'Platform1',
              component: () => import('@/views/asset/Platform1.vue'),
              meta: { title: '第三方平台1对接' },
            },
            {
              path: 'platform2',
              name: 'Platform2',
              component: () => import('@/views/asset/Platform2.vue'),
              meta: { title: '第三方平台2对接' },
            },
          ],
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  nprogress.start()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !isAuthenticated.value) {
    // This route requires auth, check if logged in
    // if not, redirect to login page.
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated.value) {
    // If user is logged in and tries to go to login page, redirect to home
    next({ path: '/' })
  } else {
    next() // make sure to always call next()
  }
})

router.afterEach(() => {
  nprogress.done()
})

export default router
