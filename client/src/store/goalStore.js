import { create } from 'zustand'
import api from '../utils/api'

export const useGoalStore = create((set, get) => ({
  activeGoal: null,
  todayTask: null,
  goals: [],
  isLoading: false,
  error: null,

  fetchTodayTask: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/tasks/today')
      set({ 
        todayTask: response.data.task || null, 
        activeGoal: response.data.goal || null,
        isLoading: false 
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        set({ todayTask: null, activeGoal: null, isLoading: false })
        return null
      }
      set({ error: error.response?.data?.error || 'Failed to fetch task', isLoading: false })
      throw error
    }
  },

  fetchGoals: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/goals')
      set({ goals: response.data, isLoading: false })
      return response.data
    } catch (error) {
      console.error('Fetch goals error:', error)
      set({ isLoading: false })
      throw error
    }
  },

  checkTimeline: async (type, totalDays) => {
    try {
      const response = await api.post('/goals/check-timeline', { type, totalDays })
      return response.data
    } catch (error) {
      console.error('Check timeline error:', error)
      throw error
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true, error: null })
    try {
      // If inviting a friend, we need to create the goal first to get the AI plan,
      // then send an invite instead of starting immediately
      if (goalData.inviteFriendId) {
        // First, create a temporary goal to generate the AI plan
        const response = await api.post('/goals', {
          type: goalData.type,
          title: goalData.title,
          description: goalData.description,
          totalDays: goalData.totalDays,
          dailyMinutes: goalData.dailyMinutes
        })
        
        // Delete the temporary goal (we'll create proper shared goals when friend accepts)
        const tempGoal = response.data.goal
        await api.delete(`/goals/${tempGoal._id}`)
        
        // Send invite to friend with the generated plan
        await api.post('/goals/invite', {
          friendId: goalData.inviteFriendId,
          goalData: {
            type: goalData.type,
            title: goalData.title,
            description: goalData.description,
            totalDays: goalData.totalDays,
            dailyMinutes: goalData.dailyMinutes,
            aiGeneratedPlan: tempGoal.aiGeneratedPlan
          }
        })
        
        set({ isLoading: false })
        return { inviteSent: true, message: 'Invite sent to friend!' }
      }
      
      // Regular goal creation (no friend invite)
      const response = await api.post('/goals', goalData)
      set((state) => ({ 
        goals: [response.data.goal, ...state.goals],
        activeGoal: response.data.goal,
        isLoading: false 
      }))
      return response.data
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to create goal', isLoading: false })
      throw error
    }
  },

  setActiveGoal: async (goalId) => {
    try {
      const response = await api.patch(`/goals/${goalId}/set-active`)
      set((state) => ({
        activeGoal: response.data,
        goals: state.goals.map(g => ({
          ...g,
          isActive: g._id === goalId
        }))
      }))
      // Refresh today's task for the new active goal
      await get().fetchTodayTask()
      return response.data
    } catch (error) {
      console.error('Set active goal error:', error)
      throw error
    }
  },

  deleteGoal: async (goalId) => {
    try {
      await api.delete(`/goals/${goalId}`)
      const deletedWasActive = get().activeGoal?._id === goalId || get().activeGoal?.id === goalId
      set((state) => ({
        goals: state.goals.filter(g => g._id !== goalId),
        activeGoal: deletedWasActive ? null : state.activeGoal,
        todayTask: deletedWasActive ? null : state.todayTask
      }))
      return true
    } catch (error) {
      console.error('Delete goal error:', error)
      throw error
    }
  },

  completeTask: async (taskId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/complete`)
      // Refresh today's task
      await get().fetchTodayTask()
      return response.data
    } catch (error) {
      console.error('Complete task error:', error)
      throw error
    }
  },

  skipTask: async (taskId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/skip`)
      // Refresh today's task
      await get().fetchTodayTask()
      return response.data
    } catch (error) {
      console.error('Skip task error:', error)
      throw error
    }
  },

  updateActionItem: async (taskId, itemIndex, completed) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/action-item/${itemIndex}`, { completed })
      set({ todayTask: response.data })
      return response.data
    } catch (error) {
      console.error('Update action item error:', error)
      throw error
    }
  }
}))
