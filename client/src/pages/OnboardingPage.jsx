import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoalStore } from '../store/goalStore'
import { useAuthStore } from '../store/authStore'
import { 
  BookOpen, 
  Hammer, 
  Heart, 
  GraduationCap, 
  Repeat,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  Lightbulb,
  Loader2
} from 'lucide-react'

const GOAL_TYPES = [
  { 
    id: 'learning', 
    label: 'Learning a Skill', 
    icon: BookOpen, 
    color: 'sky',
    description: 'Master something new at your own pace'
  },
  { 
    id: 'project', 
    label: 'Building a Project', 
    icon: Hammer, 
    color: 'sage',
    description: 'Create something meaningful, step by step'
  },
  { 
    id: 'health', 
    label: 'Health & Wellness', 
    icon: Heart, 
    color: 'rose',
    description: 'Build sustainable healthy habits'
  },
  { 
    id: 'exam', 
    label: 'Exam Preparation', 
    icon: GraduationCap, 
    color: 'amber',
    description: 'Prepare thoroughly without cramming'
  },
  { 
    id: 'habit', 
    label: 'Building a Habit', 
    icon: Repeat, 
    color: 'violet',
    description: 'Form lasting routines with patience'
  },
]

const DAILY_TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { createGoal, checkTimeline, isLoading } = useGoalStore()
  const { updateUser } = useAuthStore()
  
  const [step, setStep] = useState(1)
  const [goalType, setGoalType] = useState(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [totalDays, setTotalDays] = useState(30)
  const [dailyMinutes, setDailyMinutes] = useState(60)
  const [timelineSuggestion, setTimelineSuggestion] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)

  const handleTypeSelect = (type) => {
    setGoalType(type)
  }

  const handleDaysChange = async (days) => {
    setTotalDays(days)
    if (goalType) {
      const suggestion = await checkTimeline(goalType.id, days)
      setTimelineSuggestion(suggestion)
      setShowSuggestion(suggestion.isRushed)
    }
  }

  const handleAcceptSuggestion = () => {
    if (timelineSuggestion) {
      setTotalDays(timelineSuggestion.suggestedDays)
      setShowSuggestion(false)
    }
  }

  const handleNext = () => {
    if (step === 2 && goalType) {
      handleDaysChange(totalDays)
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (isLoading) return; // Prevent double submission
    
    try {
      console.log('Creating goal with data:', {
        type: goalType.id,
        title: goalTitle,
        description: goalDescription,
        totalDays,
        dailyMinutes
      });
      
      const result = await createGoal({
        type: goalType.id,
        title: goalTitle,
        description: goalDescription,
        totalDays,
        dailyMinutes
      });
      
      console.log('Goal created successfully:', result);
      
      updateUser({ onboardingComplete: true });
      navigate('/');
    } catch (error) {
      console.error('Failed to create goal:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create goal: ${error.response?.data?.error || error.message}`);
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return goalType !== null
      case 2: return goalTitle.trim().length > 0
      case 3: return totalDays > 0
      case 4: return dailyMinutes > 0
      default: return false
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-1/4 h-1 rounded-full mx-1 transition-colors duration-300 ${
                  s <= step ? 'bg-sky-400' : 'bg-calm-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-calm-500 text-center">Step {step} of 4</p>
        </div>

        {/* Step content */}
        <div className="calm-card min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Goal Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-2xl font-semibold text-calm-800 mb-2">
                  What kind of goal?
                </h2>
                <p className="text-calm-500 mb-6">
                  Choose the type that best describes your intention
                </p>

                <div className="space-y-3">
                  {GOAL_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = goalType?.id === type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-sky-400 bg-sky-50/50'
                            : 'border-calm-200 hover:border-calm-300 bg-white/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-sky-100' : 'bg-calm-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-sky-500' : 'text-calm-500'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-sky-700' : 'text-calm-700'}`}>
                            {type.label}
                          </p>
                          <p className="text-sm text-calm-400">{type.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Goal Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-2xl font-semibold text-calm-800 mb-2">
                  Define your goal
                </h2>
                <p className="text-calm-500 mb-6">
                  Be specific - clarity helps create better daily tasks
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">
                      What do you want to achieve?
                    </label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g., Learn to play guitar basics"
                      className="calm-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">
                      Any additional details? (optional)
                    </label>
                    <textarea
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="e.g., I want to learn basic chords and be able to play simple songs"
                      className="calm-input min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-sky-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-sky-700">Tip</p>
                      <p className="text-sm text-sky-600">
                        The more specific you are, the better your AI-generated daily tasks will be.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Timeline */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-2xl font-semibold text-calm-800 mb-2">
                  How many days?
                </h2>
                <p className="text-calm-500 mb-6">
                  Choose a timeline that feels comfortable, not rushed
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <Calendar className="w-6 h-6 text-calm-400" />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="7"
                      max="180"
                      value={totalDays}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                  <div className="w-20 text-center">
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={totalDays}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value) || 7)}
                      className="w-full text-center calm-input py-2"
                    />
                    <p className="text-xs text-calm-400 mt-1">days</p>
                  </div>
                </div>

                {/* Gentle suggestion */}
                <AnimatePresence>
                  {showSuggestion && timelineSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-warmth-50 rounded-xl border border-warmth-200 mb-6"
                    >
                      <p className="text-warmth-700 text-sm mb-3">
                        {timelineSuggestion.message}
                      </p>
                      <p className="text-warmth-600 text-xs italic mb-3">
                        {timelineSuggestion.encouragement}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAcceptSuggestion}
                          className="text-sm px-4 py-2 bg-warmth-100 text-warmth-700 rounded-lg hover:bg-warmth-200 transition-colors"
                        >
                          Take {timelineSuggestion.suggestedDays} days instead
                        </button>
                        <button
                          onClick={() => setShowSuggestion(false)}
                          className="text-sm px-4 py-2 text-warmth-600 hover:text-warmth-700 transition-colors"
                        >
                          Keep my choice
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showSuggestion && (
                  <div className="p-4 bg-sage-50/50 rounded-xl border border-sage-100">
                    <p className="text-sm text-sage-700">
                      {timelineSuggestion?.message || "Your timeline looks thoughtful and achievable."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Daily Time */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <h2 className="text-2xl font-semibold text-calm-800 mb-2">
                  Daily time commitment
                </h2>
                <p className="text-calm-500 mb-6">
                  How much time can you dedicate each day?
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {DAILY_TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDailyMinutes(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        dailyMinutes === option.value
                          ? 'border-sky-400 bg-sky-50/50'
                          : 'border-calm-200 hover:border-calm-300 bg-white/50'
                      }`}
                    >
                      <Clock className={`w-5 h-5 mx-auto mb-2 ${
                        dailyMinutes === option.value ? 'text-sky-500' : 'text-calm-400'
                      }`} />
                      <p className={`font-medium ${
                        dailyMinutes === option.value ? 'text-sky-700' : 'text-calm-700'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-4 bg-calm-50 rounded-xl border border-calm-200">
                  <h3 className="font-medium text-calm-700 mb-3">Your plan summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-calm-500">Goal type:</span>
                      <span className="text-calm-700">{goalType?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-calm-500">Goal:</span>
                      <span className="text-calm-700 text-right max-w-[200px] truncate">
                        {goalTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-calm-500">Duration:</span>
                      <span className="text-calm-700">{totalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-calm-500">Daily time:</span>
                      <span className="text-calm-700">{dailyMinutes} minutes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-calm-100">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="calm-button-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="calm-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="calm-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating your plan...
                  </>
                ) : (
                  <>
                    Start my journey
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
