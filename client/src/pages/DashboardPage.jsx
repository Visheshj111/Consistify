import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoalStore } from '../store/goalStore'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Leaf,
  Sun,
  Moon,
  Coffee,
  ExternalLink,
  BookOpen,
  Play,
  FileText,
  Target,
  Users
} from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'
import UserProfileModal from '../components/UserProfileModal'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { 
    todayTask, 
    activeGoal, 
    fetchTodayTask, 
    completeTask, 
    skipTask,
    updateActionItem,
    isLoading 
  } = useGoalStore()
  
  const [showActionItems, setShowActionItems] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [showWhatToLearn, setShowWhatToLearn] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(null)
  const [friends, setFriends] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)

  useEffect(() => {
    fetchTodayTask()
    fetchFriends()
  }, [fetchTodayTask])

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/friends')
      setFriends(res.data)
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good morning', icon: Coffee }
    if (hour < 17) return { text: 'Good afternoon', icon: Sun }
    if (hour < 21) return { text: 'Good evening', icon: Moon }
    return { text: 'Good night', icon: Moon }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return Play
      case 'docs': return FileText
      case 'tutorial': return BookOpen
      default: return ExternalLink
    }
  }

  const handleComplete = async () => {
    if (!todayTask) return
    setCompleting(true)
    try {
      await completeTask(todayTask._id)
      setShowConfirmation('complete')
      setTimeout(() => setShowConfirmation(null), 3000)
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setCompleting(false)
    }
  }

  const handleSkip = async () => {
    if (!todayTask) return
    setSkipping(true)
    try {
      await skipTask(todayTask._id)
      setShowConfirmation('skip')
      setTimeout(() => setShowConfirmation(null), 3000)
    } catch (error) {
      console.error('Failed to skip task:', error)
    } finally {
      setSkipping(false)
    }
  }

  const handleActionItemToggle = async (index) => {
    if (!todayTask) return
    const currentStatus = todayTask.actionItems[index]?.completed || false
    await updateActionItem(todayTask._id, index, !currentStatus)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-sage-400 opacity-60" />
          <p className="text-calm-500">Loading your day...</p>
        </motion.div>
      </div>
    )
  }

  // No active goal
  if (!activeGoal && !todayTask) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-sage-100 flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-12 h-12 text-sage-400" />
        </div>
        <h2 className="text-2xl font-semibold text-calm-700 mb-3">
          No active skill
        </h2>
        <p className="text-calm-500 mb-8 max-w-md mx-auto">
          Create a skill to receive your daily tasks.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="calm-button-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create skill
        </button>
      </motion.div>
    )
  }

  // Confirmation messages
  if (showConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            showConfirmation === 'complete' 
              ? 'bg-gradient-to-br from-sage-100 to-sky-100' 
              : 'bg-gradient-to-br from-calm-100 to-sky-100'
          }`}
        >
          {showConfirmation === 'complete' ? (
            <Sparkles className="w-12 h-12 text-sage-500" />
          ) : (
            <Leaf className="w-12 h-12 text-sky-400" />
          )}
        </motion.div>
        <h2 className="text-2xl font-semibold text-calm-700 mb-3">
          {showConfirmation === 'complete' 
            ? "Day completed" 
            : "Task skipped"}
        </h2>
        <p className="text-calm-500 max-w-md mx-auto">
          {showConfirmation === 'complete'
            ? "Tomorrow's task will be available at midnight."
            : "Task moved to tomorrow. No schedule adjustment needed."}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Greeting */}
      <div className="flex items-center gap-3 text-calm-600">
        <GreetingIcon className="w-5 h-5" />
        <span>{greeting.text}</span>
        <span className="text-calm-300">•</span>
        <span className="text-calm-400">{format(new Date(), 'EEEE, MMMM d')}</span>
      </div>

      {/* Goal Progress */}
      {activeGoal && (
        <div className="calm-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-calm-500">Your journey</p>
              <h3 className="font-semibold text-calm-800">{activeGoal.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-sky-500">{activeGoal.progress || 0}%</p>
              <p className="text-xs text-calm-400">
                Day {activeGoal.completedDays + 1} of {activeGoal.totalDays}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-calm-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${activeGoal.progress || 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-sky-400 to-sage-400 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Today's Task */}
      {todayTask && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="calm-card"
        >
          {/* Header with Phase */}
          <div className="flex items-start justify-between mb-4">
            <div>
              {todayTask.phase && (
                <p className="text-xs text-sky-400 font-medium mb-1">{todayTask.phase}</p>
              )}
              <p className="text-sm text-sky-500 font-medium mb-1">Today's Focus</p>
              <h2 className="text-xl font-semibold text-calm-800">{todayTask.title}</h2>
            </div>
            <div className="flex items-center gap-1 text-calm-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>{todayTask.estimatedMinutes} min</span>
            </div>
          </div>

          <p className="text-calm-600 mb-4 leading-relaxed">
            {todayTask.description}
          </p>

          {/* Skill Progression - Outcome */}
          {todayTask.skillProgression && (
            <div className="mb-6 p-4 bg-calm-50 rounded-xl border border-calm-100">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-calm-500" />
                <span className="text-sm font-semibold text-calm-700">Outcome</span>
              </div>
              <p className="text-calm-700">{todayTask.skillProgression}</p>
            </div>
          )}

          {/* What to Learn Section */}
          {todayTask.whatToLearn && todayTask.whatToLearn.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowWhatToLearn(!showWhatToLearn)}
                className="flex items-center gap-2 text-sm font-semibold text-calm-700 mb-3 hover:text-calm-800"
              >
                <Target className="w-4 h-4 text-sky-500" />
                What to learn (brief)
                {showWhatToLearn ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showWhatToLearn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-sky-50/50 rounded-xl p-4 space-y-2"
                  >
                    {todayTask.whatToLearn.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                        <span className="text-calm-700">{item}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Resources Section */}
          {todayTask.resources && todayTask.resources.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowResources(!showResources)}
                className="flex items-center gap-2 text-sm font-semibold text-calm-700 mb-3 hover:text-calm-800"
              >
                <BookOpen className="w-4 h-4 text-sage-500" />
                Learn from
                {showResources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showResources && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-sage-50/50 rounded-xl p-4 space-y-3"
                  >
                    {todayTask.resources.map((resource, index) => {
                      const IconComponent = getResourceIcon(resource.type)
                      return (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-sage-100/50 transition-colors group"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            resource.type === 'video' ? 'bg-red-100 text-red-500' :
                            resource.type === 'docs' ? 'bg-blue-100 text-blue-500' :
                            'bg-sage-100 text-sage-500'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-calm-700 font-medium group-hover:text-sky-600 flex items-center gap-1">
                              {resource.type === 'docs' ? 'Docs: ' : resource.type === 'video' ? 'Video: ' : ''}
                              <span className="truncate">{resource.title || resource.url}</span>
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </p>
                            {resource.creator && (
                              <p className="text-xs text-calm-500">({resource.creator})</p>
                            )}
                            <p className="text-xs text-sky-500 truncate">{resource.url}</p>
                          </div>
                        </a>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Items */}
          {todayTask.actionItems && todayTask.actionItems.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowActionItems(!showActionItems)}
                className="flex items-center gap-2 text-sm font-medium text-calm-600 mb-3 hover:text-calm-700"
              >
                {showActionItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Action items ({todayTask.actionItems.filter(i => i.completed).length}/{todayTask.actionItems.length})
              </button>
              
              <AnimatePresence>
                {showActionItems && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {todayTask.actionItems.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleActionItemToggle(index)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          item.completed 
                            ? 'bg-sage-50/50 text-calm-500' 
                            : 'bg-calm-50 text-calm-700 hover:bg-calm-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          item.completed 
                            ? 'border-sage-400 bg-sage-400' 
                            : 'border-calm-300'
                        }`}>
                          {item.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={item.completed ? 'line-through' : ''}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(() => {
              const allItemsCompleted = !todayTask.actionItems || 
                todayTask.actionItems.length === 0 || 
                todayTask.actionItems.every(item => item.completed)
              
              return (
                <button
                  onClick={handleComplete}
                  disabled={completing || skipping || !allItemsCompleted}
                  className={`flex-1 calm-button flex items-center justify-center gap-2 disabled:opacity-50 ${
                    allItemsCompleted 
                      ? 'bg-gradient-to-r from-sage-400 to-sage-500 text-white hover:from-sage-500 hover:to-sage-600' 
                      : 'bg-calm-200 text-calm-400 cursor-not-allowed'
                  }`}
                  title={!allItemsCompleted ? 'Complete all action items first' : ''}
                >
                  {completing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {allItemsCompleted ? 'Completed' : 'Check all items'}
                </button>
              )
            })()}
            <button
              onClick={handleSkip}
              disabled={completing || skipping}
              className="flex-1 calm-button-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {skipping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Not today
            </button>
          </div>

          <p className="text-xs text-calm-400 text-center mt-4">
            Skipped tasks are moved to tomorrow.
          </p>
        </motion.div>
      )}

      {/* Friends Section */}
      {friends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="calm-card"
        >
          <h2 className="font-semibold text-calm-700 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-sage-500" />
            Your Friends
          </h2>
          <div className="space-y-3">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedUserId(friend.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-calm-50 hover:bg-calm-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-300 to-sky-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {friend.picture ? (
                    <img src={friend.picture} alt={friend.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{friend.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-calm-700 truncate">{friend.name}</p>
                    <span className="text-xs text-calm-400">{friend.progressPercent}%</span>
                  </div>
                  {friend.currentSkill ? (
                    <p className="text-sm text-calm-500 truncate">
                      {friend.currentSkill} {friend.currentDay && <span className="text-calm-400">• Day {friend.currentDay}</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-calm-400">No active skill</p>
                  )}
                </div>
                <div className="w-12 h-1.5 bg-calm-200 rounded-full overflow-hidden flex-shrink-0">
                  <div 
                    className="h-full bg-gradient-to-r from-sage-400 to-sky-400 rounded-full"
                    style={{ width: `${friend.progressPercent}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

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
