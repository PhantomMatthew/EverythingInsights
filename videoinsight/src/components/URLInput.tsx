import React, { useState, useCallback } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Chip,
  Divider
} from '@heroui/react';
import { useAppStore } from '../store/appStore';

interface URLInputProps {}

const URLInput: React.FC<URLInputProps> = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addTask, startTaskProcessing } = useAppStore();

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
      alert(validation.error || 'Invalid URL');
      return;
    }

    setIsProcessing(true);
    try {
      // Add task to store
      const taskId = addTask(url);
      
      // Start processing
      startTaskProcessing(taskId);
      
      // Process video (this will be handled by the task processing service)
      await processVideo(url, taskId);
      
      // Clear input
      setUrl('');
    } catch (error) {
      console.error('Error processing video:', error);
      alert('Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [url, addTask, startTaskProcessing]);

  const processVideo = async (url: string, taskId: string) => {
    try {
      // This would normally be handled by a service
      // For now, we'll just simulate the process
      const { updateTask } = useAppStore.getState();
      
      // Download video
      updateTask(taskId, { status: 'downloading', progress: 10 });
      
      if (window.electronAPI) {
        const downloadResult = await window.electronAPI.downloadVideo(url);
        if (!downloadResult.success) {
          throw new Error(downloadResult.error);
        }
        
        updateTask(taskId, { 
          status: 'extracting', 
          progress: 40,
          videoPath: downloadResult.videoPath 
        });
        
        // Extract audio
        const extractResult = await window.electronAPI.extractAudio(downloadResult.videoPath!);
        if (!extractResult.success) {
          throw new Error(extractResult.error);
        }
        
        updateTask(taskId, { 
          status: 'transcribing', 
          progress: 60,
          audioPath: extractResult.audioPath 
        });
        
        // Speech to text
        const transcriptResult = await window.electronAPI.speechToText(extractResult.audioPath!);
        if (!transcriptResult.success) {
          throw new Error(transcriptResult.error);
        }
        
        updateTask(taskId, { 
          status: 'summarizing', 
          progress: 80,
          transcript: transcriptResult.text 
        });
        
        // Generate summary
        const { settings } = useAppStore.getState();
        const summaryResult = await window.electronAPI.llmSummarize(
          transcriptResult.text!, 
          settings.llmModel
        );
        
        if (!summaryResult.success) {
          throw new Error(summaryResult.error);
        }
        
        updateTask(taskId, { 
          status: 'completed', 
          progress: 100,
          summary: summaryResult.summary,
          completedAt: new Date()
        });
      }
    } catch (error) {
      const { updateTask } = useAppStore.getState();
      updateTask(taskId, { 
        status: 'failed', 
        error: (error as Error).message 
      });
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
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Add Video</h3>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        <div 
          className="drag-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p className="text-default-500">
            Drop a video URL here or paste below
          </p>
        </div>
        
        <Input
          label="Video URL"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          variant="bordered"
          errorMessage={url && !validation.isValid ? validation.error : ''}
          isInvalid={url ? !validation.isValid : false}
        />
        
        {url && validation.isValid && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">Platform:</span>
            <Chip color="success" variant="flat" size="sm">
              {validation.platform}
            </Chip>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            color="primary"
            onClick={handleSubmit}
            isDisabled={!url || !validation.isValid || isProcessing}
            isLoading={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : 'Process Video'}
          </Button>
          
          <Button
            variant="bordered"
            onClick={() => setUrl('')}
            isDisabled={isProcessing}
          >
            Clear
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default URLInput;