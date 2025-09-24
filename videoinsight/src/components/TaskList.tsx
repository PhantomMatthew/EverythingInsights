import React from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Progress, 
  Chip,
  Divider,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { useAppStore, type Task } from '../store/appStore';

interface TaskListProps {
  showRecent?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ showRecent = false }) => {
  const { tasks, removeTask } = useAppStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const displayTasks = showRecent ? tasks.slice(-5) : tasks;

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'default';
      case 'downloading': return 'primary';
      case 'extracting': return 'secondary';
      case 'transcribing': return 'warning';
      case 'summarizing': return 'primary';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'downloading': return '⬇️';
      case 'extracting': return '🎵';
      case 'transcribing': return '📝';
      case 'summarizing': return '🤖';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'downloading': return 'Downloading';
      case 'extracting': return 'Extracting Audio';
      case 'transcribing': return 'Transcribing';
      case 'summarizing': return 'Summarizing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  const handleViewResult = (task: Task) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      removeTask(taskId);
    }
  };

  const handleExport = async (task: Task) => {
    if (!task.summary) return;
    
    try {
      const exportContent = `# ${task.title || 'Video Summary'}

**URL:** ${task.url}
**Created:** ${task.createdAt.toLocaleString()}
**Completed:** ${task.completedAt?.toLocaleString() || 'N/A'}

## Summary
${task.summary}

## Transcript
${task.transcript || 'No transcript available'}
`;
      
      if (window.electronAPI) {
        const result = await window.electronAPI.showSaveDialog({
          defaultPath: `video-summary-${Date.now()}.md`,
          filters: [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'Text', extensions: ['txt'] },
          ],
        });
        
        if (!result.canceled) {
          console.log('Would save content:', exportContent);
          console.log('To file:', result.filePath);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (displayTasks.length === 0) {
    return (
      <Card className="shadow-sm border border-default-200 bg-white">
        <CardBody className="text-center py-16">
          <div className="space-y-4">
            <div className="text-6xl">📺</div>
            <div>
              <p className="text-xl font-medium text-default-600 mb-2">
                {showRecent ? 'No recent tasks' : 'No tasks yet'}
              </p>
              <p className="text-default-400">
                Add a video URL above to get started with AI-powered analysis
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border border-default-200 bg-white">
        <CardHeader className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
              <span className="text-white text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">
                {showRecent ? 'Recent Tasks' : 'All Tasks'}
              </h3>
              <p className="text-sm text-default-500">
                {showRecent ? 'Your latest video processing tasks' : 'Complete task history'}
              </p>
            </div>
          </div>
          <Chip size="lg" color="primary" variant="flat" className="font-semibold">
            {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4 p-6">
          {displayTasks.map((task) => (
            <Card 
              key={task.id} 
              shadow="sm" 
              className="border-1 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-default-50"
            >
              <CardBody className="space-y-4 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-default-100 rounded-lg flex-shrink-0">
                      <span className="text-lg">
                        {task.url.includes('youtube') || task.url.includes('youtu.be') ? '📺' : '🎥'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate text-default-800 mb-1">
                        {task.title || 'Video Processing Task'}
                      </p>
                      <p className="text-sm text-default-500 truncate mb-2">
                        {task.url}
                      </p>
                      <p className="text-xs text-default-400">
                        Started: {task.createdAt.toLocaleString()}
                        {task.completedAt && (
                          <span className="ml-3">
                            Completed: {task.completedAt.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Chip 
                    color={getStatusColor(task.status)}
                    size="md"
                    variant="flat"
                    startContent={<span>{getStatusIcon(task.status)}</span>}
                    className="font-medium"
                  >
                    {getStatusText(task.status)}
                  </Chip>
                </div>

                {task.status !== 'pending' && task.status !== 'completed' && task.status !== 'failed' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-default-600 font-medium">Progress</span>
                      <span className="text-default-500 font-semibold">{Math.round(task.progress)}%</span>
                    </div>
                    <Progress 
                      value={task.progress}
                      size="md"
                      color={getStatusColor(task.status)}
                      showValueLabel={false}
                      className="w-full"
                    />
                  </div>
                )}

                {task.error && (
                  <div className="p-4 bg-danger-50 border-l-4 border-danger-300 rounded-r-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-danger-600 text-lg flex-shrink-0">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-danger-800 mb-1">Error occurred</p>
                        <p className="text-xs text-danger-700">{task.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  {task.status === 'completed' && task.summary && (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onClick={() => handleViewResult(task)}
                        startContent={<span>👁️</span>}
                      >
                        View Result
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        onClick={() => handleExport(task)}
                        startContent={<span>📤</span>}
                      >
                        Export
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onClick={() => handleDelete(task.id)}
                    startContent={<span>🗑️</span>}
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </CardBody>
      </Card>

      {/* Result Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          base: "bg-white",
          header: "border-b border-default-200",
          body: "py-6",
          footer: "border-t border-default-200"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <span className="text-primary text-2xl">🎬</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-default-800">Task Results</h3>
                <p className="text-sm text-default-600 font-normal">
                  {selectedTask?.title || selectedTask?.url}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Chip color="success" variant="flat" size="sm">
                    Completed
                  </Chip>
                  {selectedTask?.completedAt && (
                    <span className="text-xs text-default-400">
                      {selectedTask.completedAt.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-6">
            {selectedTask?.summary && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <span className="text-primary-600 text-lg">🤖</span>
                  </div>
                  <h4 className="text-lg font-bold text-default-800">AI Summary</h4>
                </div>
                <Card className="bg-white border-default-200">
                  <CardBody>
                    <Textarea
                      value={selectedTask.summary}
                      readOnly
                      variant="flat"
                      minRows={6}
                      maxRows={12}
                      className="w-full"
                      classNames={{
                        input: "text-sm leading-relaxed"
                      }}
                    />
                  </CardBody>
                </Card>
              </div>
            )}
            
            {selectedTask?.transcript && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <span className="text-warning-600 text-lg">📝</span>
                  </div>
                  <h4 className="text-lg font-bold text-default-800">Full Transcript</h4>
                </div>
                <Card className="bg-white border-default-200">
                  <CardBody>
                    <Textarea
                      value={selectedTask.transcript}
                      readOnly
                      variant="flat"
                      minRows={10}
                      maxRows={20}
                      className="w-full"
                      classNames={{
                        input: "text-sm leading-relaxed font-mono"
                      }}
                    />
                  </CardBody>
                </Card>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button 
              color="secondary" 
              variant="flat"
              size="lg"
              onClick={() => selectedTask && handleExport(selectedTask)}
              startContent={<span>📤</span>}
            >
              Export Results
            </Button>
            <Button 
              color="primary"
              size="lg" 
              onClick={onClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TaskList;

