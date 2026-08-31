import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar collapsed={collapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-[70px]' : 'ml-[260px]'}`}>
        <Header onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
