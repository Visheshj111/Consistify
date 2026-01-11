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
        return <div className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-400" />
      case 'started':
        return <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400" />
      case 'milestone':
        return <div className="w-2 h-2 rounded-full bg-gray-700 dark:bg-gray-300" />
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-6"
    >
      {/* Main Content - Left Column */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Community</h1>
          <p className="text-gray-500 dark:text-gray-400">See how others are showing up for their goals</p>
        </div>

        {/* Stats - Neutral and encouraging */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="calm-card text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.usersCompletedToday}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">showed up today</p>
            </div>
            
            <div className="calm-card text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.usersActiveToday}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">active today</p>
            </div>
            
            <div className="calm-card text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.communitySize}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">in our community</p>
            </div>
          </div>
        )}

        {/* Community message */}
        {stats && (
          <div className="calm-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0">
            <p className="text-center text-gray-600 dark:text-gray-400">
              {stats.message}
            </p>
          </div>
        )}

        {/* Friend Requests - Mobile only */}
        {friendRequests.length > 0 && (
          <div className="lg:hidden calm-card border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Friend Requests
            </h2>
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <div key={request.from} className="flex items-center justify-between py-2">
                  <button
                    onClick={() => setSelectedUserId(request.from)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center overflow-hidden">
                      {request.picture ? (
                        <img src={request.picture} alt={request.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{request.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <span className="font-medium">{request.name || 'Someone'}</span>
                  </button>
                  <button
                    onClick={() => handleAcceptFriend(request.from)}
                    className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends - Mobile only */}
        {friends.length > 0 && (
          <div className="lg:hidden calm-card">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Your Friends</h2>
            <div className="space-y-3">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedUserId(friend.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {friend.picture ? (
                      <img src={friend.picture} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">{friend.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{friend.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">{friend.progressPercent}%</span>
                    </div>
                    {friend.currentSkill ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {friend.currentSkill} {friend.currentDay && <span className="text-gray-400 dark:text-gray-500">• Day {friend.currentDay}</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">No active skill</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="calm-card">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Activity</h2>
          
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500">No activity yet. Be the first to show up today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  {/* Clickable Avatar */}
                  <button
                    onClick={() => setSelectedUserId(activity.userId?._id)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 transition-all"
                  >
                    {activity.userId?.picture ? (
                      <img src={activity.userId.picture} alt={activity.userId.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {activity.userId?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    {/* User name clickable */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(activity.userId?._id)}
                        className="font-medium text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
                      >
                        {activity.userId?.name}
                      </button>
                      {activity.skillName && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          {activity.skillName}
                        </span>
                      )}
                    </div>
                    
                    {/* Task details */}
                    {activity.taskTitle && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                        Completed: <span className="text-gray-700 dark:text-gray-300">{activity.taskTitle}</span>
                      </p>
                    )}
                    
                    {/* Progress bar */}
                    {activity.progressPercent !== undefined && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 max-w-[120px]">
                          <div
                            className="bg-gradient-to-r from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-200 h-1.5 rounded-full transition-all"
                            style={{ width: `${activity.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{activity.progressPercent}%</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Encouraging footer */}
        <div className="text-center py-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            We're all on our own journey. Celebrate every small step.
          </p>
        </div>
      </div>

      {/* Right Sidebar - Friends (Desktop only) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-24 space-y-4">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="calm-card"
            >
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Friend Requests
              </h3>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.from} className="flex items-center justify-between py-2">
                    <button
                      onClick={() => setSelectedUserId(request.from)}
                      className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center overflow-hidden">
                        {request.picture ? (
                          <img src={request.picture} alt={request.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{request.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[100px]">{request.name || 'Someone'}</span>
                    </button>
                    <button
                      onClick={() => handleAcceptFriend(request.from)}
                      className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Friends List */}
          {friends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="calm-card"
            >
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Your Friends
              </h3>
              <div className="space-y-3">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedUserId(friend.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {friend.picture ? (
                        <img src={friend.picture} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{friend.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-700 dark:text-gray-200 truncate text-sm">{friend.name}</p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{friend.progressPercent}%</span>
                      </div>
                      {friend.currentSkill ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {friend.currentSkill} {friend.currentDay && <span className="text-gray-400 dark:text-gray-500">• Day {friend.currentDay}</span>}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">No active skill</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* No friends yet */}
          {friends.length === 0 && friendRequests.length === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="calm-card text-center"
            >
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No friends yet. Click on someone in the feed to add them!
              </p>
            </motion.div>
          )}
        </div>
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
