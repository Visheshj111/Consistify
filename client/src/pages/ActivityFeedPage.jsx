import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, Heart, Loader2 } from 'lucide-react'
import api from '../utils/api'

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activitiesRes, statsRes] = await Promise.all([
        api.get('/activity/feed'),
        api.get('/activity/stats')
      ])
      setActivities(activitiesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setIsLoading(false)
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

      {/* Activity Feed */}
      <div className="calm-card">
        <h2 className="font-semibold text-calm-700 mb-4">Recent Activity</h2>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-calm-400">No activity yet. Be the first to show up today!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 py-3 border-b border-calm-100 last:border-0"
              >
                <div className="mt-2">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-calm-700">{activity.message}</p>
                  <p className="text-xs text-calm-400 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
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
    </motion.div>
  )
}
