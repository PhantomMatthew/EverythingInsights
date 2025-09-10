import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Chip,
  Divider,
  Progress
} from '@heroui/react';
import { useAppStore } from '../store/appStore';
import { useToast } from './ToastProvider';

interface URLInputProps {}

const URLInput: React.FC<URLInputProps> = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [progress, setProgress] = useState({
    stage: '',
    progress: 0,
    message: ''
  });
  
  const { addTask, updateTask, settings } = useAppStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (!window.electronAPI) return;

    // Set up progress listeners
    const cleanupDownload = window.electronAPI.onDownloadProgress((data) => {
      setProgress({
        stage: 'download',
        progress: data.progress || 0,
        message: data.title ? `Downloading: ${data.title}` : 'Downloading video...'
      });
      
      if (currentTask) {
        updateTask(currentTask.id, {
          status: 'downloading',
          progress: data.progress || 0,
          title: data.title
        });
      }
    });

    const cleanupExtraction = window.electronAPI.onExtractionProgress((data) => {
      setProgress({
        stage: 'extraction',
        progress: data.progress || 0,
        message: 'Extracting audio from video...'
      });
      
      if (currentTask) {
        updateTask(currentTask.id, {
          status: 'extracting',
          progress: 30 + (data.progress || 0) * 0.3
        });
      }
    });

    const cleanupTranscription = window.electronAPI.onTranscriptionProgress((data) => {
      setProgress({
        stage: 'transcription',
        progress: data.progress || 0,
        message: 'Converting speech to text...'
      });
      
      if (currentTask) {
        updateTask(currentTask.id, {
          status: 'transcribing',
          progress: 60 + (data.progress || 0) * 0.2
        });
      }
    });

    return () => {
      cleanupDownload();
      cleanupExtraction();
      cleanupTranscription();
    };
  }, [currentTask, updateTask]);

  const detectPlatform = (url: string): { platform: string; isValid: boolean; error?: string } => {
    const cleanUrl = url.trim();
    
    if (!cleanUrl) {
      return { platform: '', isValid: false, error: 'URL cannot be empty' };
    }

    // YouTube patterns
    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=/,
    ];

    // Bilibili patterns
    const bilibiliPatterns = [
      /^https?:\/\/(www\.)?bilibili\.com\/video\/[A-Za-z0-9]+/,
      /^https?:\/\/b23\.tv\/[A-Za-z0-9]+/,
    ];

    for (const pattern of youtubePatterns) {
      if (pattern.test(cleanUrl)) {
        return { platform: 'YouTube', isValid: true };
      }
    }

    for (const pattern of bilibiliPatterns) {
      if (pattern.test(cleanUrl)) {
        return { platform: 'Bilibili', isValid: true };
      }
    }

    return { 
      platform: 'Unknown', 
      isValid: false, 
      error: 'Unsupported platform. Please use YouTube or Bilibili URLs.' 
    };
  };

  const handleSubmit = useCallback(async () => {
    const validation = detectPlatform(url);
    
    if (!validation.isValid) {
      addToast({
        type: 'error',
        title: 'Invalid URL',
        message: validation.error || 'Please enter a valid YouTube or Bilibili URL'
      });
      return;
    }

    if (!window.electronAPI) {
      addToast({
        type: 'error',
        title: 'Electron API Error',
        message: 'Please run the application in Electron environment'
      });
      return;
    }

    setIsProcessing(true);
    setProgress({ stage: 'init', progress: 0, message: 'Initializing...' });

    try {
      // Create task
      const taskId = addTask(url);
      const task = { id: taskId, url, status: 'pending', progress: 0, createdAt: new Date() };
      setCurrentTask(task);

      // Save to database
      if (window.electronAPI.dbSaveTask) {
        await window.electronAPI.dbSaveTask(task);
      }

      // Start processing pipeline
      await processVideo(url, taskId);
      
      setUrl('');
      setCurrentTask(null);
      
      addToast({
        type: 'success',
        title: 'Processing Complete',
        message: 'Video has been successfully processed and summarized!'
      });
      
    } catch (error) {
      console.error('Error processing video:', error);
      addToast({
        type: 'error',
        title: 'Processing Failed',
        message: (error as Error).message,
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => handleSubmit()
        }
      });
      
      if (currentTask) {
        updateTask(currentTask.id, { 
          status: 'failed', 
          error: (error as Error).message 
        });
      }
    } finally {
      setIsProcessing(false);
      setProgress({ stage: '', progress: 0, message: '' });
    }
  }, [url, addTask, addToast]);

  const processVideo = async (url: string, taskId: string) => {
    try {
      // Step 1: Download video
      setProgress({ stage: 'download', progress: 0, message: 'Starting download...' });
      updateTask(taskId, { status: 'downloading', progress: 0 });

      // Log cookies file usage for debugging
      console.log('Using cookies file:', settings.cookiesFile || 'No cookies file configured');

      const downloadResult = await window.electronAPI.downloadVideo(url, settings.cookiesFile || undefined);
      if (!downloadResult.success || !downloadResult.videoPath) {
        throw new Error(downloadResult.error || 'Download failed');
      }

      updateTask(taskId, { 
        status: 'extracting',
        progress: 30,
        title: downloadResult.title,
        videoPath: downloadResult.videoPath
      });

      // Step 2: Extract audio
      setProgress({ stage: 'extraction', progress: 0, message: 'Extracting audio...' });
      const extractResult = await window.electronAPI.extractAudio(downloadResult.videoPath);
      if (!extractResult.success || !extractResult.audioPath) {
        throw new Error(extractResult.error || 'Audio extraction failed');
      }

      updateTask(taskId, { 
        status: 'transcribing',
        progress: 60,
        audioPath: extractResult.audioPath
      });

      // Step 3: Speech to text
      setProgress({ stage: 'transcription', progress: 0, message: 'Converting speech to text...' });
      const transcriptResult = await window.electronAPI.speechToText(
        extractResult.audioPath, 
        settings.whisperModel
      );
      if (!transcriptResult.success || !transcriptResult.text) {
        throw new Error(transcriptResult.error || 'Speech to text failed');
      }

      updateTask(taskId, { 
        status: 'summarizing',
        progress: 80,
        transcript: transcriptResult.text
      });

      // Step 4: Generate summary
      setProgress({ stage: 'summarization', progress: 0, message: 'Generating AI summary...' });
      const summaryResult = await window.electronAPI.llmSummarize(
        transcriptResult.text, 
        settings.llmModel,
        settings.apiKeys
      );

      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Summarization failed');
      }

      // Complete
      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        summary: summaryResult.summary,
        completedAt: new Date()
      });

      setProgress({ stage: 'completed', progress: 100, message: 'Processing completed!' });

      // Save final state to database
      if (window.electronAPI.dbUpdateTask) {
        await window.electronAPI.dbUpdateTask(taskId, {
          status: 'completed',
          progress: 100,
          title: downloadResult.title,
          transcript: transcriptResult.text,
          summary: summaryResult.summary,
          completed_at: new Date()
        });
      }

    } catch (error) {
      updateTask(taskId, { 
        status: 'failed', 
        error: (error as Error).message 
      });
      
      // Save error state to database
      if (window.electronAPI.dbUpdateTask) {
        await window.electronAPI.dbUpdateTask(taskId, {
          status: 'failed',
          error: (error as Error).message
        });
      }
      
      throw error;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedUrl = e.dataTransfer.getData('text');
    if (droppedUrl) {
      setUrl(droppedUrl);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const validation = detectPlatform(url);

  return (
    <Card className="shadow-lg border-none bg-gradient-to-br from-white to-default-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
            <span className="text-white text-xl">🎬</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-default-800">Add Video</h3>
            <p className="text-sm text-default-500">Paste YouTube or Bilibili URL to get started</p>
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-6 pt-6">
        <div 
          className="relative p-8 border-2 border-dashed border-default-300 rounded-xl bg-gradient-to-br from-default-50 to-default-100 hover:border-primary-300 transition-colors duration-200"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="text-center">
            <div className="mb-4">
              <span className="text-4xl">📎</span>
            </div>
            <p className="text-default-600 font-medium">
              Drop a video URL here
            </p>
            <p className="text-sm text-default-400 mt-1">
              or paste in the field below
            </p>
          </div>
        </div>
        
        <Input
          label="Video URL"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          variant="bordered"
          size="lg"
          errorMessage={url && !validation.isValid ? validation.error : ''}
          isInvalid={url ? !validation.isValid : false}
          isDisabled={isProcessing}
          startContent={
            <div className="text-default-400">
              🔗
            </div>
          }
          className="text-base"
        />
        
        {url && validation.isValid && (
          <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl border border-success-200">
            <div className="p-2 bg-success-100 rounded-lg">
              <span className="text-success-600 text-lg">
                {validation.platform === 'YouTube' ? '📺' : '🎥'}
              </span>
            </div>
            <div>
              <p className="font-medium text-success-800">Platform Detected</p>
              <Chip color="success" variant="solid" size="sm" className="mt-1">
                {validation.platform}
              </Chip>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin p-2 bg-primary-100 rounded-lg">
                <span className="text-primary-600 text-lg">⚡</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary-800">{progress.message}</p>
                <p className="text-sm text-primary-600">Processing your video...</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-700">{Math.round(progress.progress)}%</p>
              </div>
            </div>
            <Progress 
              value={progress.progress}
              size="md"
              color="primary"
              className="w-full"
              showValueLabel={false}
            />
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            color="primary"
            onClick={handleSubmit}
            isDisabled={!url || !validation.isValid || isProcessing}
            isLoading={isProcessing}
            size="lg"
            className="flex-1 font-semibold"
            startContent={isProcessing ? null : <span>🚀</span>}
          >
            {isProcessing ? 'Processing Video...' : 'Process Video'}
          </Button>
          
          <Button
            variant="bordered"
            onClick={() => setUrl('')}
            isDisabled={isProcessing}
            size="lg"
            className="px-6"
          >
            Clear
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default URLInput;