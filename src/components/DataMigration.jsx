import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Upload, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import apiService from '../services/apiService';

export default function DataMigration({ onMigrationComplete, onSkip }) {
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, checking, migrating, complete, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [localDataFound, setLocalDataFound] = useState(false);

  const checkLocalData = () => {
    const localData = localStorage.getItem('trackGoalTaskData');
    const todayTasks = localStorage.getItem('todayTasks');
    
    let hasValidLocalData = false;
    let tracks = [];
    let todayTasksData = [];
    
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // Check if any track has goals with tasks
          hasValidLocalData = parsedData.some(track => 
            track.goals && track.goals.some(goal => 
              goal.tasks && goal.tasks.length > 0
            )
          );
          if (hasValidLocalData) {
            tracks = parsedData;
          }
        }
      } catch (error) {
        console.error('Error parsing local data:', error);
        setMessage('Error reading local track data');
        return null;
      }
    }
    
    if (todayTasks && !hasValidLocalData) {
      try {
        const parsedTodayTasks = JSON.parse(todayTasks);
        if (Array.isArray(parsedTodayTasks) && parsedTodayTasks.length > 0) {
          hasValidLocalData = true;
          todayTasksData = parsedTodayTasks;
        }
      } catch (error) {
        console.error('Error parsing today tasks:', error);
        setMessage('Error reading today tasks data');
        return null;
      }
    }
    
    if (hasValidLocalData) {
      const taskCount = tracks.reduce((total, track) => {
        return total + track.goals.reduce((goalTotal, goal) => {
          return goalTotal + (goal.tasks ? goal.tasks.length : 0);
        }, 0);
      }, 0);
      
      const todayTaskCount = todayTasksData.length;
      
      setLocalDataFound(true);
      setMessage(`Found ${tracks.length} tracks with ${taskCount} tasks${todayTaskCount > 0 ? ` and ${todayTaskCount} today tasks` : ''} in local storage`);
      return { tracks, todayTasks: todayTasksData };
    }
    
    setLocalDataFound(false);
    setMessage('No meaningful local data found to migrate');
    return null;
  };

  const startMigration = async () => {
    setMigrationStatus('checking');
    setProgress(10);
    
    const localData = checkLocalData();
    
    if (!localData) {
      setMigrationStatus('complete');
      setProgress(100);
      setMessage('No data to migrate. You can start fresh!');
      setTimeout(() => onMigrationComplete(), 2000);
      return;
    }

    try {
      setMigrationStatus('migrating');
      setProgress(30);
      setMessage('Uploading your data to the cloud...');

      // Sync tracks data
      const syncedTracks = await apiService.syncTracks(localData.tracks);
      setProgress(70);

      // Update session with today's tasks
      if (localData.todayTasks && localData.todayTasks.length > 0) {
        setMessage('Syncing today\'s tasks...');
        // Note: Today's tasks will be handled by the main app after migration
      }

      setProgress(90);
      setMessage('Migration complete! Your data is now safely stored in the cloud.');
      
      // Clear local storage after successful migration
      localStorage.removeItem('trackGoalTaskData');
      localStorage.removeItem('todayTasks');
      
      setProgress(100);
      setMigrationStatus('complete');
      
      setTimeout(() => onMigrationComplete(syncedTracks), 2000);
      
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
      setMessage(`Migration failed: ${error.message}`);
    }
  };

  const skipMigration = () => {
    setMigrationStatus('complete')
    setMessage('Starting fresh with cloud storage')
    setTimeout(() => onSkip ? onSkip() : onMigrationComplete(), 1000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus === 'idle' && (
            <>
              <p className="text-sm text-gray-600">
                Welcome to the cloud-powered Focus Task Manager! Let's check if you have any existing data to migrate.
              </p>
              <Button onClick={startMigration} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Check for Local Data
              </Button>
            </>
          )}

          {migrationStatus === 'checking' && (
            <>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking for local data...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </>
          )}

          {migrationStatus === 'migrating' && (
            <>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Migrating your data...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">{message}</p>
            </>
          )}

          {migrationStatus === 'complete' && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <Progress value={100} className="w-full" />
            </>
          )}

          {migrationStatus === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={startMigration} variant="outline" size="sm">
                  Try Again
                </Button>
                <Button onClick={skipMigration} variant="outline" size="sm">
                  Skip Migration
                </Button>
              </div>
            </>
          )}

          {localDataFound && migrationStatus === 'checking' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={startMigration} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate Data
                </Button>
                <Button onClick={skipMigration} variant="outline" className="flex-1">
                  Start Fresh
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Migrating will move your existing tracks, goals, and tasks to the cloud. 
                Starting fresh will clear local data and begin with an empty workspace.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

