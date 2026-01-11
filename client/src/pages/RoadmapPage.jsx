import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoalStore } from '../store/goalStore'
import { CheckCircle2, Lock, Circle, Clock, ArrowLeft, X, Target, BookOpen, Play, FileText, ExternalLink, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function RoadmapPage() {
  const navigate = useNavigate()
  const { activeGoal } = useGoalStore()
  const [allTasks, setAllTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const scrollRef = useRef(null)
  
  // Partner progress state
  const [partnerData, setPartnerData] = useState(null)
  const [showPartnerView, setShowPartnerView] = useState(false)

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return Play
      case 'docs': return FileText
      case 'tutorial': return BookOpen
      default: return ExternalLink
    }
  }

  useEffect(() => {
    fetchAllTasks()
  }, [])

  const fetchAllTasks = async () => {
    try {
      let goalData = activeGoal
      if (!activeGoal) {
        const goalRes = await api.get('/goals/active')
        if (!goalRes.data) return
        goalData = goalRes.data
      }
      
      const tasksRes = await api.get(`/tasks/all/${goalData.id || goalData._id}`)
      setAllTasks(tasksRes.data)
      
      // Check if this is a shared goal and fetch partner progress
      if (goalData.isSharedGoal && goalData.partnerId) {
        try {
          const partnerRes = await api.get(`/goals/${goalData.id || goalData._id}/partner-progress`)
          setPartnerData(partnerRes.data)
        } catch (err) {
          console.log('Could not fetch partner progress:', err)
        }
      }
    } catch (error) {
      console.error('Failed to fetch roadmap:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Calculate wave positions for nodes
  const getNodePosition = (index, total) => {
    // Create a wave pattern: high -> low -> high -> low
    const isHigh = index % 2 === 0
    return isHigh ? 40 : 140 // Y positions for high and low points
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-breathe">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 opacity-60" />
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Your Roadmap</h1>
            <p className="text-gray-500 dark:text-gray-400">{activeGoal?.title || 'Skill Journey'}</p>
          </div>
        </div>
        
        {/* Partner toggle - only show for shared goals */}
        {partnerData && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPartnerView(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !showPartnerView 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              My Progress
            </button>
            <button
              onClick={() => setShowPartnerView(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showPartnerView 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                {partnerData.partner?.picture ? (
                  <img src={partnerData.partner.picture} alt={partnerData.partner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                    {partnerData.partner?.name?.charAt(0)}
                  </div>
                )}
              </div>
              {partnerData.partner?.name}'s Progress
            </button>
          </div>
        )}
      </div>

      {/* Partner info banner - show when viewing partner */}
      {showPartnerView && partnerData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="calm-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            {partnerData.partner?.picture ? (
              <img src={partnerData.partner.picture} alt={partnerData.partner.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-lg font-bold text-white">
                {partnerData.partner?.name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800 dark:text-gray-100">{partnerData.partner?.name}'s Journey</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Day {partnerData.partnerGoal?.currentDay} • {partnerData.partnerGoal?.completedDays} days completed
            </p>
          </div>
          <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </motion.div>
      )}

      {/* Visual Flow Roadmap */}
      <div className="relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Scrollable container */}
        <div 
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide py-4 px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div 
            className="relative"
            style={{ 
              width: `${Math.max((showPartnerView && partnerData ? partnerData.partnerTasks : allTasks).length * 140, 600)}px`,
              height: '220px'
            }}
          >
            {/* SVG Path connecting nodes */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>
              
              {(showPartnerView && partnerData ? partnerData.partnerTasks : allTasks).map((task, index) => {
                const displayTasks = showPartnerView && partnerData ? partnerData.partnerTasks : allTasks
                if (index === displayTasks.length - 1) return null
                
                const x1 = 60 + index * 140
                const y1 = getNodePosition(index)
                const x2 = 60 + (index + 1) * 140
                const y2 = getNodePosition(index + 1)
                
                // Control points for smooth curve
                const cx1 = x1 + 70
                const cy1 = y1
                const cx2 = x2 - 70
                const cy2 = y2
                
                const isCompleted = task.status === 'completed'
                const nextCompleted = displayTasks[index + 1]?.status === 'completed'
                
                return (
                  <path
                    key={`path-${index}`}
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isCompleted && nextCompleted ? '#86efac' : isCompleted ? '#93c5fd' : '#e2e8f0'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>

            {/* Day nodes */}
            {(showPartnerView && partnerData ? partnerData.partnerTasks : allTasks).map((task, index) => {
              const displayTasks = showPartnerView && partnerData ? partnerData.partnerTasks : allTasks
              const isCompleted = task.status === 'completed'
              const isSkipped = task.status === 'skipped'
              const isPending = task.status === 'pending'
              const isNext = isPending && (index === 0 || displayTasks[index - 1]?.status === 'completed')
              const isLocked = isPending && !isNext
              
              const x = 60 + index * 140
              const y = getNodePosition(index)
              const isHigh = index % 2 === 0

              return (
                <motion.div
                  key={task._id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 15 }}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${x - 28}px`,
                    top: `${y - 28}px`
                  }}
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Node circle */}
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-300 hover:scale-110
                    ${isCompleted ? 'bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 shadow-lg shadow-gray-300 dark:shadow-gray-800' :
                      isNext ? 'bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-200 shadow-lg shadow-gray-300 dark:shadow-gray-800 ring-4 ring-gray-300 dark:ring-gray-600 animate-pulse' :
                      isSkipped ? 'bg-gray-300 dark:bg-gray-600' :
                      'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-7 h-7 text-white dark:text-gray-900" />
                    ) : isNext ? (
                      <Circle className="w-7 h-7 text-white dark:text-gray-900" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>

                  {/* Day label */}
                  <div 
                    className={`
                      absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center
                      ${isHigh ? 'top-16' : 'bottom-16'}
                    `}
                  >
                    <p className={`text-sm font-bold ${
                      isCompleted ? 'text-gray-700 dark:text-gray-200' :
                      isNext ? 'text-gray-800 dark:text-gray-100' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      Day {task.dayNumber}
                    </p>
                    <p className={`text-xs max-w-[100px] truncate ${
                      isCompleted ? 'text-gray-500 dark:text-gray-400' :
                      isNext ? 'text-gray-600 dark:text-gray-300' :
                      'text-gray-400 dark:text-gray-500'
                    }`}>
                      {task.title.replace(`Day ${task.dayNumber}: `, '').substring(0, 20)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-2 flex-wrap justify-center">
        {[...new Set(allTasks.map(t => t.phase))].filter(Boolean).map((phase, idx) => (
          <span 
            key={idx} 
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
          >
            {phase}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-700 dark:bg-gray-300" />
          <span className="text-gray-500 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-gray-500 dark:text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-500 dark:text-gray-400">Upcoming</span>
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {selectedTask.phase && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{selectedTask.phase}</span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Day {selectedTask.dayNumber}: {selectedTask.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTask.estimatedMinutes} minutes</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedTask.status === 'completed' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                      selectedTask.status === 'pending' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedTask.description}</p>

              {/* Skill Progression */}
              {selectedTask.skillProgression && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Outcome</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTask.skillProgression}</p>
                </div>
              )}

              {/* What to Learn */}
              {selectedTask.whatToLearn && selectedTask.whatToLearn.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                    <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Topics
                  </p>
                  <div className="space-y-1">
                    {selectedTask.whatToLearn.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {selectedTask.resources && selectedTask.resources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Resources
                  </p>
                  <div className="space-y-2">
                    {selectedTask.resources.map((resource, idx) => {
                      const IconComponent = getResourceIcon(resource.type)
                      return (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                              {resource.title || resource.url}
                            </p>
                            {resource.creator && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{resource.creator}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedTask.actionItems && selectedTask.actionItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Tasks</p>
                  <div className="space-y-2">
                    {selectedTask.actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedTask.status === 'completed' || item.completed
                            ? 'border-gray-500 bg-gray-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {(selectedTask.status === 'completed' || item.completed) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`${
                          selectedTask.status === 'completed' || item.completed
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {typeof item === 'string' ? item : item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action button */}
              {selectedTask.status === 'pending' && (
                <button
                  onClick={() => {
                    setSelectedTask(null)
                    navigate('/')
                  }}
                  className="w-full calm-button-primary mt-2"
                >
                  Go to Dashboard
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
