import { Link, useLocation } from 'react-router-dom'
import { Bike, User, LogOut, Settings } from 'lucide-react'
import { blink } from '../blink/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'

interface HeaderProps {
  user: {
    id: string
    email: string
    displayName?: string
  }
  isAdmin: boolean
}

export default function Header({ user, isAdmin }: HeaderProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Bike className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BikeRide</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/browse') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Browse Bikes
            </Link>
            <Link
              to="/my-rentals"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/my-rentals') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              My Rentals
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin') 
                    ? 'text-amber-600 bg-amber-50' 
                    : 'text-gray-700 hover:text-amber-600 hover:bg-gray-50'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:block">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}