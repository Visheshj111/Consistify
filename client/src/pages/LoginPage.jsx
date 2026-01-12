import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { Zap, Target, Clock, Heart } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    console.log('Google login success, credential received')
    try {
      const result = await login(credentialResponse.credential)
      console.log('Login result:', result)
      if (result.success) {
        navigate('/')
      } else {
        console.error('Login failed:', result.error)
        alert('Login failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login error: ' + error.message)
    }
  }

  const handleError = (error) => {
    console.error('Google login failed:', error)
    alert('Google login failed. Please try again.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      {/* Background decorative elements removed */}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black dark:bg-white mb-6 shadow-lg"
          >
            <img src="/logo.png" alt="Persisto Logo" className="w-10 h-10 object-contain" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Persisto</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Build skills with consistency</p>
        </div>

        {/* Card */}
        <div className="calm-card text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Welcome to Persisto
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            One day at a time. No rush. No pressure.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily focus</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gentle pace</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">No guilt</p>
            </div>
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
            />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8 italic"
        >
          "The journey of a thousand miles begins with a single step."
        </motion.p>
      </motion.div>
    </div>
  )
}
