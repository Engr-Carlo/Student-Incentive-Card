import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './root/App'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ScanVerify from './pages/ScanVerify'
import CreatePackage from './pages/CreatePackage'
import IssueIncentiveCard from './pages/IssueIncentiveCard'
import { Login } from './pages/Login'
import { ManageAdmins } from './pages/ManageAdmins'
import { ViewData } from './pages/ViewData'
import { adminStore } from './lib/api'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!adminStore.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Super admin only route
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  if (!adminStore.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  if (!adminStore.isSuperAdmin()) {
    return <Navigate to="/admin" replace />
  }
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><App /></ProtectedRoute>}> 
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<ScanVerify />} />
          <Route path="issue" element={<IssueIncentiveCard />} />
          <Route path="view-data" element={<ViewData />} />
          <Route path="package" element={<SuperAdminRoute><CreatePackage /></SuperAdminRoute>} />
          <Route path="manage-admins" element={<SuperAdminRoute><ManageAdmins /></SuperAdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
