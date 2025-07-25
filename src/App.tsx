import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'

// Pages
import HomePage from './pages/HomePage'
import BrowseBikes from './pages/BrowseBikes'
import BookingPage from './pages/BookingPage'
import MyRentals from './pages/MyRentals'
import AdminDashboard from './pages/AdminDashboard'
import BikeManagement from './pages/BikeManagement'
import BookingManagement from './pages/BookingManagement'

// Components
import Header from './components/Header'
import LoadingScreen from './components/LoadingScreen'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdminStatus = async (userId: string) => {
    try {
      const adminUsers = await blink.db.adminUsers.list({
        where: { userId: userId }
      })
      setIsAdmin(adminUsers.length > 0)
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      // Check if user is admin
      if (state.user) {
        checkAdminStatus(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to BikeRide</h1>
          <p className="text-lg text-gray-600 mb-8">Please sign in to continue</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} isAdmin={isAdmin} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowseBikes />} />
            <Route path="/booking/:bikeId" element={<BookingPage />} />
            <Route path="/my-rentals" element={<MyRentals user={user} />} />
            {isAdmin && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/bikes" element={<BikeManagement />} />
                <Route path="/admin/bookings" element={<BookingManagement />} />
              </>
            )}
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App