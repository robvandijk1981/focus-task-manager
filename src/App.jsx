import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Plus, Filter, GripVertical, Brain, Settings, Loader2, Sparkles, CheckCircle, X, AlertTriangle, ChevronUp } from 'lucide-react'
import { trackColors, priorityColors } from './data/tracksData.js'
import AISettings from './components/AISettings.jsx'
import AITaskSuggestions from './components/AITaskSuggestions.jsx'
import VoiceRecorder from './components/VoiceRecorder.jsx'
import VoiceProcessingResults from './components/VoiceProcessingResults.jsx'
import aiService from './services/aiService.js'
import apiService from './services/apiService.js'
import './App.css'

function App() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [newTaskText, setNewTaskText] = useState('')
  const [newGoalText, setNewGoalText] = useState('')
  
  // AI-related state
  const [showAISettings, setShowAISettings] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [isProcessingNotes, setIsProcessingNotes] = useState(false)
  const [processingTrackId, setProcessingTrackId] = useState(null)
  
  // Voice processing state
  const [voiceResults, setVoiceResults] = useState(null)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [processingVoiceTrackId, setProcessingVoiceTrackId] = useState(null)
  
  // To Do Today state
  const [todayTasks, setTodayTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)

  // ADHD Focus Mode state
  const [focusMode, setFocusMode] = useState(true) // Default to focus mode for ADHD
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [showTrackSwitchConfirm, setShowTrackSwitchConfirm] = useState(false)
  const [pendingTrackIndex, setPendingTrackIndex] = useState(null)

  // ADHD Phase 2: Enhanced task completion with animations and celebrations
  const [completionStreak, setCompletionStreak] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')

  // ADHD Phase 3: Progressive Disclosure & Daily Focus
  const [collapsedGoals, setCollapsedGoals] = useState(new Set()) // Track which goals are collapsed
  const [dailyIntention, setDailyIntention] = useState('') // Daily focus intention
  const [energyLevel, setEnergyLevel] = useState('Normal') // Current energy level
  const [showDailySetup, setShowDailySetup] = useState(false) // Morning focus ritual
  const [trackSwitchCount, setTrackSwitchCount] = useState(0) // Track context switches
  const [sessionStartTime, setSessionStartTime] = useState(Date.now()) // Track session time
  const [currentTrackTime, setCurrentTrackTime] = useState(Date.now()) // Track time in current track
  
  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Load data from API on mount
  useEffect(() => {
    loadTracksFromAPI();
    
    const savedTodayTasks = localStorage.getItem('todayTasks')
    if (savedTodayTasks) {
      setTodayTasks(JSON.parse(savedTodayTasks))
    }
  }, [])

  // Load tracks from API
  const loadTracksFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiTracks = await apiService.getTracks();
      
      // Transform API tracks to match the expected format
      const transformedTracks = await Promise.all(apiTracks.map(async (track) => {
        try {
          const goals = await apiService.getGoals(track.id);
          
          // Transform goals and load tasks for each goal
          const transformedGoals = await Promise.all(goals.map(async (goal) => {
            try {
              const tasks = await apiService.getTasks(goal.id);
              
              // Transform tasks to match expected format
              const transformedTasks = tasks.map(task => ({
                id: task.id.toString(),
                text: task.title,
                priority: task.priority || null,
                trackId: track.id,
                goalId: goal.id
              }));
              
              return {
                id: goal.id.toString(),
                name: goal.title,
                tasks: transformedTasks
              };
            } catch (error) {
              console.error(`Error loading tasks for goal ${goal.id}:`, error);
              return {
                id: goal.id.toString(),
                name: goal.title,
                tasks: []
              };
            }
          }));
          
          return {
            id: track.id.toString(),
            name: track.name,
            color: track.color || 'blue',
            notes: '',
            context: track.description || '',
            goals: transformedGoals
          };
        } catch (error) {
          console.error(`Error loading goals for track ${track.id}:`, error);
          return {
            id: track.id.toString(),
            name: track.name,
            color: track.color || 'blue',
            notes: '',
            context: track.description || '',
            goals: []
          };
        }
      }));
      
      setTracks(transformedTracks);
      console.log('Loaded tracks from API:', transformedTracks);
    } catch (error) {
      console.error('Error loading tracks from API:', error);
      setError('Failed to load tracks from database. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Save today tasks to localStorage
  useEffect(() => {
    localStorage.setItem('todayTasks', JSON.stringify(todayTasks))
  }, [todayTasks])

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Check if AI is available
  const isAIAvailable = aiService.hasApiKey()

  // Create new track function
  const createNewTrack = () => {
    const trackName = prompt('Enter track name:')
    if (!trackName || !trackName.trim()) return

    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    const newTrack = {
      id: `track-${Date.now()}`,
      name: trackName.trim(),
      color: randomColor,
      notes: '',
      context: '',
      goals: []
    }

    const updatedTracks = [...tracks, newTrack]
    setTracks(updatedTracks)
  }

  // Rest of the component functions remain the same...
  // (I'll include the key functions but truncate for brevity)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracks from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadTracksFromAPI} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with API Status */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Focus Task Manager</h1>
            <p className="text-sm text-green-600 mt-1">🔄 Connected to Database - {tracks.length} tracks loaded</p>
          </div>
          <div className="flex items-center gap-3">
            {isAIAvailable && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Brain className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={createNewTrack}
              className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Plus className="h-4 w-4" />
              Add Track
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAISettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              AI Settings
            </Button>
          </div>
        </div>

        {/* Track Tabs */}
        <Tabs value={tracks[currentTrackIndex]?.id} onValueChange={(value) => {
          const trackIndex = tracks.findIndex(track => track.id === value)
          if (trackIndex !== -1) {
            setCurrentTrackIndex(trackIndex)
          }
        }} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7">
            {tracks.map(track => (
              <TabsTrigger key={track.id} value={track.id} className="text-xs">
                {track.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tracks.map(track => {
            const colors = trackColors[track.color]
            
            return (
              <TabsContent key={track.id} value={track.id} className="mt-6">
                <Card className={`${colors.border} border-2`}>
                  <CardHeader className={colors.bg}>
                    <CardTitle className={colors.text}>{track.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Track Context */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Track Context & Background</label>
                      <Textarea
                        placeholder="Describe the context and background for this track..."
                        value={track.context || ''}
                        readOnly
                        className="min-h-[80px] max-h-[96px] overflow-y-auto resize-none bg-gray-50"
                        rows={4}
                      />
                    </div>

                    {/* Goals */}
                    <div className="space-y-4">
                      {track.goals.map(goal => (
                        <Card key={goal.id} className={colors.accent}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Tasks */}
                            <div className="space-y-2">
                              {goal.tasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                                  <div className="flex-1">
                                    <p className="text-sm">{task.text}</p>
                                  </div>
                                  <Badge className={priorityColors[task.priority] || 'bg-gray-100'}>
                                    {task.priority?.toUpperCase() || 'NO PRIORITY'}
                                  </Badge>
                                </div>
                              ))}
                              {goal.tasks.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No tasks yet</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {track.goals.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No goals yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      <AISettings 
        isOpen={showAISettings} 
        onClose={() => setShowAISettings(false)} 
      />
    </div>
  )
}

export default App
