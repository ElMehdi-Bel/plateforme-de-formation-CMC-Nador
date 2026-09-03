import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Le même bouton (hamburger) sert aux deux breakpoints, mais pas au même
  // état : sur desktop il replie/déplie la sidebar, sur mobile il ouvre/ferme
  // le tiroir. `collapsed` doit rester intact quand on est en mobile — sinon
  // le tiroir s'ouvrirait en mode "icônes seules" au lieu du contenu complet.
  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(o => !o)
    } else {
      setCollapsed(c => !c)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ml-0 ${collapsed ? 'md:ml-[70px]' : 'md:ml-[260px]'}`}>
        <Header onToggleSidebar={toggleSidebar} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
