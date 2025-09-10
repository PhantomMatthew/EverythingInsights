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
      default: return 'primary';
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
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-default-500">
            {showRecent ? 'No recent tasks' : 'No tasks yet'}
          </p>
          <p className="text-sm text-default-400 mt-2">
            Add a video URL above to get started
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between">
          <h3 className="text-lg font-semibold">
            {showRecent ? 'Recent Tasks' : 'All Tasks'}
          </h3>
          <Chip size="sm" variant="flat">
            {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {displayTasks.map((task) => (
            <Card key={task.id} shadow="sm" className="border-1">
              <CardBody className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.title || task.url}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      {task.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <Chip 
                    color={getStatusColor(task.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(task.status)}
                  </Chip>
                </div>

                {task.status !== 'pending' && task.status !== 'completed' && task.status !== 'failed' && (
                  <Progress 
                    value={task.progress}
                    size="sm"
                    color="primary"
                    showValueLabel
                  />
                )}

                {task.error && (
                  <div className="p-2 bg-danger-50 border border-danger-200 rounded-md">
                    <p className="text-xs text-danger-700">{task.error}</p>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  {task.status === 'completed' && task.summary && (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => handleViewResult(task)}
                      >
                        View Result
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        onClick={() => handleExport(task)}
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
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col">
              <h3>Task Result</h3>
              <p className="text-sm text-default-500 font-normal">
                {selectedTask?.title || selectedTask?.url}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedTask?.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <Textarea
                  value={selectedTask.summary}
                  readOnly
                  variant="bordered"
                  minRows={4}
                />
              </div>
            )}
            
            {selectedTask?.transcript && (
              <div>
                <h4 className="font-semibold mb-2">Transcript</h4>
                <Textarea
                  value={selectedTask.transcript}
                  readOnly
                  variant="bordered"
                  minRows={8}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              color="primary" 
              variant="flat"
              onClick={() => selectedTask && handleExport(selectedTask)}
            >
              Export
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TaskList;