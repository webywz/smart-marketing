import { ref } from 'vue'

export const isAuthenticated = ref(false)

export function login() {
  isAuthenticated.value = true
  // For simplicity, we don't use real tokens. In a real app, you'd save a token here.
  sessionStorage.setItem('auth_token', 'dummy_token')
}

export function logout() {
  isAuthenticated.value = false
  sessionStorage.removeItem('auth_token')
}

// Check token on initial load
if (sessionStorage.getItem('auth_token')) {
  isAuthenticated.value = true
}
