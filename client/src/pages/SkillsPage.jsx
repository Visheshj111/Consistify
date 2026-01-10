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
  BookOpen
} from 'lucide-react'

export default function SkillsPage() {
  const navigate = useNavigate()
  const { goals, activeGoal, fetchGoals, setActiveGoal, deleteGoal, isLoading } = useGoalStore()
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSwitching, setIsSwitching] = useState(null)

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

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

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'skill': return '🎯'
      case 'habit': return '🔄'
      case 'project': return '📦'
      case 'learning': return '📚'
      default: return '✨'
    }
  }

  if (isLoading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-breathe">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-sage-400 opacity-60" />
        </div>
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
          <h1 className="text-2xl font-semibold text-calm-800 mb-2">My Skills</h1>
          <p className="text-calm-500">Manage your learning journeys</p>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="calm-button-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Skill
        </button>
      </div>

      {/* Info banner */}
      <div className="calm-card bg-sky-50/50 border-sky-100">
        <p className="text-sm text-sky-700">
          You can have multiple skill journeys at once. Switch between them anytime - 
          your progress is saved! The active skill is what appears on your dashboard. 🎯
        </p>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="calm-card text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-sage-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-sage-400" />
          </div>
          <h2 className="text-xl font-semibold text-calm-700 mb-3">
            No skills yet
          </h2>
          <p className="text-calm-500 mb-6 max-w-md mx-auto">
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
                  isActive ? 'ring-2 ring-sky-300 bg-sky-50/30' : ''
                }`}
              >
                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-sky-400 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Active
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl">{getGoalTypeIcon(goal.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-calm-800 mb-1 pr-16">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-calm-500 mb-3 line-clamp-2">{goal.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-calm-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Day {completedDays + 1} of {totalDays}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{goal.dailyMinutes} min/day</span>
                      </div>
                      {goal.isCompleted && (
                        <div className="flex items-center gap-1 text-sage-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed!</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-calm-100 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          isActive 
                            ? 'bg-gradient-to-r from-sky-400 to-sage-400' 
                            : 'bg-calm-300'
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
                        className="p-2 text-calm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-calm-800">Delete this skill?</h3>
                  <p className="text-sm text-calm-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-calm-600 mb-6">
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
