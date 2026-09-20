import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import { LandingPage } from './pages/LandingPage'
import { StorePage } from './pages/StorePage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { LoginPage } from './pages/LoginPage'
import { PublicTagRedirectPage } from './pages/PublicTagRedirectPage'
import { PrintStandPage } from './pages/PrintStandPage'

import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { CustomerOverviewPage } from './pages/dashboard/CustomerOverviewPage'
import { CustomerTagsPage } from './pages/dashboard/CustomerTagsPage'
import { CustomerTagEditPage } from './pages/dashboard/CustomerTagEditPage'
import { CustomerBusinessesPage } from './pages/dashboard/CustomerBusinessesPage'
import { CustomerOrdersPage } from './pages/dashboard/CustomerOrdersPage'
import { CustomerPlansPage } from './pages/dashboard/CustomerPlansPage'

import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminClientsPage } from './pages/admin/AdminClientsPage'
import { AdminTagsPage } from './pages/admin/AdminTagsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminLogsPage } from './pages/admin/AdminLogsPage'

const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth()
  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/loja" element={<StorePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/t/:publicId" element={<PublicTagRedirectPage />} />
            <Route path="/print-stand/:tagId" element={<PrintStandPage />} />

            <Route
              path="/dashboard"
              element={
                <CustomerRoute>
                  <DashboardLayout />
                </CustomerRoute>
              }
            >
              <Route index element={<CustomerOverviewPage />} />
              <Route path="tags" element={<CustomerTagsPage />} />
              <Route path="tags/:id" element={<CustomerTagEditPage />} />
              <Route path="businesses" element={<CustomerBusinessesPage />} />
              <Route path="orders" element={<CustomerOrdersPage />} />
              <Route path="plans" element={<CustomerPlansPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="clients" element={<AdminClientsPage />} />
              <Route path="tags" element={<AdminTagsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="logs" element={<AdminLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

