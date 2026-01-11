import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Check, Clock, Target, Trophy, Loader2, UserMinus } from 'lucide-react'
import api from '../utils/api'

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false)

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
      setMessage('Friend request sent!')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnfriend = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/users/unfriend/${userId}`)
      setProfile(prev => ({ ...prev, isFriend: false }))
      setMessage('Unfriended')
      setShowUnfriendConfirm(false)
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to unfriend')
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner-lg text-gray-400 dark:text-gray-500" />
            </div>
          ) : profile ? (
            <div className="text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {profile.picture ? (
                  <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{profile.name}</h2>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{profile.progressPercent}% tasks completed</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-200 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {profile.completedTasks} of {profile.totalTasks} tasks done
                </p>
              </div>

              {/* Skills with Progress */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center justify-center gap-1">
                    <Target className="w-4 h-4" />
                    Skills
                  </h3>
                  <div className="space-y-3">
                    {profile.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        {/* Progress background - darker portion for completed */}
                        <div 
                          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 transition-all"
                          style={{ width: `${skill.progressPercent || 0}%` }}
                        />
                        {/* Content */}
                        <div className="relative p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                              {skill.title}
                            </span>
                            {skill.isActive && (
                              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                                Active
                              </span>
                            )}
                            {skill.isCompleted && (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {skill.progressPercent || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friend action */}
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-600 dark:text-gray-400 text-sm mb-4"
                >
                  {message}
                </motion.p>
              )}

              {profile.isFriend ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                    <Check className="w-5 h-5" />
                    <span>Friends</span>
                  </div>
                  
                  {!showUnfriendConfirm ? (
                    <button
                      onClick={() => setShowUnfriendConfirm(true)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      Unfriend
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleUnfriend}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4" />
                            Confirm
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowUnfriendConfirm(false)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : profile.hasPendingRequest ? (
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-5 h-5" />
                  <span>Request pending</span>
                </div>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={actionLoading}
                  className="calm-button-primary flex items-center justify-center gap-2 w-full"
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
              <p className="text-gray-400 dark:text-gray-500">User not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
