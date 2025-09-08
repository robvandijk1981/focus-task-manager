import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Settings, Key, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import aiService from '../services/aiService.js'

export default function AISettings({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const currentKey = aiService.getApiKey()
      setApiKey(currentKey)
      setConnectionStatus(null)
    }
  }, [isOpen])

  const handleSaveKey = () => {
    aiService.setApiKey(apiKey)
    setConnectionStatus(null)
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus({ success: false, message: 'Please enter an API key first' })
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus(null)

    try {
      // Temporarily set the key for testing
      const originalKey = aiService.getApiKey()
      aiService.setApiKey(apiKey)
      
      await aiService.testConnection()
      setConnectionStatus({ success: true, message: 'Connection successful! AI features are ready to use.' })
    } catch (error) {
      setConnectionStatus({ success: false, message: error.message })
      // Restore original key if test failed
      aiService.setApiKey(aiService.getApiKey())
    } finally {
      setIsTestingConnection(false)
    }
  }

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key
    return key.substring(0, 7) + '•'.repeat(key.length - 14) + key.substring(key.length - 7)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Setup */}
          <div>
            <h3 className="text-lg font-medium mb-3">OpenAI API Key Setup</h3>
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  To use AI features, you need your own OpenAI API key. This ensures you have full control over costs and privacy.
                  <br />
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Get your API key here <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3"
                  >
                    {showKey ? "Hide" : "Show"}
                  </Button>
                </div>
                {apiKey && !showKey && (
                  <p className="text-xs text-gray-500">
                    Current key: {maskApiKey(apiKey)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveKey} disabled={!apiKey.trim()}>
                  Save API Key
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || isTestingConnection}
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {connectionStatus && (
                <Alert className={connectionStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {connectionStatus.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={connectionStatus.success ? 'text-green-800' : 'text-red-800'}>
                    {connectionStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Cost Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Cost Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Typical monthly usage:</span>
                <Badge variant="secondary">$2-5</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Per AI analysis:</span>
                <Badge variant="secondary">~$0.01-0.03</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Model used:</span>
                <Badge variant="secondary">GPT-4o-mini</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                You pay OpenAI directly. Costs are based on actual usage.
              </p>
            </div>
          </div>

          {/* Privacy Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Privacy & Security</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Your API key is stored securely in your browser only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Notes are sent directly to OpenAI, not stored on our servers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>You have full control over your data and costs</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

