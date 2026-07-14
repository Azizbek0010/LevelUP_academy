import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import TestsPage from '../pages/TestsPage'
import SalaryPage from '../pages/SalaryPage'
import ChatPage from '../pages/ChatPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/mentor/tests" replace /> },
      { path: 'mentor/tests', element: <TestsPage /> },
      { path: 'mentor/salary', element: <SalaryPage /> },
      { path: 'mentor/chat', element: <ChatPage /> },
    ],
  },
])

export default router
