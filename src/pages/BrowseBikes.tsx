import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Star } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

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

export default function BrowseBikes() {
  const [bikes, setBikes] = useState<Bike[]>([])
  const [filteredBikes, setFilteredBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const loadBikes = async () => {
    try {
      const allBikes = await blink.db.bikes.list({
        where: { isAvailable: "1" }
      })
      setBikes(allBikes)
      setFilteredBikes(allBikes)
    } catch (error) {
      console.error('Error loading bikes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBikes()
  }, [])

  useEffect(() => {
    let filtered = bikes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bike => 
        bike.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bike.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(bike => bike.type.toLowerCase() === selectedType.toLowerCase())
    }

    // Sort bikes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.hourlyRate - b.hourlyRate
        case 'price-high':
          return b.hourlyRate - a.hourlyRate
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredBikes(filtered)
  }, [bikes, searchTerm, selectedType, sortBy])

  const bikeTypes = [...new Set(bikes.map(bike => bike.type))]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Bikes</h1>
          <p className="text-lg text-gray-600">Find the perfect bike for your adventure</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bikes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bikeTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              {filteredBikes.length} bike{filteredBikes.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Bikes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBikes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bikes found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map((bike, index) => (
              <Card key={bike.id} className="group hover:shadow-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={bike.imageUrl} 
                    alt={bike.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {bike.type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Available
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {bike.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">{bike.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-blue-600">${bike.hourlyRate}</span>
                        <span className="text-gray-500 text-sm">/hour</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ${bike.dailyRate}/day
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">4.8</span>
                    </div>
                  </div>
                  
                  <Link to={`/booking/${bike.id}`}>
                    <Button className="w-full group-hover:bg-blue-700 transition-colors">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}