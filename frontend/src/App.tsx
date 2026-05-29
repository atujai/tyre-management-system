import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { Toaster } from './components/ui/toast'
import { Sidebar } from './components/layout/sidebar'
import { Topbar } from './components/layout/topbar'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'
import { VehiclesPage } from './pages/vehicles'
import { LocationsPage } from './pages/locations'
import { TyresPage } from './pages/tyres'
import { AllotmentPage } from './pages/allotment'
import { StepneyPage } from './pages/stepney'
import { HistoryPage } from './pages/history'
import { UsersPage } from './pages/users'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/tyres" element={<TyresPage />} />
          <Route path="/allotment" element={<AllotmentPage />} />
          <Route path="/stepney" element={<StepneyPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App