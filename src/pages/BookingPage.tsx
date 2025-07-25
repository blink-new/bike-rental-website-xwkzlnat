import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Phone, Mail, CreditCard, ArrowLeft } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { useToast } from '../hooks/use-toast'

interface Bike {
  id: string
  name: string
  type: string
  description: string
  hourlyRate: number
  dailyRate: number
  imageUrl: string
  isAvailable: number
}

export default function BookingPage() {
  const { bikeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [bike, setBike] = useState<Bike | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Booking form state
  const [bookingType, setBookingType] = useState<'instant' | 'pre_reservation'>('instant')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(1)
  const [durationType, setDurationType] = useState<'hours' | 'days'>('hours')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const loadBike = useCallback(async () => {
    if (!bikeId) return
    
    try {
      const bikes = await blink.db.bikes.list({
        where: { id: bikeId }
      })
      
      if (bikes.length === 0) {
        toast({
          title: "Bike not found",
          description: "The requested bike could not be found.",
          variant: "destructive"
        })
        navigate('/browse')
        return
      }
      
      setBike(bikes[0])
    } catch (error) {
      console.error('Error loading bike:', error)
      toast({
        title: "Error",
        description: "Failed to load bike details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [bikeId, toast, navigate])

  const loadUser = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
      setCustomerEmail(userData.email)
      setCustomerName(userData.displayName || '')
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  useEffect(() => {
    loadBike()
    loadUser()
  }, [loadBike])

  // Set default start date and time for instant booking
  useEffect(() => {
    if (bookingType === 'instant') {
      const now = new Date()
      setStartDate(now.toISOString().split('T')[0])
      setStartTime(now.toTimeString().slice(0, 5))
    }
  }, [bookingType])

  const calculateTotal = () => {
    if (!bike) return 0
    
    const rate = durationType === 'hours' ? bike.hourlyRate : bike.dailyRate
    return rate * duration
  }

  const calculateEndDateTime = () => {
    if (!startDate || !startTime) return null
    
    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(start)
    
    if (durationType === 'hours') {
      end.setHours(end.getHours() + duration)
    } else {
      end.setDate(end.getDate() + duration)
    }
    
    return end
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bike || !user) return
    
    setSubmitting(true)
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = calculateEndDateTime()
      
      if (!endDateTime) {
        throw new Error('Invalid date/time selection')
      }
      
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.bookings.create({
        id: bookingId,
        userId: user.id,
        bikeId: bike.id,
        bookingType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        totalAmount: calculateTotal(),
        status: bookingType === 'instant' ? 'approved' : 'pending',
        customerName,
        customerEmail,
        customerPhone,
        notes
      })
      
      toast({
        title: "Booking submitted!",
        description: bookingType === 'instant' 
          ? "Your bike is ready for pickup!" 
          : "Your booking request has been submitted for approval."
      })
      
      navigate('/my-rentals')
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: "Booking failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bike details...</p>
        </div>
      </div>
    )
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bike not found</h2>
          <Button onClick={() => navigate('/browse')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/browse')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book Your Bike</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bike Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bike Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <img 
                  src={bike.imageUrl} 
                  alt={bike.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-semibold">{bike.name}</h3>
                  <p className="text-blue-600 font-medium">{bike.type}</p>
                  <p className="text-gray-600 mt-2">{bike.description}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">${bike.hourlyRate}</span>
                    <span className="text-gray-500">/hour</span>
                  </div>
                  <div>
                    <span className="text-xl font-semibold text-gray-700">${bike.dailyRate}</span>
                    <span className="text-gray-500">/day</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Booking Type */}
                <div>
                  <Label className="text-base font-medium">Booking Type</Label>
                  <RadioGroup 
                    value={bookingType} 
                    onValueChange={(value: 'instant' | 'pre_reservation') => setBookingType(value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="instant" id="instant" />
                      <Label htmlFor="instant">Instant Booking (Available Now)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pre_reservation" id="pre_reservation" />
                      <Label htmlFor="pre_reservation">Pre-Reservation (Future Date)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-base font-medium">Rental Duration</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <RadioGroup 
                      value={durationType} 
                      onValueChange={(value: 'hours' | 'days') => setDurationType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hours" id="hours" />
                        <Label htmlFor="hours">Hours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="days" id="days" />
                        <Label htmlFor="days">Days</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Contact Information</h4>
                  <div>
                    <Label htmlFor="customerName">
                      <User className="inline h-4 w-4 mr-1" />
                      Full Name
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Special Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{duration} {durationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span>${durationType === 'hours' ? bike.hourlyRate : bike.dailyRate}/{durationType.slice(0, -1)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {submitting ? 'Processing...' : 
                   bookingType === 'instant' ? 'Book Now' : 'Submit Reservation Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}