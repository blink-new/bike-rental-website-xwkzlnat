import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { useToast } from '../hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'

interface Bike {
  id: string
  name: string
  type: string
  description: string
  hourlyRate: number
  dailyRate: number
  imageUrl: string
  isAvailable: number
  createdAt: string
  updatedAt: string
}

export default function BikeManagement() {
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBike, setEditingBike] = useState<Bike | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    hourlyRate: '',
    dailyRate: '',
    imageUrl: '',
    bikeNumber: '',
    isAvailable: true
  })

  const bikeTypes = ['Mountain', 'City', 'Road', 'Electric', 'Hybrid', 'Tandem', 'BMX', 'Cruiser']

  const loadBikes = useCallback(async () => {
    try {
      const allBikes = await blink.db.bikes.list({
        orderBy: { createdAt: 'desc' }
      })
      setBikes(allBikes)
    } catch (error) {
      console.error('Error loading bikes:', error)
      toast({
        title: "Error",
        description: "Failed to load bikes.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadBikes()
  }, [loadBikes])

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      hourlyRate: '',
      dailyRate: '',
      imageUrl: '',
      bikeNumber: '',
      isAvailable: true
    })
  }

  const handleAddBike = async () => {
    try {
      const bikeId = `bike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.bikes.create({
        id: bikeId,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        hourlyRate: parseFloat(formData.hourlyRate),
        dailyRate: parseFloat(formData.dailyRate),
        imageUrl: formData.imageUrl,
        bikeNumber: formData.bikeNumber,
        isAvailable: formData.isAvailable ? 1 : 0
      })

      toast({
        title: "Success",
        description: "Bike added successfully!"
      })

      resetForm()
      setIsAddDialogOpen(false)
      loadBikes()
    } catch (error) {
      console.error('Error adding bike:', error)
      toast({
        title: "Error",
        description: "Failed to add bike.",
        variant: "destructive"
      })
    }
  }

  const handleEditBike = (bike: Bike) => {
    setEditingBike(bike)
    setFormData({
      name: bike.name,
      type: bike.type,
      description: bike.description,
      hourlyRate: bike.hourlyRate.toString(),
      dailyRate: bike.dailyRate.toString(),
      imageUrl: bike.imageUrl,
      bikeNumber: (bike as any).bikeNumber || '',
      isAvailable: Number(bike.isAvailable) > 0
    })
  }

  const handleUpdateBike = async () => {
    if (!editingBike) return

    try {
      await blink.db.bikes.update(editingBike.id, {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        hourlyRate: parseFloat(formData.hourlyRate),
        dailyRate: parseFloat(formData.dailyRate),
        imageUrl: formData.imageUrl,
        bikeNumber: formData.bikeNumber,
        isAvailable: formData.isAvailable ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: "Bike updated successfully!"
      })

      setEditingBike(null)
      resetForm()
      loadBikes()
    } catch (error) {
      console.error('Error updating bike:', error)
      toast({
        title: "Error",
        description: "Failed to update bike.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBike = async (bikeId: string) => {
    if (!confirm('Are you sure you want to delete this bike?')) return

    try {
      await blink.db.bikes.delete(bikeId)
      
      toast({
        title: "Success",
        description: "Bike deleted successfully!"
      })

      loadBikes()
    } catch (error) {
      console.error('Error deleting bike:', error)
      toast({
        title: "Error",
        description: "Failed to delete bike.",
        variant: "destructive"
      })
    }
  }

  const BikeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Bike Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter bike name"
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select bike type" />
          </SelectTrigger>
          <SelectContent>
            {bikeTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter bike description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="dailyRate">Daily Rate ($)</Label>
          <Input
            id="dailyRate"
            type="number"
            step="0.01"
            value={formData.dailyRate}
            onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/bike-image.jpg"
        />
      </div>

      <div>
        <Label htmlFor="bikeNumber">Bike Number</Label>
        <Input
          id="bikeNumber"
          value={formData.bikeNumber}
          onChange={(e) => setFormData({ ...formData, bikeNumber: e.target.value })}
          placeholder="e.g., BK001, MT-001, etc."
        />
        <p className="text-sm text-gray-500 mt-1">Unique identifier for this specific bike</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isAvailable"
          checked={formData.isAvailable}
          onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
        />
        <Label htmlFor="isAvailable">Available for rent</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          onClick={isEdit ? handleUpdateBike : handleAddBike}
          className="flex-1"
        >
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? 'Update Bike' : 'Add Bike'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setEditingBike(null)
            } else {
              setIsAddDialogOpen(false)
            }
            resetForm()
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bikes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bike Management</h1>
            <p className="text-lg text-gray-600">Add, edit, and manage your bike inventory</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Bike
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Bike</DialogTitle>
              </DialogHeader>
              <BikeForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Bikes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bikes.map((bike) => (
            <Card key={bike.id} className="hover:shadow-lg transition-shadow">
              {editingBike?.id === bike.id ? (
                <CardContent className="p-6">
                  <BikeForm isEdit />
                </CardContent>
              ) : (
                <>
                  <div className="relative">
                    <img 
                      src={bike.imageUrl} 
                      alt={bike.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {bike.type}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Number(bike.isAvailable) > 0 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {Number(bike.isAvailable) > 0 ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{bike.name}</h3>
                    {(bike as any).bikeNumber && (
                      <p className="text-sm text-blue-600 font-medium mb-2">#{(bike as any).bikeNumber}</p>
                    )}
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{bike.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-lg font-bold text-blue-600">${bike.hourlyRate}/hr</div>
                        <div className="text-sm text-gray-600">${bike.dailyRate}/day</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditBike(bike)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteBike(bike.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {bikes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bikes found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first bike to the inventory</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Bike
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}