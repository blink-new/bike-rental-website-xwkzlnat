import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MapPin, Phone, Mail, MessageCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

interface Booking {
  id: string
  userId: string
  bikeId: string
  bookingType: string
  startDate: string
  endDate: string
  totalAmount: number
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
  createdAt: string
}

interface Bike {
  id: string
  name: string
  type: string
  imageUrl: string
}

interface BookingWithBike extends Booking {
  bike?: Bike
}

interface MyRentalsProps {
  user: {
    id: string
    email: string
    displayName?: string
  }
}

export default function MyRentals({ user }: MyRentalsProps) {
  const [bookings, setBookings] = useState<BookingWithBike[]>([])
  const [loading, setLoading] = useState(true)

  const loadBookings = useCallback(async () => {
    try {
      const userBookings = await blink.db.bookings.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      // Load bike details for each booking
      const bookingsWithBikes = await Promise.all(
        userBookings.map(async (booking) => {
          try {
            const bikes = await blink.db.bikes.list({
              where: { id: booking.bikeId }
            })
            return {
              ...booking,
              bike: bikes[0] || null
            }
          } catch (error) {
            console.error('Error loading bike for booking:', booking.id, error)
            return booking
          }
        })
      )

      setBookings(bookingsWithBikes)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'pending':
        return 'Pending Approval'
      case 'rejected':
        return 'Rejected'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filterBookings = (status?: string) => {
    if (!status) return bookings
    return bookings.filter(booking => booking.status === status)
  }

  const activeBookings = filterBookings('approved')
  const pendingBookings = filterBookings('pending')
  const completedBookings = filterBookings('completed')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rentals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rentals</h1>
          <p className="text-lg text-gray-600">Manage your bike bookings and rental history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">{activeBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${bookings.reduce((sum, booking) => sum + booking.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BookingsList bookings={bookings} getStatusColor={getStatusColor} getStatusText={getStatusText} formatDate={formatDate} />
          </TabsContent>

          <TabsContent value="active">
            <BookingsList bookings={activeBookings} getStatusColor={getStatusColor} getStatusText={getStatusText} formatDate={formatDate} />
          </TabsContent>

          <TabsContent value="pending">
            <BookingsList bookings={pendingBookings} getStatusColor={getStatusColor} getStatusText={getStatusText} formatDate={formatDate} />
          </TabsContent>

          <TabsContent value="completed">
            <BookingsList bookings={completedBookings} getStatusColor={getStatusColor} getStatusText={getStatusText} formatDate={formatDate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface BookingsListProps {
  bookings: BookingWithBike[]
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  formatDate: (dateString: string) => string
}

function BookingsList({ bookings, getStatusColor, getStatusText, formatDate }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600">You haven't made any bike reservations yet.</p>
        <Button className="mt-4">
          <a href="/browse">Browse Bikes</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {booking.bike?.name || 'Unknown Bike'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {booking.bike?.type} • Booking #{booking.id.slice(-8)}
                </p>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {getStatusText(booking.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bike Image */}
              {booking.bike?.imageUrl && (
                <div className="md:col-span-1">
                  <img 
                    src={booking.bike.imageUrl} 
                    alt={booking.bike.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Booking Details */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Start: {formatDate(booking.startDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>End: {formatDate(booking.endDate)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Type:</span> {booking.bookingType === 'instant' ? 'Instant Booking' : 'Pre-Reservation'}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{booking.customerEmail}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{booking.customerPhone}</span>
                </div>
                {booking.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span> {booking.notes}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ${booking.totalAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Booked on {formatDate(booking.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}