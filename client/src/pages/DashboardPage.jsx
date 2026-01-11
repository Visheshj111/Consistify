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
  Zap,
  Sun,
  Moon,
  Coffee,
  ExternalLink,
  BookOpen,
  Play,
  FileText,
  Target,
  Info
} from 'lucide-react'
import { format } from 'date-fns'

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
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  useEffect(() => {
    fetchTodayTask()
  }, [fetchTodayTask])

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
      // Don't auto-hide - let user decide when to continue
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 opacity-60" />
          <p className="text-gray-500 dark:text-gray-400">Loading your day...</p>
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-6">
          <Zap className="w-12 h-12 text-gray-500 dark:text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
          No active skill
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
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
    const completedDay = activeGoal ? activeGoal.completedDays : 1
    
    const handleContinueNow = () => {
      setShowConfirmation(null)
      // The task has already been fetched after completion
    }
    
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
              ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
          }`}
        >
          {showConfirmation === 'complete' ? (
            <Sparkles className="w-12 h-12 text-gray-600 dark:text-gray-300" />
          ) : (
            <Zap className="w-12 h-12 text-gray-500 dark:text-gray-400" />
          )}
        </motion.div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {showConfirmation === 'complete' 
            ? `Day ${completedDay} completed!` 
            : "Task skipped"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          {showConfirmation === 'complete'
            ? "Tomorrow's task will be available at midnight."
            : "Task moved to tomorrow. No schedule adjustment needed."}
        </p>
        
        {/* Want to do it now option - only for complete */}
        {showConfirmation === 'complete' && todayTask && (
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={handleContinueNow}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm underline underline-offset-2 transition-colors"
              >
                Want to do the next task now?
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showInfoTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-10"
                    >
                      <p className="leading-relaxed">
                        <span className="font-semibold text-yellow-400">Not recommended.</span> People often get overwhelmed when trying to do too much. We suggest starting slow and sticking to the plan for sustainable progress.
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              (Not recommended)
            </p>
          </div>
        )}
      </motion.div>
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
        {/* Greeting */}
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <GreetingIcon className="w-5 h-5" />
          <span>{greeting.text}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-gray-400 dark:text-gray-500">{format(new Date(), 'EEEE, MMMM d')}</span>
        </div>

        {/* Goal Progress */}
        {activeGoal && (
          <div className="calm-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your journey</p>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{activeGoal.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{activeGoal.progress || 0}%</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Day {activeGoal.completedDays + 1} of {activeGoal.totalDays}
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activeGoal.progress || 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200 rounded-full"
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
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{todayTask.phase}</p>
              )}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{todayTask.title}</h2>
            </div>
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{todayTask.estimatedMinutes} min</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {todayTask.description}
          </p>

          {/* Where to Learn - Resources inline */}
          {todayTask.resources && todayTask.resources.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Where to learn</span>
              </div>
              <div className="space-y-2">
                {todayTask.resources.slice(0, 3).map((resource, index) => {
                  const IconComponent = getResourceIcon(resource.type)
                  return (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{resource.title || 'Resource'}</span>
                      <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* What to Learn Section */}
          {todayTask.whatToLearn && todayTask.whatToLearn.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowWhatToLearn(!showWhatToLearn)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 hover:text-gray-800 dark:hover:text-gray-100"
              >
                <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                What to learn (brief)
                {showWhatToLearn ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showWhatToLearn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2"
                  >
                    {todayTask.whatToLearn.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </div>
                    ))}
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
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 hover:text-gray-700 dark:hover:text-gray-300"
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
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          item.completed 
                            ? 'border-gray-500 bg-gray-500' 
                            : 'border-gray-300 dark:border-gray-600'
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
                      ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
            Skipped tasks are moved to tomorrow.
          </p>
        </motion.div>
      )}
      </div>

      {/* Right Sidebar - Resources */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-24 space-y-4">
          {/* Learn From Resources */}
          {todayTask?.resources && todayTask.resources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="calm-card"
            >
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Learn from
              </h3>
              <div className="space-y-3">
                {todayTask.resources.map((resource, index) => {
                  const IconComponent = getResourceIcon(resource.type)
                  return (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        resource.type === 'video' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                        resource.type === 'docs' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-black dark:group-hover:text-white text-sm flex items-center gap-1">
                          <span className="line-clamp-2">{resource.title || 'Resource'}</span>
                          <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                        </p>
                        {resource.creator && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{resource.creator}</p>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Quick tip */}
          {todayTask && (
            <div className="calm-card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Focus on understanding, not speed. You're building lasting knowledge.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
