import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// ── Axios instance configured to call Spring Boot backend ──────────────────
const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000, // 20s — Gemini API can take up to 15s
})

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 (auto-logout) ────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const { refreshToken, logout } = useAuthStore.getState()
            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/refresh', { refreshToken })
                    useAuthStore.getState().setTokens(res.data.accessToken, res.data.refreshToken)
                    originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`
                    return api(originalRequest)
                } catch {
                    logout()
                    toast.error('Session expired. Please log in again.')
                }
            } else {
                logout()
            }
        }
        return Promise.reject(error)
    }
)

// ── API Service Methods ────────────────────────────────────────────────────

// Auth
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    refresh: (data) => api.post('/auth/refresh', data),
}

// User
export const userApi = {
    getMe: () => api.get('/users/me'),
    updateMe: (data) => api.put('/users/me', data),
    changePassword: (data) => api.post('/users/me/change-password', data),
    uploadAvatar: (formData) => api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// Tasks
export const taskApi = {
    getAll: (wsId) => api.get('/tasks', { params: { workspaceId: wsId } }),
    getById: (id) => api.get(`/tasks/${id}`),
    getByStatus: (status) => api.get(`/tasks/status/${status}`),
    getByCategory: (cat) => api.get(`/tasks/category/${cat}`),
    getUpcoming: (hours = 48) => api.get(`/tasks/upcoming?hours=${hours}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
}

// Task Categories (3NF)
export const categoryApi = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    delete: (id) => api.delete(`/categories/${id}`),
}

// Timetables
export const timetableApi = {
    getAll: (wsId) => api.get('/timetables', { params: { workspaceId: wsId } }),
    getById: (id) => api.get(`/timetables/${id}`),
    create: (data) => api.post('/timetables', data),
    update: (id, data) => api.put(`/timetables/${id}`, data),
    delete: (id) => api.delete(`/timetables/${id}`),
    toggleShare: (id, isPublic) => api.post(`/timetables/${id}/share?isPublic=${isPublic}`),
    getShared: (token) => api.get(`/timetables/shared/${token}`),
}

// Schedule Entries
export const scheduleApi = {
    getEntries: (tId) => api.get(`/timetables/${tId}/entries`),
    addEntry: (tId, data) => api.post(`/timetables/${tId}/entries`, data),
    updateEntry: (tId, eId, d) => api.put(`/timetables/${tId}/entries/${eId}`, d),
    deleteEntry: (tId, eId) => api.delete(`/timetables/${tId}/entries/${eId}`),
}

// Notifications
export const notificationApi = {
    getAll: () => api.get('/notifications'),
    getUnread: () => api.get('/notifications/unread'),
    getUnreadCount: () => api.get('/notifications/unread/count'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
}

// AI
export const aiApi = {
    generateSchedule: () => api.get('/ai/schedule'),
    prioritizeTasks: () => api.get('/ai/prioritize'),
    getInsights: () => api.get('/ai/insights'),
    parseNlp: (text) => api.post('/ai/parse', { text }),
    decomposeTask: (title) => api.post('/ai/decompose', { title }),
    chat: (message) => api.post('/ai/chat', { message }),
    chatNlp: (message) => api.post('/ai/chat-nlp', { message }),  // unified smart chat
    getHistory: () => api.get('/ai/history'),
    getStatus: () => api.get('/ai/status'),
    feedback: (query, correctIntent) => api.post('/ai/feedback', { query, correctIntent }),
}

// Analytics
export const analyticsApi = {
    getScore: () => api.get('/analytics/score'),
    getCategories: () => api.get('/analytics/categories'),
    getWeekly: () => api.get('/analytics/weekly'),
    getPomodoro: () => api.get('/analytics/pomodoro'),
    getReport: () => api.get('/analytics/report'),
    getPdfReport: () => api.get('/reports/tasks/pdf', { responseType: 'blob' }),
}

// Pomodoro
export const pomodoroApi = {
    getAll: () => api.get('/pomodoro'),
    getConfig: () => api.get('/pomodoro/config'),
    start: (taskId, type = 'WORK') => api.post('/pomodoro/start', { taskId, type }),
    complete: (id) => api.post(`/pomodoro/${id}/complete`),
}

// Workspaces
export const workspaceApi = {
    getAll: () => api.get('/workspaces'),
    create: (data) => api.post('/workspaces', data),
    delete: (id) => api.delete(`/workspaces/${id}`),
}

export default api
