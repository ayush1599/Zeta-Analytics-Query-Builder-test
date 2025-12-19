import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password Unavailable</CardTitle>
          <CardDescription>Static Authentication Mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 text-sm text-yellow-600 bg-yellow-50 rounded-lg border border-yellow-200">
            Password reset is disabled in static authentication mode. Please use the default password provided by your administrator.
          </div>

          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}