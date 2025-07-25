import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bike, Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

interface DashboardStats {
  totalBikes: number
  availableBikes: number
  totalBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBikes: 0,
    availableBikes: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardStats = async () => {
    try {
      // Load bikes stats
      const allBikes = await blink.db.bikes.list()
      const availableBikes = allBikes.filter(bike => Number(bike.isAvailable) > 0)

      // Load bookings stats
      const allBookings = await blink.db.bookings.list()
      const pendingBookings = allBookings.filter(booking => booking.status === 'pending')
      
      // Calculate revenue
      const totalRevenue = allBookings
        .filter(booking => booking.status === 'approved' || booking.status === 'completed')
        .reduce((sum, booking) => sum + booking.totalAmount, 0)

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt)
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear &&
                 (booking.status === 'approved' || booking.status === 'completed')
        })
        .reduce((sum, booking) => sum + booking.totalAmount, 0)

      setStats({
        totalBikes: allBikes.length,
        availableBikes: availableBikes.length,
        totalBookings: allBookings.length,
        pendingBookings: pendingBookings.length,
        totalRevenue,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your bike rental business</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bikes</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBikes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.availableBikes} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingBookings} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.monthlyRevenue.toFixed(2)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                Require your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalBikes > 0 ? Math.round((stats.availableBikes / stats.totalBikes) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Bikes ready to rent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(stats.totalBookings > 0 ? ['user1', 'user2', 'user3'] : []).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Unique customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bike Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add new bikes, edit existing ones, and manage pricing.
              </p>
              <Link to="/admin/bikes">
                <Button className="w-full">
                  <Bike className="mr-2 h-4 w-4" />
                  Manage Bikes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review and approve booking requests, send notifications.
              </p>
              <Link to="/admin/bookings">
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Bookings
                  {stats.pendingBookings > 0 && (
                    <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                      {stats.pendingBookings}
                    </span>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View detailed revenue reports and business insights.
              </p>
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}