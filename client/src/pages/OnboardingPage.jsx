import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoalStore } from '../store/goalStore'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
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
  Info,
  Loader2,
  Users,
  UserPlus,
  Check,
  X
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
  
  // Friend invite state
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [inviteSent, setInviteSent] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState(null)

  useEffect(() => {
    // Fetch friends list when component mounts
    const fetchFriends = async () => {
      try {
        const res = await api.get('/users/friends')
        setFriends(res.data)
      } catch (error) {
        console.error('Failed to fetch friends:', error)
      }
    }
    fetchFriends()
  }, [])

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

  // Generate plan and optionally invite friend
  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      if (selectedFriend && !inviteSent) {
        // Create goal and send invite to friend
        console.log('Creating shared goal with friend:', selectedFriend.name);
        
        const result = await createGoal({
          type: goalType.id,
          title: goalTitle,
          description: goalDescription,
          totalDays,
          dailyMinutes,
          inviteFriendId: selectedFriend.id
        });
        
        console.log('Shared goal invite sent:', result);
        setInviteSent(true);
        
        // Show waiting message instead of navigating
        return;
      }
      
      // Regular goal creation (no friend)
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

  // Start journey without waiting for friend
  const handleStartWithoutFriend = async () => {
    try {
      const result = await createGoal({
        type: goalType.id,
        title: goalTitle,
        description: goalDescription,
        totalDays,
        dailyMinutes
      });
      
      updateUser({ onboardingComplete: true });
      navigate('/');
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert(`Failed to create goal: ${error.response?.data?.error || error.message}`);
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return goalType !== null
      case 2: return goalTitle.trim().length > 0
      case 3: return totalDays > 0
      case 4: return dailyMinutes > 0
      case 5: return true // Friend invite is optional
      default: return false
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full mx-1 transition-colors duration-300 ${
                  s <= step ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Step {step} of 5</p>
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
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  What kind of goal?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
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
                            ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-900/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-black dark:bg-white' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                            {type.label}
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">{type.description}</p>
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
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Define your goal
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Be specific - clarity helps create better daily tasks
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Any additional details? (optional)
                    </label>
                    <textarea
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="e.g., I want to learn basic chords and be able to play simple songs"
                      className="calm-input min-h-[100px] resize-none"
                    />
                  </div>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg z-10">
                      <p className="font-medium mb-1">Tip</p>
                      <p>The more specific you are, the better your AI-generated daily tasks will be.</p>
                      <div className="absolute left-4 top-full w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45 -mt-1"></div>
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
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  How many days?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Choose a timeline that feels comfortable, not rushed
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <Calendar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="7"
                      max="180"
                      value={totalDays}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value))}
                      className="w-full accent-gray-800 dark:accent-white"
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
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">days</p>
                  </div>
                </div>

                {/* Gentle suggestion */}
                <AnimatePresence>
                  {showSuggestion && timelineSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6"
                    >
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        {timelineSuggestion.message}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs italic mb-3">
                        {timelineSuggestion.encouragement}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAcceptSuggestion}
                          className="text-sm px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          Take {timelineSuggestion.suggestedDays} days instead
                        </button>
                        <button
                          onClick={() => setShowSuggestion(false)}
                          className="text-sm px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          Keep my choice
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showSuggestion && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
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
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Daily time commitment
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  How much time can you dedicate each day?
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {DAILY_TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDailyMinutes(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        dailyMinutes === option.value
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-900/50'
                      }`}
                    >
                      <Clock className={`w-5 h-5 mx-auto mb-2 ${
                        dailyMinutes === option.value ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <p className={`font-medium ${
                        dailyMinutes === option.value ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Your plan summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Goal type:</span>
                      <span className="text-gray-700 dark:text-gray-200">{goalType?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Goal:</span>
                      <span className="text-gray-700 dark:text-gray-200 text-right max-w-[200px] truncate">
                        {goalTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span className="text-gray-700 dark:text-gray-200">{totalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Daily time:</span>
                      <span className="text-gray-700 dark:text-gray-200">{dailyMinutes} minutes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Invite Friend */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                {inviteSent ? (
                  // Invite sent confirmation
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Invite Sent!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Waiting for <span className="font-medium text-gray-700 dark:text-gray-200">{selectedFriend?.name}</span> to accept your invite to learn together.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                      Your friend will receive an invite to join this skill journey. Once they accept, you'll both start on Day 1 together!
                    </p>
                    <button
                      onClick={handleStartWithoutFriend}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                    >
                      Start alone instead
                    </button>
                  </div>
                ) : (
                  // Friend selection
                  <>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Learn together?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Invite a friend to join this journey with you. You'll share the same roadmap and can see each other's progress.
                    </p>

                    {friends.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No friends yet. Add friends from the Community page!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {friends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => setSelectedFriend(selectedFriend?.id === friend.id ? null : friend)}
                            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                              selectedFriend?.id === friend.id
                                ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {friend.picture ? (
                                <img src={friend.picture} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-white">{friend.name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{friend.name}</p>
                              {friend.currentSkill && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  Currently: {friend.currentSkill}
                                </p>
                              )}
                            </div>
                            {selectedFriend?.id === friend.id && (
                              <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedFriend && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <UserPlus className="w-4 h-4 inline-block mr-1" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">{selectedFriend.name}</span> will receive an invite to learn <span className="font-medium text-gray-700 dark:text-gray-200">{goalTitle}</span> with you.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
            {step > 1 && !inviteSent ? (
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

            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="calm-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !inviteSent ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="calm-button-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    'Start alone'
                  )}
                </button>
                {selectedFriend && (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="calm-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending invite...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Invite & Start
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
