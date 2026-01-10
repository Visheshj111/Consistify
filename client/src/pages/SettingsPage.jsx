import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { 
  Bell, 
  Users, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Info,
  X
} from 'lucide-react'
import api from '../utils/api'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [settings, setSettings] = useState({
    showInActivityFeed: user?.showInActivityFeed ?? true,
    reminderEnabled: user?.reminderEnabled ?? true,
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.patch('/users/settings', settings)
      updateUser(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-calm-800 mb-2">Settings</h1>
        <p className="text-calm-500">Customize your experience</p>
      </div>

      {/* Profile Card */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Profile
        </h2>
        
        <div className="flex items-center gap-4">
          {user?.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-calm-800">{user?.name}</p>
            <p className="text-sm text-calm-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Privacy
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-calm-100">
            <div className="flex items-start gap-3">
              {settings.showInActivityFeed ? (
                <Eye className="w-5 h-5 text-calm-400 mt-0.5" />
              ) : (
                <EyeOff className="w-5 h-5 text-calm-400 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-calm-700">Show in Activity Feed</p>
                  <button
                    onClick={() => setShowPrivacyNote(!showPrivacyNote)}
                    className="p-1 rounded-full hover:bg-calm-100 transition-colors"
                    aria-label="More info"
                  >
                    <Info className="w-4 h-4 text-calm-400" />
                  </button>
                </div>
                <p className="text-sm text-calm-500">
                  Your task name and completion % will be shared with the community. You can opt out anytime.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('showInActivityFeed')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showInActivityFeed ? 'bg-sky-400' : 'bg-calm-200'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  settings.showInActivityFeed ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {showPrivacyNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-calm-50 rounded-xl relative"
              >
                <button
                  onClick={() => setShowPrivacyNote(false)}
                  className="absolute top-2 right-2 p-1 text-calm-400 hover:text-calm-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-calm-600 pr-6">
                  <strong>Privacy Note:</strong> We never share your personal information or email. 
                  Only your name, current task title, and progress percentage are visible to friends and community members.
                  You can disable this at any time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Reminders
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-calm-400 mt-0.5" />
              <div>
                <p className="font-medium text-calm-700">Daily Reminder at 9 PM</p>
                <p className="text-sm text-calm-500">
                  A gentle nudge to check in on your daily task
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('reminderEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.reminderEnabled ? 'bg-sky-400' : 'bg-calm-200'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  settings.reminderEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Timezone
        </h2>
        
        <select
          value={settings.timezone}
          onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="calm-input"
        >
          {Intl.supportedValuesOf('timeZone').map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="calm-button-primary flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* About Section */}
      <div className="calm-card bg-gradient-to-r from-sky-50/50 to-sage-50/50 border-0">
        <h2 className="font-semibold text-calm-700 mb-3">About Flow Goals</h2>
        <p className="text-sm text-calm-600 mb-4">
          Flow Goals is designed to help you achieve your goals without anxiety or pressure. 
          We believe in calm consistency over rushed urgency.
        </p>
        <div className="text-sm text-calm-500 space-y-1">
          <p>✓ No streaks or streak-breaking anxiety</p>
          <p>✓ No guilt when you skip a day</p>
          <p>✓ No pressure language or shaming</p>
          <p>✓ Just gentle, consistent progress</p>
        </div>
      </div>
    </motion.div>
  )
}
