import { Bike } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <Bike className="h-12 w-12 text-blue-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">BikeRide</h1>
        <p className="text-gray-600">Loading your adventure...</p>
      </div>
    </div>
  )
}