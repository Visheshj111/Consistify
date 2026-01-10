import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, Heart, Loader2, UserPlus, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import UserProfileModal from '../components/UserProfileModal'

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activitiesRes, statsRes, profileRes, friendsRes] = await Promise.all([
        api.get('/activity/feed'),
        api.get('/activity/stats'),
        api.get('/users/profile'),
        api.get('/users/friends')
      ])
      setActivities(activitiesRes.data)
      setStats(statsRes.data)
      setFriendRequests(profileRes.data.friendRequests || [])
      setFriends(friendsRes.data)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptFriend = async (fromUserId) => {
    try {
      await api.post(`/users/accept-friend/${fromUserId}`)
      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Failed to accept friend:', error)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-sage-400" />
      case 'started':
        return <div className="w-2 h-2 rounded-full bg-sky-400" />
      case 'milestone':
        return <div className="w-2 h-2 rounded-full bg-warmth-400" />
      default:
        return <div className="w-2 h-2 rounded-full bg-calm-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-calm-400 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-calm-800 mb-2">Community</h1>
        <p className="text-calm-500">See how others are showing up for their goals</p>
      </div>

      {/* Stats - Neutral and encouraging */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="calm-card text-center">
            <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-sage-500" />
            </div>
            <p className="text-2xl font-bold text-calm-800">{stats.usersCompletedToday}</p>
            <p className="text-sm text-calm-500">showed up today</p>
          </div>
          
          <div className="calm-card text-center">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-sky-500" />
            </div>
            <p className="text-2xl font-bold text-calm-800">{stats.usersActiveToday}</p>
            <p className="text-sm text-calm-500">active today</p>
          </div>
          
          <div className="calm-card text-center">
            <div className="w-12 h-12 rounded-full bg-warmth-100 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-warmth-500" />
            </div>
            <p className="text-2xl font-bold text-calm-800">{stats.communitySize}</p>
            <p className="text-sm text-calm-500">in our community</p>
          </div>
        </div>
      )}

      {/* Community message */}
      {stats && (
        <div className="calm-card bg-gradient-to-r from-sky-50/50 to-sage-50/50 border-0">
          <p className="text-center text-calm-600">
            {stats.message}
          </p>
        </div>
      )}

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="calm-card border-sage-200">
          <h2 className="font-semibold text-calm-700 mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sage-500" />
            Friend Requests
          </h2>
          <div className="space-y-2">
            {friendRequests.map((request) => (
              <div key={request.from} className="flex items-center justify-between py-2">
                <button
                  onClick={() => setSelectedUserId(request.from)}
                  className="flex items-center gap-2 text-calm-700 hover:text-calm-900"
                >
                  <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-sage-600">?</span>
                  </div>
                  <span>Someone wants to be friends</span>
                </button>
                <button
                  onClick={() => handleAcceptFriend(request.from)}
                  className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm hover:bg-sage-200 transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends */}
      {friends.length > 0 && (
        <div className="calm-card">
          <h2 className="font-semibold text-calm-700 mb-3">Your Friends</h2>
          <div className="space-y-3">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedUserId(friend.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-calm-50 hover:bg-calm-100 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-300 to-sky-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {friend.picture ? (
                    <img src={friend.picture} alt={friend.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{friend.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-calm-700 truncate">{friend.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-calm-200 text-calm-600 rounded-full">{friend.progressPercent}%</span>
                  </div>
                  {friend.currentSkill ? (
                    <p className="text-sm text-calm-500 truncate mt-0.5">
                      {friend.currentSkill} {friend.currentDay && <span className="text-calm-400">• Day {friend.currentDay}</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-calm-400 mt-0.5">No active skill</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-calm-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4">Recent Activity</h2>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-calm-400">No activity yet. Be the first to show up today!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-calm-50 transition-colors border-b border-calm-100 last:border-0"
              >
                {/* Clickable Avatar */}
                <button
                  onClick={() => setSelectedUserId(activity.userId?._id)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-200 to-sky-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-sage-300 transition-all"
                >
                  {activity.userId?.picture ? (
                    <img src={activity.userId.picture} alt={activity.userId.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-calm-600">
                      {activity.userId?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  {/* User name clickable */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUserId(activity.userId?._id)}
                      className="font-medium text-calm-800 hover:text-sage-600 transition-colors"
                    >
                      {activity.userId?.name}
                    </button>
                    {activity.skillName && (
                      <span className="px-2 py-0.5 bg-sage-100 text-sage-600 rounded-full text-xs">
                        {activity.skillName}
                      </span>
                    )}
                  </div>
                  
                  {/* Task details */}
                  {activity.taskTitle && (
                    <p className="text-calm-600 text-sm mt-0.5">
                      Completed: <span className="text-calm-700">{activity.taskTitle}</span>
                    </p>
                  )}
                  
                  {/* Progress bar */}
                  {activity.progressPercent !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-calm-100 rounded-full h-1.5 max-w-[120px]">
                        <div
                          className="bg-gradient-to-r from-sage-400 to-sky-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${activity.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-calm-400">{activity.progressPercent}%</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-calm-400 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-calm-300 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Encouraging footer */}
      <div className="text-center py-4">
        <p className="text-calm-400 text-sm">
          We're all on our own journey. Celebrate every small step. 🌱
        </p>
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </motion.div>
  )
}
