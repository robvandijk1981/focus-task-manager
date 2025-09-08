import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { CheckCircle, XCircle, Mic, Edit3 } from 'lucide-react'
import { priorityColors } from '../data/tracksData.js'

const VoiceProcessingResults = ({ results, tracks, onApplyResults, onClose, isVisible }) => {
  // Don't render if not visible or no results
  if (!isVisible || !results) {
    return null
  }

  const currentTrack = tracks.find(t => t.id === results.trackId)
  
  const [selectedTasks, setSelectedTasks] = useState(
    (results.tasks || []).map(() => true)
  )
  const [includeContext, setIncludeContext] = useState(!!results.context_update)
  const [editedTasks, setEditedTasks] = useState(
    (results.tasks || []).map(task => ({ 
      ...task,
      // Ensure we have the trackId for proper assignment
      suggested_track_id: results.trackId
    }))
  )
  const [editedContext, setEditedContext] = useState(results.context_update || '')

  const handleApply = () => {
    onApplyResults({
      trackId: results.trackId,
      contextUpdate: includeContext ? editedContext : null,
      extractedTasks: editedTasks.filter((_, index) => selectedTasks[index])
    })
  }

  const toggleTask = (index) => {
    const newSelected = [...selectedTasks]
    newSelected[index] = !newSelected[index]
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

  const updateTaskGoal = (index, goalId) => {
    const newTasks = [...editedTasks]
    const selectedGoal = currentTrack.goals.find(g => g.id === goalId)
    newTasks[index].suggested_goal_id = goalId
    newTasks[index].suggested_goal_name = selectedGoal ? selectedGoal.name : 'New Goal'
    setEditedTasks(newTasks)
  }

  const selectedTaskCount = selectedTasks.filter(Boolean).length
  const hasChanges = includeContext || selectedTaskCount > 0
  const tasks = results.tasks || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="border-green-200 bg-green-50 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Mic className="h-5 w-5" />
            Voice Note Processed
          </CardTitle>
          <p className="text-sm text-green-600">{results.summary}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Context Update */}
          {results.context_update && (
            <div className="context-section">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={includeContext}
                  onCheckedChange={setIncludeContext}
                />
                <h4 className="font-medium text-sm">📝 Context Update:</h4>
              </div>
              <div className="ml-6">
                <textarea
                  value={editedContext}
                  onChange={(e) => setEditedContext(e.target.value)}
                  className="w-full p-3 bg-blue-50 rounded border-l-4 border-blue-400 text-sm resize-none"
                  rows={3}
                  disabled={!includeContext}
                />
                <p className="text-xs text-blue-600 mt-1">
                  This will be added to your track context with today's date
                </p>
              </div>
            </div>
          )}

          {/* Extracted Tasks */}
          {tasks.length > 0 && (
            <div className="tasks-section">
              <h4 className="font-medium text-sm mb-3">
                ✅ Extracted Tasks ({selectedTaskCount} selected):
              </h4>
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={index} className="task-item border rounded bg-white shadow-sm">
                    <div className="flex items-start gap-3 p-3">
                      <Checkbox
                        checked={selectedTasks[index]}
                        onCheckedChange={() => toggleTask(index)}
                      />
                      <div className="flex-1 space-y-2">
                        {/* Task Header - Priority and Goal Selection */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={editedTasks[index].suggested_priority}
                            onChange={(e) => updateTaskPriority(index, e.target.value)}
                            className={`text-xs px-2 py-1 rounded font-medium border-0 ${priorityColors[editedTasks[index].suggested_priority]}`}
                            disabled={!selectedTasks[index]}
                          >
                            <option value="high">HIGH</option>
                            <option value="medium">MEDIUM</option>
                            <option value="low">LOW</option>
                          </select>
                          
                          <span className="text-xs text-gray-500">→</span>
                          
                          <select
                            value={editedTasks[index].suggested_goal_id || 'new-goal'}
                            onChange={(e) => updateTaskGoal(index, e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
                            disabled={!selectedTasks[index]}
                          >
                            <option value="new-goal">Create New Goal</option>
                            {currentTrack.goals.map(goal => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Editable Task Text */}
                        <textarea
                          value={editedTasks[index].text}
                          onChange={(e) => updateTaskText(index, e.target.value)}
                          className="w-full text-sm font-medium bg-transparent border-0 resize-none p-1 -ml-1 rounded focus:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          rows={1}
                          disabled={!selectedTasks[index]}
                          onInput={(e) => {
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                          }}
                        />

                        {/* Reasoning */}
                        <p className="text-xs text-gray-500 italic">
                          {task.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {hasChanges && (
            <div className="stats-section p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Ready to apply:</strong>
                {includeContext && ' Context update'}
                {includeContext && selectedTaskCount > 0 && ' + '}
                {selectedTaskCount > 0 && `${selectedTaskCount} task${selectedTaskCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleApply}
              disabled={!hasChanges}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Discard
            </Button>
          </div>

          {/* Help Text */}
          <div className="help-text text-xs text-gray-500 text-center pt-2 border-t">
            <p>💡 You can edit task text, priorities, and goal assignments before applying. Uncheck items you don't want to add.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VoiceProcessingResults

