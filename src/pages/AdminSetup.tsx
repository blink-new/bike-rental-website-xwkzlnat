import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useToast } from '../hooks/use-toast'
import { Shield, UserPlus, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  displayName?: string
}

interface AdminSetupProps {
  user: User
}

export default function AdminSetup({ user }: AdminSetupProps) {
  const [adminCode, setAdminCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasAdmins, setHasAdmins] = useState(false)
  const [checkingAdmins, setCheckingAdmins] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Admin setup code - in production, this should be environment variable
  const ADMIN_SETUP_CODE = 'BIKERIDE2024'

  useEffect(() => {
    const checkExistingAdmins = async () => {
      try {
        const admins = await blink.db.admin_users.list()
        setHasAdmins(admins.length > 0)
      } catch (error) {
        console.error('Error checking admins:', error)
      } finally {
        setCheckingAdmins(false)
      }
    }
    
    checkExistingAdmins()
  }, [])

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (adminCode !== ADMIN_SETUP_CODE) {
      toast({
        title: "Invalid Code",
        description: "Please enter the correct admin setup code.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Add current user as admin
      await blink.db.admin_users.create({
        user_id: user.id,
        role: 'admin'
      })

      toast({
        title: "Admin Access Granted!",
        description: "You now have admin privileges.",
      })

      // Redirect to admin dashboard
      navigate('/admin')
    } catch (error) {
      console.error('Error setting up admin:', error)
      toast({
        title: "Setup Failed",
        description: "Failed to set up admin access. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBecomeAdmin = async () => {
    setIsLoading(true)
    try {
      // Check if user is already admin
      const existingAdmin = await blink.db.admin_users.list({
        where: { user_id: user.id }
      })

      if (existingAdmin.length > 0) {
        toast({
          title: "Already Admin",
          description: "You already have admin privileges.",
        })
        navigate('/admin')
        return
      }

      // Add user as admin (if admins already exist, this might need approval)
      await blink.db.admin_users.create({
        user_id: user.id,
        role: 'admin'
      })

      toast({
        title: "Admin Access Granted!",
        description: "You now have admin privileges.",
      })

      navigate('/admin')
    } catch (error) {
      console.error('Error becoming admin:', error)
      toast({
        title: "Access Denied",
        description: "Unable to grant admin access. Contact existing admin.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAdmins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            {!hasAdmins 
              ? "Set up the first admin account for BikeRide"
              : "Request admin access to manage the platform"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAdmins ? (
            <form onSubmit={handleSetupAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminCode">Admin Setup Code</Label>
                <Input
                  id="adminCode"
                  type="password"
                  placeholder="Enter setup code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Use code: <code className="bg-gray-100 px-1 rounded">BIKERIDE2024</code>
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Become Admin
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  Admin system is already set up. Contact an existing admin for access.
                </p>
              </div>
              <Button 
                onClick={handleBecomeAdmin} 
                className="w-full" 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Request Admin Access
                  </>
                )}
              </Button>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}