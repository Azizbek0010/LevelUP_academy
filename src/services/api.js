import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export const mentorTestsService = {
  createTest: (groupId, payload) => api.post(`/api/mentor/tests/groups/${groupId}`, payload),
  listTests: (groupId) => api.get(`/api/mentor/tests/groups/${groupId}`),
  getResults: (testId) => api.get(`/api/mentor/tests/${testId}/results`),
}

export const mentorSalaryService = {
  getSalary: (mentorId, year) => api.get(`/api/mentor/salary/mentors/${mentorId}`, { params: { year } }),
  getSuggestion: (mentorId, month) => api.get(`/api/mentor/salary/mentors/${mentorId}/suggestion`, { params: { month } }),
}

export const chatService = {
  getMessages: (roomKey) => api.get(`/api/chat/${roomKey}/messages`),
}

export default api
