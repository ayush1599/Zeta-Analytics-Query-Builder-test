import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isValidReset, setIsValidReset] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for auth fragments in URL hash (format: #access_token=...&type=recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const hashAccessToken = hashParams.get('access_token')
      const hashRefreshToken = hashParams.get('refresh_token')
      const hashType = hashParams.get('type')

      // Check for auth parameters in URL query (format: ?access_token=...&type=recovery)
      const queryAccessToken = searchParams.get('access_token')
      const queryRefreshToken = searchParams.get('refresh_token')
      const queryType = searchParams.get('type')

      // Use whichever format we find
      const accessToken = hashAccessToken || queryAccessToken
      const refreshToken = hashRefreshToken || queryRefreshToken
      const type = hashType || queryType

      console.log('Auth callback params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

      if (type === 'recovery' && accessToken) {
        try {
          // Set the session from the URL parameters
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          
          if (error) {
            console.error('Error setting session:', error)
            setError('Invalid or expired reset link. Please request a new password reset.')
            return
          }
          
          console.log('Session set successfully:', data)
          setIsValidReset(true)
          
          // Clear the URL for security
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (err) {
          console.error('Error in auth callback:', err)
          setError('Failed to process reset link. Please try again.')
        }
      } else if (accessToken) {
        // Handle case where we have a token but no type (some Supabase configurations)
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          
          if (!error && data.session) {
            setIsValidReset(true)
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.')
          }
        } catch (err) {
          setError('Failed to process reset link. Please try again.')
        }
      } else {
        // Check if we already have a valid session (user might have already clicked the link)
        const { data, error } = await supabase.auth.getSession()
        
        if (!error && data.session) {
          setIsValidReset(true)
        } else {
          setError('No valid reset link found. Please use the link from your email or request a new password reset.')
        }
      }
    }

    handleAuthCallback()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(password)
      // Successfully updated password, redirect to sign-in
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Password update error:', error)
      setError('Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidReset && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Processing reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={!isValidReset}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!isValidReset}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={!isValidReset}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={!isValidReset}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isValidReset}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 