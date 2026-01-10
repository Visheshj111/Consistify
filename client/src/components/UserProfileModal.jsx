import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Check, Clock, Target, Trophy, Loader2 } from 'lucide-react'
import api from '../utils/api'

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/profile/${userId}`)
      setProfile(res.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async () => {
    setActionLoading(true)
    try {
      await api.post(`/users/friend-request/${userId}`)
      setProfile(prev => ({ ...prev, hasPendingRequest: true }))
      setMessage('Friend request sent! 🎉')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send request')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-calm-400 hover:text-calm-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-calm-400 animate-spin" />
            </div>
          ) : profile ? (
            <div className="text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-200 to-sky-200 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {profile.picture ? (
                  <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-calm-600">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="text-xl font-semibold text-calm-800 mb-2">{profile.name}</h2>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-warmth-500" />
                  <span className="text-sm text-calm-600">{profile.progressPercent}% tasks completed</span>
                </div>
                <div className="w-full bg-calm-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-sage-400 to-sky-400 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-calm-400 mt-1">
                  {profile.completedTasks} of {profile.totalTasks} tasks done
                </p>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-calm-600 mb-2 flex items-center justify-center gap-1">
                    <Target className="w-4 h-4" />
                    Learning
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm"
                      >
                        {skill.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Friend action */}
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sage-600 text-sm mb-4"
                >
                  {message}
                </motion.p>
              )}

              {profile.isFriend ? (
                <div className="flex items-center justify-center gap-2 text-sage-600">
                  <Check className="w-5 h-5" />
                  <span>Friends</span>
                </div>
              ) : profile.hasPendingRequest ? (
                <div className="flex items-center justify-center gap-2 text-calm-500">
                  <Clock className="w-5 h-5" />
                  <span>Request pending</span>
                </div>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={actionLoading}
                  className="btn-primary flex items-center justify-center gap-2 w-full"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Add Friend
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-calm-400">User not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
