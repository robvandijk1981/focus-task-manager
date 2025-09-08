import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import DataMigration from './components/DataMigration'
import App from './App'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Loader2, LogOut, User, Cloud, Wifi, WifiOff } from 'lucide-react'
import apiService from './services/apiService'

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Focus Task Manager</h2>
          <p className="text-gray-600 text-center">
            Setting up your personalized workspace...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Connection status component
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check API status
    const checkApiStatus = async () => {
      try {
        await apiService.healthCheck()
        setApiStatus('connected')
      } catch (error) {
        setApiStatus('disconnected')
      }
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!isOnline || apiStatus === 'disconnected') {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          {!isOnline 
            ? "You're offline. Some features may not work properly."
            : "Cannot connect to cloud database. Your changes will be saved locally."
          }
        </AlertDescription>
      </Alert>
    )
  }

  if (apiStatus === 'connected') {
    return null // Don't show any message when connected
  }

  return null
}

// User header component
function UserHeader() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
            </p>
            <p className="text-sm text-gray-500">Focus Task Manager</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}

// Main authenticated app component
function AuthenticatedApp() {
  const { user, loading } = useAuth()
  const [showMigration, setShowMigration] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(true) // Always set to true to skip migration
  const [migrationChecked, setMigrationChecked] = useState(true) // Always set to true to skip migration

  // Migration logic disabled - always skip migration dialog
  useEffect(() => {
    if (user && !migrationChecked) {
      // Skip migration entirely - go straight to the app
      setMigrationComplete(true)
      setMigrationChecked(true)
    }
  }, [user, migrationChecked])

  const handleMigrationComplete = (migratedTracks) => {
    setShowMigration(false)
    setMigrationComplete(true)
    
    // Mark migration as completed for this user
    const migrationKey = `migration_completed_${user.id}`
    localStorage.setItem(migrationKey, 'true')
    
    // If we have migrated tracks, we can pass them to the main app
    if (migratedTracks) {
      // The main App component will load data from the API
      console.log('Migration completed with tracks:', migratedTracks.length)
    }
  }

  const skipMigration = () => {
    setShowMigration(false)
    setMigrationComplete(true)
    
    // Mark migration as completed for this user (even if skipped)
    const migrationKey = `migration_completed_${user.id}`
    localStorage.setItem(migrationKey, 'true')
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <ConnectionStatus />
      
      {showMigration && (
        <DataMigration 
          onMigrationComplete={handleMigrationComplete}
          onSkip={skipMigration}
        />
      )}
      
      <App />
    </div>
  )
}

// Unauthenticated app component
function UnauthenticatedApp() {
  const [showAuth, setShowAuth] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Card className="w-full max-w-lg mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">
              🎯 Focus Task Manager
            </CardTitle>
            <p className="text-gray-600 text-lg">
              The task manager built for focused productivity
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Focus Mode</h3>
                <p className="text-blue-700">Single-track view to reduce overwhelm</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">⚡ Energy Tracking</h3>
                <p className="text-green-700">Match tasks to your energy levels</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">🎉 Celebrations</h3>
                <p className="text-purple-700">Dopamine rewards for completed tasks</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">☁️ Cloud Sync</h3>
                <p className="text-orange-700">Access your data anywhere, anytime</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAuth(true)} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </div>
  )
}

// Main app wrapper
function AppWrapper() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />
}

// Root component with auth provider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  )
}

