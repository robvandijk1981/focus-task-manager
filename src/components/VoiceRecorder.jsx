import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react'

const VoiceRecorder = ({ onTranscriptComplete, isProcessing = false, trackColor }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
    }
  }, [])

  const startRecording = async () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Safari.')
      return
    }

    // Clear previous state
    setError(null)
    setTranscript('')
    transcriptRef.current = ''

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setError('Microphone permission required. Please enable in browser settings.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Voice recording started')
      setIsRecording(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript + interimTranscript
      setTranscript(fullTranscript)
      transcriptRef.current = fullTranscript
      console.log('Transcript updated:', fullTranscript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.')
          break
        case 'audio-capture':
          setError('Microphone not available. Please check your device.')
          break
        case 'not-allowed':
          setError('Microphone permission denied. Please enable in browser settings.')
          break
        case 'network':
          setError('Network error. Please check your internet connection.')
          break
        default:
          setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      console.log('Voice recording ended, final transcript:', transcriptRef.current)
      setIsRecording(false)
      
      const finalTranscript = transcriptRef.current.trim()
      if (finalTranscript && onTranscriptComplete) {
        console.log('Calling onTranscriptComplete with:', finalTranscript)
        onTranscriptComplete(finalTranscript)
        setTranscript('')
        transcriptRef.current = ''
      } else {
        console.log('No transcript to process or no callback provided')
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    console.log('Stopping recording manually')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    transcriptRef.current = ''
    setError(null)
  }

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-800 text-sm font-medium mb-1">
            Voice Recording Not Supported
          </p>
          <p className="text-yellow-700 text-xs">
            Please use Chrome, Safari, or Edge for voice recording functionality.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="voice-recorder space-y-4">
      {/* Main Voice Button */}
      <Button
        size="lg"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`w-full h-16 text-lg font-semibold transition-all ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isRecording ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Voice Note
          </>
        )}
      </Button>

      {/* Recording Status */}
      {isRecording && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-700 text-sm font-medium">Recording... Speak now</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Preview */}
      {transcript && !isRecording && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-blue-600 text-sm font-medium">Transcript:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscript}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Clear
              </Button>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                Transcript ready for AI processing. It will be processed when you stop recording.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description under button */}
      {!isRecording && !transcript && !error && (
        <p className="text-gray-600 text-sm text-center mt-2">
          Record voice notes that will be automatically processed into context updates and tasks
        </p>
      )}
    </div>
  )
}

export default VoiceRecorder

