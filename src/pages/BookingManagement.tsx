import { useState, useEffect, useCallback } from 'react'
import { Check, X, Phone, Mail, Calendar, Clock, MessageCircle, Truck, RotateCcw, Hash, Edit3 } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../hooks/use-toast'

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
  bikeNumber?: string
  deliveryStatus?: string
  returnStatus?: string
  deliveredAt?: string
  returnedAt?: string
  assignedByAdmin?: string
}

interface Bike {
  id: string
  name: string
  type: string
  imageUrl: string
  bikeNumber?: string
}

interface BookingWithBike extends Booking {
  bike?: Bike
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<BookingWithBike[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set())
  const [selectedBooking, setSelectedBooking] = useState<BookingWithBike | null>(null)
  const [bikeNumberInput, setBikeNumberInput] = useState('')
  const [deliveryStatusInput, setDeliveryStatusInput] = useState('')
  const [returnStatusInput, setReturnStatusInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadBookings = useCallback(async () => {
    try {
      const allBookings = await blink.db.bookings.list({
        orderBy: { createdAt: 'desc' }
      })

      // Load bike details for each booking
      const bookingsWithBikes = await Promise.all(
        allBookings.map(async (booking) => {
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
      toast({
        title: "Error",
        description: "Failed to load bookings.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const sendNotifications = async (booking: BookingWithBike, action: 'approve' | 'reject' | 'delivered' | 'returned') => {
    // Simulate WhatsApp and Email notifications
    let message = ''
    
    switch (action) {
      case 'approve':
        message = `Great news! Your bike rental for ${booking.bike?.name} has been approved. ${booking.bikeNumber ? `Bike Number: ${booking.bikeNumber}. ` : ''}Pickup details will be sent shortly.`
        break
      case 'reject':
        message = `We're sorry, but your bike rental request for ${booking.bike?.name} has been declined. Please contact us for more information.`
        break
      case 'delivered':
        message = `Your bike ${booking.bike?.name} (${booking.bikeNumber}) has been delivered! Enjoy your ride and remember to return it on time.`
        break
      case 'returned':
        message = `Thank you for returning the bike ${booking.bike?.name} (${booking.bikeNumber}). Your rental is now complete!`
        break
    }

    console.log('Sending WhatsApp to:', booking.customerPhone, message)
    console.log('Sending Email to:', booking.customerEmail, message)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    setProcessingBookings(prev => new Set(prev).add(bookingId))
    
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      
      await blink.db.bookings.update(bookingId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      const booking = bookings.find(b => b.id === bookingId)
      if (booking) {
        await sendNotifications(booking, action)
      }

      toast({
        title: "Success",
        description: `Booking ${action === 'approve' ? 'approved' : 'rejected'} and notifications sent!`
      })

      loadBookings()
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} booking.`,
        variant: "destructive"
      })
    } finally {
      setProcessingBookings(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookingId)
        return newSet
      })
    }
  }

  const handleStatusUpdate = async (type: 'delivery' | 'return') => {
    if (!selectedBooking) return

    setProcessingBookings(prev => new Set(prev).add(selectedBooking.id))
    
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }

      if (type === 'delivery') {
        updateData.deliveryStatus = deliveryStatusInput
        if (deliveryStatusInput === 'delivered') {
          updateData.deliveredAt = new Date().toISOString()
        }
        if (bikeNumberInput) {
          updateData.bikeNumber = bikeNumberInput
        }
      } else {
        updateData.returnStatus = returnStatusInput
        if (returnStatusInput === 'returned') {
          updateData.returnedAt = new Date().toISOString()
          updateData.status = 'completed'
        }
      }

      await blink.db.bookings.update(selectedBooking.id, updateData)

      // Send notification if status changed to delivered or returned
      if ((type === 'delivery' && deliveryStatusInput === 'delivered') || 
          (type === 'return' && returnStatusInput === 'returned')) {
        await sendNotifications(selectedBooking, type === 'delivery' ? 'delivered' : 'returned')
      }

      toast({
        title: "Success",
        description: `${type === 'delivery' ? 'Delivery' : 'Return'} status updated successfully!`
      })

      setDialogOpen(false)
      loadBookings()
    } catch (error) {
      console.error(`Error updating ${type} status:`, error)
      toast({
        title: "Error",
        description: `Failed to update ${type} status.`,
        variant: "destructive"
      })
    } finally {
      setProcessingBookings(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedBooking.id)
        return newSet
      })
    }
  }

  const openStatusDialog = (booking: BookingWithBike) => {
    setSelectedBooking(booking)
    setBikeNumberInput(booking.bikeNumber || '')
    setDeliveryStatusInput(booking.deliveryStatus || 'pending')
    setReturnStatusInput(booking.returnStatus || 'not_returned')
    setDialogOpen(true)
  }

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

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'returned':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'not_returned':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'pending':
        return 'Pending'
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

  const pendingBookings = filterBookings('pending')
  const approvedBookings = filterBookings('approved')
  const rejectedBookings = filterBookings('rejected')
  const completedBookings = filterBookings('completed')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
          <p className="text-lg text-gray-600">Review and manage bike rental requests with delivery tracking</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
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
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedBookings.length})</TabsTrigger>
            <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <BookingsList 
              bookings={pendingBookings} 
              getStatusColor={getStatusColor} 
              getDeliveryStatusColor={getDeliveryStatusColor}
              getReturnStatusColor={getReturnStatusColor}
              getStatusText={getStatusText} 
              formatDate={formatDate}
              onBookingAction={handleBookingAction}
              onStatusUpdate={openStatusDialog}
              processingBookings={processingBookings}
              showActions={true}
            />
          </TabsContent>

          <TabsContent value="approved">
            <BookingsList 
              bookings={approvedBookings} 
              getStatusColor={getStatusColor} 
              getDeliveryStatusColor={getDeliveryStatusColor}
              getReturnStatusColor={getReturnStatusColor}
              getStatusText={getStatusText} 
              formatDate={formatDate}
              onBookingAction={handleBookingAction}
              onStatusUpdate={openStatusDialog}
              processingBookings={processingBookings}
              showStatusUpdate={true}
            />
          </TabsContent>

          <TabsContent value="completed">
            <BookingsList 
              bookings={completedBookings} 
              getStatusColor={getStatusColor} 
              getDeliveryStatusColor={getDeliveryStatusColor}
              getReturnStatusColor={getReturnStatusColor}
              getStatusText={getStatusText} 
              formatDate={formatDate}
              onBookingAction={handleBookingAction}
              onStatusUpdate={openStatusDialog}
              processingBookings={processingBookings}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <BookingsList 
              bookings={rejectedBookings} 
              getStatusColor={getStatusColor} 
              getDeliveryStatusColor={getDeliveryStatusColor}
              getReturnStatusColor={getReturnStatusColor}
              getStatusText={getStatusText} 
              formatDate={formatDate}
              onBookingAction={handleBookingAction}
              onStatusUpdate={openStatusDialog}
              processingBookings={processingBookings}
            />
          </TabsContent>

          <TabsContent value="all">
            <BookingsList 
              bookings={bookings} 
              getStatusColor={getStatusColor} 
              getDeliveryStatusColor={getDeliveryStatusColor}
              getReturnStatusColor={getReturnStatusColor}
              getStatusText={getStatusText} 
              formatDate={formatDate}
              onBookingAction={handleBookingAction}
              onStatusUpdate={openStatusDialog}
              processingBookings={processingBookings}
              showStatusUpdate={true}
            />
          </TabsContent>
        </Tabs>

        {/* Status Update Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Booking Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBooking && (
                <>
                  <div>
                    <h4 className="font-medium mb-2">{selectedBooking.bike?.name}</h4>
                    <p className="text-sm text-gray-600">Customer: {selectedBooking.customerName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bikeNumber">Bike Number</Label>
                    <Input
                      id="bikeNumber"
                      value={bikeNumberInput}
                      onChange={(e) => setBikeNumberInput(e.target.value)}
                      placeholder="Enter bike number (e.g., BK001)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryStatus">Delivery Status</Label>
                    <Select value={deliveryStatusInput} onValueChange={setDeliveryStatusInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnStatus">Return Status</Label>
                    <Select value={returnStatusInput} onValueChange={setReturnStatusInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_returned">Not Returned</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleStatusUpdate('delivery')}
                      disabled={processingBookings.has(selectedBooking.id)}
                      className="flex-1"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Update Delivery
                    </Button>
                    <Button 
                      onClick={() => handleStatusUpdate('return')}
                      disabled={processingBookings.has(selectedBooking.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Update Return
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

interface BookingsListProps {
  bookings: BookingWithBike[]
  getStatusColor: (status: string) => string
  getDeliveryStatusColor: (status: string) => string
  getReturnStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  formatDate: (dateString: string) => string
  onBookingAction: (bookingId: string, action: 'approve' | 'reject') => void
  onStatusUpdate: (booking: BookingWithBike) => void
  processingBookings: Set<string>
  showActions?: boolean
  showStatusUpdate?: boolean
}

function BookingsList({ 
  bookings, 
  getStatusColor, 
  getDeliveryStatusColor,
  getReturnStatusColor,
  getStatusText, 
  formatDate, 
  onBookingAction, 
  onStatusUpdate,
  processingBookings,
  showActions = false,
  showStatusUpdate = false
}: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600">No bookings match the current filter.</p>
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
                  {booking.bikeNumber && (
                    <span className="ml-2 inline-flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      {booking.bikeNumber}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
                {booking.deliveryStatus && (
                  <Badge className={getDeliveryStatusColor(booking.deliveryStatus)}>
                    <Truck className="h-3 w-3 mr-1" />
                    {booking.deliveryStatus.replace('_', ' ')}
                  </Badge>
                )}
                {booking.returnStatus && booking.returnStatus !== 'not_returned' && (
                  <Badge className={getReturnStatusColor(booking.returnStatus)}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {booking.returnStatus.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <span className="font-medium">Type:</span> {booking.bookingType === 'instant' ? 'Instant' : 'Pre-Reservation'}
                </div>
                {booking.deliveredAt && (
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Delivered:</span> {formatDate(booking.deliveredAt)}
                  </div>
                )}
                {booking.returnedAt && (
                  <div className="text-sm text-blue-600">
                    <span className="font-medium">Returned:</span> {formatDate(booking.returnedAt)}
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Customer:</span> {booking.customerName}
                </div>
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

              {/* Amount & Actions */}
              <div className="text-right space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  ${booking.totalAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Booked {formatDate(booking.createdAt)}
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  {showActions && booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onBookingAction(booking.id, 'approve')}
                        disabled={processingBookings.has(booking.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {processingBookings.has(booking.id) ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onBookingAction(booking.id, 'reject')}
                        disabled={processingBookings.has(booking.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {(showStatusUpdate || booking.status === 'approved') && booking.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusUpdate(booking)}
                      disabled={processingBookings.has(booking.id)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Status */}
            <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>
                {booking.status === 'pending' 
                  ? 'Awaiting admin action' 
                  : `Customer notified via WhatsApp & Email`}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}