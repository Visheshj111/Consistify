import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGoalStore } from '../store/goalStore'
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Target, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Info,
  ChevronDown
} from 'lucide-react'

export default function SkillsPage() {
  const navigate = useNavigate()
  const { goals, activeGoal, fetchGoals, setActiveGoal, deleteGoal, isLoading } = useGoalStore()
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSwitching, setIsSwitching] = useState(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const extractMainGoal = (title) => {
    // Extract the main goal from sentences like "I want to lose Body Fat" -> "Lose Body Fat"
    const match = title.match(/(?:i want to|i'm|i am|to|learn|build|complete)\s+(.+)/i)
    if (match) {
      return match[1].trim().replace(/^to\s+/i, '').trim()
    }
    return title
  }

  const toggleDescription = (goalId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }))
  }

  const handleSetActive = async (goalId) => {
    if (isSwitching) return
    setIsSwitching(goalId)
    try {
      await setActiveGoal(goalId)
    } catch (error) {
      console.error('Failed to switch goal:', error)
    } finally {
      setIsSwitching(null)
    }
  }

  const handleDelete = async (goalId) => {
    setIsDeleting(true)
    try {
      await deleteGoal(goalId)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete goal:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner-lg text-gray-400 dark:text-gray-500" />
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">My Skills</h1>
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-72 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg z-10">
                <p>You can have multiple skill journeys at once. Switch between them anytime - your progress is saved! The active skill is what appears on your dashboard.</p>
                <div className="absolute left-4 bottom-full w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45 -mb-1"></div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Manage your learning journeys</p>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="calm-button-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Skill
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="calm-card text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-gray-500 dark:text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
            No skills yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start your first learning journey. Pick a skill you've always wanted to learn!
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="calm-button-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start Your First Skill
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const isActive = activeGoal?._id === goal._id || activeGoal?.id === goal._id
            const completedDays = goal.completedDays || 0
            const totalDays = goal.totalDays || 30
            const progress = Math.round((completedDays / totalDays) * 100)

            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`calm-card relative overflow-hidden ${
                  isActive ? 'ring-2 ring-gray-400 dark:ring-gray-500 bg-gray-50/30 dark:bg-gray-800/30' : ''
                }`}
              >
                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-black dark:bg-white text-white dark:text-black text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Active
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 pr-16">
                      {extractMainGoal(goal.title)}
                    </h3>
                    
                    {/* Expandable Description */}
                    {goal.description && (
                      <div className="mb-3">
                        <button
                          onClick={() => toggleDescription(goal._id)}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-1"
                        >
                          <ChevronDown 
                            className={`w-3 h-3 transition-transform ${expandedDescriptions[goal._id] ? 'rotate-180' : ''}`}
                          />
                          Details
                        </button>
                        {expandedDescriptions[goal._id] && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-gray-600 dark:text-gray-400 pt-1"
                          >
                            {goal.description}
                          </motion.p>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Day {completedDays + 1} of {totalDays}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{goal.dailyMinutes} min/day</span>
                      </div>
                      {goal.isCompleted && (
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed!</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          isActive 
                            ? 'bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isActive && !goal.isCompleted && (
                        <button
                          onClick={() => handleSetActive(goal._id)}
                          disabled={isSwitching === goal._id}
                          className="calm-button-primary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          {isSwitching === goal._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Switch to this
                        </button>
                      )}
                      
                      {isActive && (
                        <button
                          onClick={() => navigate('/')}
                          className="calm-button-primary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          <ChevronRight className="w-4 h-4" />
                          Go to Dashboard
                        </button>
                      )}

                      <button
                        onClick={() => navigate('/roadmap')}
                        className="calm-button-secondary text-sm py-2 px-4"
                      >
                        View Roadmap
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(goal._id)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-auto"
                        title="Delete skill"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Delete this skill?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This will permanently delete this skill journey and all your progress. 
                Your completed tasks and roadmap will be lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 calm-button-secondary"
                  disabled={isDeleting}
                >
                  Keep it
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 calm-button bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
