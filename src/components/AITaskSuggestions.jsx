import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, XCircle, Brain, ArrowRight, Edit3 } from 'lucide-react'
import { trackColors, priorityColors } from '../data/tracksData.js'

export default function AITaskSuggestions({ 
  suggestions, 
  tracks, 
  onApplyTasks, 
  onClose,
  isVisible 
}) {
  if (!isVisible || !suggestions) return null

  // Find the current track (same as VoiceProcessingResults)
  const currentTrack = tracks.find(t => t.id === suggestions.trackId)
  
  // Initialize state exactly like VoiceProcessingResults
  const [selectedTasks, setSelectedTasks] = useState(
    (suggestions.extracted_tasks || []).map(() => true)
  )
  const [editedTasks, setEditedTasks] = useState(
    (suggestions.extracted_tasks || []).map(task => ({ 
      ...task,
      // Start with basic track assignment
      suggested_track_id: suggestions.trackId,
      suggested_priority: task.suggested_priority || 'medium'
    }))
  )

  // Use useEffect to update goals after component mounts (like VoiceProcessingResults)
  useEffect(() => {
    if (currentTrack && suggestions.extracted_tasks) {
      console.log('🔄 useEffect: Updating goals after mount')
      
      const updatedTasks = suggestions.extracted_tasks.map((task, index) => {
        const taskTextLower = task.text.toLowerCase()
        
        // Simple direct matching
        let matchedGoalId = null
        
        // Direct project name matching
        if (taskTextLower.includes('railcenter')) {
          const railcenterGoal = currentTrack.goals.find(g => g.name.toLowerCase().includes('railcenter'))
          if (railcenterGoal) {
            matchedGoalId = railcenterGoal.id
            console.log(`✅ Matched Railcenter goal: ${railcenterGoal.name}`)
          }
        }
        
        if (taskTextLower.includes('schiphol')) {
          const schipholGoal = currentTrack.goals.find(g => g.name.toLowerCase().includes('schiphol'))
          if (schipholGoal) {
            matchedGoalId = schipholGoal.id
            console.log(`✅ Matched Schiphol goal: ${schipholGoal.name}`)
          }
        }
        
        if (taskTextLower.includes('om ') || taskTextLower.includes('om workforce')) {
          const omGoal = currentTrack.goals.find(g => g.name.toLowerCase().includes('om '))
          if (omGoal) {
            matchedGoalId = omGoal.id
            console.log(`✅ Matched OM goal: ${omGoal.name}`)
          }
        }
        
        return {
          ...task,
          suggested_track_id: suggestions.trackId,
          suggested_goal_id: matchedGoalId || task.suggested_goal_id,
          suggested_priority: task.suggested_priority || 'medium'
        }
      })
      
      console.log('🎯 Setting updated tasks with goals:', updatedTasks)
      setEditedTasks(updatedTasks)
    }
  }, [currentTrack, suggestions.extracted_tasks, suggestions.trackId])

  const handleTaskSelection = (taskIndex, isSelected) => {
    const newSelected = [...selectedTasks]
    newSelected[taskIndex] = isSelected
    setSelectedTasks(newSelected)
  }

  const updateTaskText = (index, newText) => {
    const newTasks = [...editedTasks]
    newTasks[index].text = newText
    setEditedTasks(newTasks)
  }

  const updateTaskPriority = (index, newPriority) => {
    const newTasks = [...editedTasks]
    newTasks[index].suggested_priority = newPriority
    setEditedTasks(newTasks)
  }

  const updateTaskTrack = (index, trackId) => {
    const newTasks = [...editedTasks]
    newTasks[index].suggested_track_id = trackId
    // Reset goal when track changes
    newTasks[index].suggested_goal_id = ''
    setEditedTasks(newTasks)
  }

  const updateTaskGoal = (index, goalId) => {
    const newTasks = [...editedTasks]
    const selectedTrack = tracks.find(t => t.id === newTasks[index].suggested_track_id)
    const selectedGoal = selectedTrack?.goals.find(g => g.id === goalId)
    newTasks[index].suggested_goal_id = goalId
    newTasks[index].suggested_goal_name = selectedGoal ? selectedGoal.name : 'New Goal'
    setEditedTasks(newTasks)
  }

  const handleApplySelected = () => {
    const tasksToApply = editedTasks.filter((_, index) => selectedTasks[index])
    onApplyTasks(tasksToApply)
  }

  const handleSelectAll = () => {
    const taskCount = suggestions.extracted_tasks?.length || 0
    const allSelected = selectedTasks.every(Boolean)
    setSelectedTasks(new Array(taskCount).fill(!allSelected))
  }

  const selectedTaskCount = selectedTasks.filter(Boolean).length
  const tasks = suggestions.extracted_tasks || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Task Suggestions
            {suggestions.trackName && (
              <Badge variant="outline" className="ml-2">
                {suggestions.trackName}
              </Badge>
            )}
          </CardTitle>
          {suggestions.summary && (
            <Alert>
              <AlertDescription>
                <strong>Summary:</strong> {suggestions.summary}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Task Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Extracted Tasks ({tasks.length})
              </h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTasks.every(Boolean) ? 'Deselect All' : 'Select All'}
                </Button>
                <Badge variant="secondary">
                  {selectedTaskCount} selected
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {tasks.map((task, index) => {
                const isSelected = selectedTasks[index]
                const editedTask = editedTasks[index]
                const taskTrack = tracks.find(t => t.id === editedTask.suggested_track_id)
                const colors = taskTrack ? trackColors[taskTrack.color] : trackColors.gray

                // Debug logging for render
                console.log(`Rendering task ${index}:`, {
                  editedTask,
                  trackValue: editedTask.suggested_track_id,
                  goalValue: editedTask.suggested_goal_id,
                  priorityValue: editedTask.suggested_priority,
                  taskTrack: taskTrack?.name
                })

                return (
                  <Card key={index} className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${colors.border} border`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleTaskSelection(index, checked)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-3">
                          {/* Task Text */}
                          <div>
                            <label className="text-sm font-medium text-gray-600">Task</label>
                            <div className="flex items-center gap-2">
                              <textarea
                                value={editedTask.text}
                                onChange={(e) => updateTaskText(index, e.target.value)}
                                className="flex-1 text-sm font-medium bg-transparent border border-gray-300 rounded p-2 resize-none"
                                rows={1}
                                disabled={!isSelected}
                              />
                            </div>
                          </div>

                          {/* Track and Goal Selection - Simple selects like VoiceProcessingResults */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`track-select-${index}`} className="text-sm font-medium text-gray-600">Track</label>
                              <select
                                id={`track-select-${index}`}
                                name={`track-select-${index}`}
                                value={editedTask.suggested_track_id || ''}
                                onChange={(e) => updateTaskTrack(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                                disabled={!isSelected}
                              >
                                <option value="">Select track...</option>
                                {tracks.map(track => (
                                  <option key={track.id} value={track.id}>
                                    {track.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label htmlFor={`goal-select-${index}`} className="text-sm font-medium text-gray-600">Goal</label>
                              <select
                                id={`goal-select-${index}`}
                                name={`goal-select-${index}`}
                                value={editedTask.suggested_goal_id || 'new-goal'}
                                onChange={(e) => updateTaskGoal(index, e.target.value)}
                                disabled={!isSelected || !editedTask.suggested_track_id}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm disabled:bg-gray-100"
                              >
                                <option value="new-goal">Create New Goal</option>
                                {taskTrack?.goals.map(goal => (
                                  <option key={goal.id} value={goal.id}>
                                    {goal.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Priority Selection - Simple select like VoiceProcessingResults */}
                          <div>
                            <label htmlFor={`priority-select-${index}`} className="text-sm font-medium text-gray-600">Priority</label>
                            <select
                              id={`priority-select-${index}`}
                              name={`priority-select-${index}`}
                              value={editedTask.suggested_priority || 'medium'}
                              onChange={(e) => updateTaskPriority(index, e.target.value)}
                              className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${priorityColors[editedTask.suggested_priority]}`}
                              disabled={!isSelected}
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>

                          {/* AI Reasoning */}
                          {task.reasoning && (
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              <strong>AI Reasoning:</strong> {task.reasoning}
                            </div>
                          )}

                          {/* Current Assignment Preview */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ArrowRight className="h-3 w-3" />
                            <span>Will be added to:</span>
                            <Badge variant="outline" className={colors.text}>
                              {taskTrack?.name || 'Select Track'}
                            </Badge>
                            {editedTask.suggested_goal_id && editedTask.suggested_goal_id !== 'new-goal' && (
                              <>
                                <span>→</span>
                                <Badge variant="outline">
                                  {taskTrack?.goals.find(g => g.id === editedTask.suggested_goal_id)?.name}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleApplySelected}
                disabled={selectedTaskCount === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply {selectedTaskCount} Selected Task{selectedTaskCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

