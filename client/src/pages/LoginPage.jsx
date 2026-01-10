import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { Leaf, Wind, Sun, Moon } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-sky-200/30"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-sage-200/30"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-40 right-20 w-24 h-24 rounded-full bg-warmth-200/20"
        />
      </div>

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
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-sage-400 mb-6 shadow-lg"
          >
            <Leaf className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-calm-800 mb-2">Flow Goals</h1>
          <p className="text-calm-500 text-lg">Achieve with calm consistency</p>
        </div>

        {/* Card */}
        <div className="calm-card text-center">
          <h2 className="text-xl font-semibold text-calm-700 mb-2">
            Welcome to your flow state
          </h2>
          <p className="text-calm-500 mb-8">
            One day at a time. No rush. No pressure.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-2">
                <Sun className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-xs text-calm-500">Daily focus</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-2">
                <Wind className="w-5 h-5 text-sage-500" />
              </div>
              <p className="text-xs text-calm-500">Gentle pace</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-warmth-100 flex items-center justify-center mx-auto mb-2">
                <Moon className="w-5 h-5 text-warmth-500" />
              </div>
              <p className="text-xs text-calm-500">No guilt</p>
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

          <p className="text-xs text-calm-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-calm-400 text-sm mt-8 italic"
        >
          "The journey of a thousand miles begins with a single step."
        </motion.p>
      </motion.div>
    </div>
  )
}
