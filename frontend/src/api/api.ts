import axios from "axios"
import { environment } from "../environments/environment.local"

const instance = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: 5000
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use((response) => response, (error) => {
  const isLoginRequest = error.config?.url?.includes("/auth/login")
  if (error.response?.status === 401 && !isLoginRequest) {
    localStorage.removeItem('token')
    return window.location.href = "/login"
  }
  return Promise.reject(error)
})

export default instance