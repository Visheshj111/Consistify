import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Home, Users, Settings, LogOut, Leaf, Map, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: Home, label: 'Today' },
    { to: '/skills', icon: BookOpen, label: 'My Skills' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/activity', icon: Users, label: 'Community' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-calm-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-400 to-sage-400 flex items-center justify-center"
            >
              <Leaf className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className="text-xl font-semibold text-calm-800">Flow Goals</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-calm-600 hidden sm:inline">{user?.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-calm-400 hover:text-calm-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/40 border-b border-calm-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive 
                      ? 'text-sky-600' 
                      : 'text-calm-500 hover:text-calm-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-calm-400 text-sm">
        <p>Take it one day at a time. You're doing great. 🌿</p>
      </footer>
    </div>
  )
}
