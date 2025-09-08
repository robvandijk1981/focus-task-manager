import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Plus, Filter, GripVertical, Brain, Settings, Loader2, Sparkles, CheckCircle, X, AlertTriangle, ChevronUp, Edit, Trash2, Target, ListTodo } from 'lucide-react'
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
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  
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
  
  // Form states
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackColor, setNewTrackColor] = useState('blue')
  const [newTrackContext, setNewTrackContext] = useState('')
  const [newGoalName, setNewGoalName] = useState('')
  const [newTaskText, setNewTaskText] = useState('')
  const [editingGoal, setEditingGoal] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  
  // Check if AI is available
  const isAIAvailable = aiService.isAvailable()

  // Load data from API on mount
  useEffect(() => {
    loadTracksFromAPI();
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
          const goalsWithTasks = await Promise.all(goals.map(async (goal) => {
            const tasks = await apiService.getTasks(goal.id);
            return {
              ...goal,
              tasks: tasks || []
            };
          }));
          
          return {
            ...track,
            goals: goalsWithTasks || []
          };
        } catch (error) {
          console.error(`Error loading goals for track ${track.id}:`, error);
          return {
            ...track,
            goals: []
          };
        }
      }));
      
      setTracks(transformedTracks);
      
      // Set first track as selected if none selected
      if (transformedTracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(transformedTracks[0].id);
      }
      
    } catch (error) {
      console.error('Error loading tracks:', error);
      setError('Failed to load tracks from database');
    } finally {
      setLoading(false);
    }
  };

  // Create new track
  const createTrack = async () => {
    if (!newTrackName.trim()) return;
    
    try {
      const newTrack = {
        name: newTrackName,
        color: newTrackColor,
        context: newTrackContext,
        goals: []
      };
      
      const createdTrack = await apiService.createTrack(newTrack);
      setTracks([...tracks, createdTrack]);
      setNewTrackName('');
      setNewTrackColor('blue');
      setNewTrackContext('');
      setSelectedTrackId(createdTrack.id);
    } catch (error) {
      console.error('Error creating track:', error);
      setError('Failed to create track');
    }
  };

  // Create new goal
  const createGoal = async (trackId) => {
    if (!newGoalName.trim()) return;
    
    try {
      const newGoal = {
        name: newGoalName,
        track_id: trackId,
        tasks: []
      };
      
      const createdGoal = await apiService.createGoal(newGoal);
      
      // Update tracks state
      setTracks(tracks.map(track => 
        track.id === trackId 
          ? { ...track, goals: [...track.goals, createdGoal] }
          : track
      ));
      
      setNewGoalName('');
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal');
    }
  };

  // Create new task
  const createTask = async (goalId, trackId) => {
    if (!newTaskText.trim()) return;
    
    try {
      const newTask = {
        text: newTaskText,
        goal_id: goalId,
        priority: 'medium'
      };
      
      const createdTask = await apiService.createTask(newTask);
      
      // Update tracks state
      setTracks(tracks.map(track => 
        track.id === trackId 
          ? {
              ...track,
              goals: track.goals.map(goal =>
                goal.id === goalId
                  ? { ...goal, tasks: [...goal.tasks, createdTask] }
                  : goal
              )
            }
          : track
      ));
      
      setNewTaskText('');
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  // Update task
  const updateTask = async (taskId, updates, trackId, goalId) => {
    try {
      const updatedTask = await apiService.updateTask(taskId, updates);
      
      // Update tracks state
      setTracks(tracks.map(track => 
        track.id === trackId 
          ? {
              ...track,
              goals: track.goals.map(goal =>
                goal.id === goalId
                  ? {
                      ...goal,
                      tasks: goal.tasks.map(task =>
                        task.id === taskId ? { ...task, ...updatedTask } : task
                      )
                    }
                  : goal
              )
            }
          : track
      ));
      
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  // Delete task
  const deleteTask = async (taskId, trackId, goalId) => {
    try {
      await apiService.deleteTask(taskId);
      
      // Update tracks state
      setTracks(tracks.map(track => 
        track.id === trackId 
          ? {
              ...track,
              goals: track.goals.map(goal =>
                goal.id === goalId
                  ? {
                      ...goal,
                      tasks: goal.tasks.filter(task => task.id !== taskId)
                    }
                  : goal
              )
            }
          : track
      ));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  // Get selected track
  const selectedTrack = tracks.find(track => track.id === selectedTrackId);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Focus Task Manager</h1>
            <p className="text-sm text-green-600 mt-1">🔄 Connected to Database - {tracks.length} tracks loaded</p>
          </div>
          <div className="flex items-center gap-3">
            {isAIAvailable && (
              <Button
                onClick={() => setShowAISettings(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Settings
              </Button>
            )}
            <Button
              onClick={() => setShowAISuggestions(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Ready
            </Button>
          </div>
        </div>

        {/* Track Selection */}
        <div className="mb-6">
          <Tabs value={selectedTrackId} onValueChange={setSelectedTrackId}>
            <TabsList className="grid w-full grid-cols-7">
              {tracks.map((track) => {
                const colors = trackColors[track.color] || trackColors.blue;
                return (
                  <TabsTrigger 
                    key={track.id} 
                    value={track.id}
                    className={`${colors.bg} ${colors.text} border-2 ${colors.border}`}
                  >
                    {track.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Track Content */}
            {tracks.map((track) => {
              const colors = trackColors[track.color] || trackColors.blue;
              
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
                          onChange={(e) => {
                            // Update track context
                            setTracks(tracks.map(t => 
                              t.id === track.id ? { ...t, context: e.target.value } : t
                            ));
                          }}
                          className="min-h-[100px]"
                        />
                      </div>

                      {/* Goals Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Goals
                          </h3>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New goal name..."
                              value={newGoalName}
                              onChange={(e) => setNewGoalName(e.target.value)}
                              className="w-64"
                            />
                            <Button
                              onClick={() => createGoal(track.id)}
                              disabled={!newGoalName.trim()}
                              className={colors.button}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Goals List */}
                        <div className="space-y-4">
                          {track.goals.map((goal) => (
                            <Card key={goal.id} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                  <span>{goal.name}</span>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingGoal(goal.id)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {/* Tasks Section */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                      <ListTodo className="h-4 w-4" />
                                      Tasks
                                    </h4>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="New task..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        className="w-48"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => createTask(goal.id, track.id)}
                                        disabled={!newTaskText.trim()}
                                        className={colors.button}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Tasks List */}
                                  <div className="space-y-2">
                                    {goal.tasks.map((task) => (
                                      <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                        <input
                                          type="checkbox"
                                          checked={task.completed || false}
                                          onChange={(e) => updateTask(task.id, { completed: e.target.checked }, track.id, goal.id)}
                                          className="rounded"
                                        />
                                        {editingTask === task.id ? (
                                          <div className="flex-1 flex gap-2">
                                            <Input
                                              value={task.text}
                                              onChange={(e) => {
                                                setTracks(tracks.map(t => 
                                                  t.id === track.id 
                                                    ? {
                                                        ...t,
                                                        goals: t.goals.map(g =>
                                                          g.id === goal.id
                                                            ? {
                                                                ...g,
                                                                tasks: g.tasks.map(tsk =>
                                                                  tsk.id === task.id ? { ...tsk, text: e.target.value } : tsk
                                                                )
                                                              }
                                                            : g
                                                        )
                                                      }
                                                    : t
                                                ));
                                              }}
                                              className="flex-1"
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() => updateTask(task.id, { text: task.text }, track.id, goal.id)}
                                              className={colors.button}
                                            >
                                              <CheckCircle className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setEditingTask(null)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                              {task.text}
                                            </span>
                                            <div className="flex gap-1">
                                              <Select
                                                value={task.priority || 'medium'}
                                                onValueChange={(value) => updateTask(task.id, { priority: value }, track.id, goal.id)}
                                              >
                                                <SelectTrigger className="w-20 h-6 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="high">High</SelectItem>
                                                  <SelectItem value="medium">Med</SelectItem>
                                                  <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingTask(task.id)}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteTask(task.id, track.id, goal.id)}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {goal.tasks.length === 0 && (
                                      <p className="text-gray-500 text-sm italic">No tasks yet</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {track.goals.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No goals yet. Create your first goal above!</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Add New Track */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add New Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Track name..."
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="flex-1"
              />
              <Select value={newTrackColor} onValueChange={setNewTrackColor}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="teal">Teal</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={createTrack}
                disabled={!newTrackName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Track
              </Button>
            </div>
            <Textarea
              placeholder="Track context and background..."
              value={newTrackContext}
              onChange={(e) => setNewTrackContext(e.target.value)}
              className="mt-3"
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettings
          onClose={() => setShowAISettings(false)}
        />
      )}

      {/* AI Suggestions Modal */}
      {showAISuggestions && (
        <AITaskSuggestions
          onClose={() => setShowAISuggestions(false)}
          onApplySuggestions={(suggestions) => {
            setAiSuggestions(suggestions);
            setShowAISuggestions(false);
          }}
        />
      )}
    </div>
  );
}

export default App;