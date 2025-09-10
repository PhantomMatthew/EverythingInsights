import { 
  Card, 
  CardHeader, 
  Tabs,
  Tab
} from '@heroui/react';
import { useAppStore } from './store/appStore';
import URLInput from './components/URLInput';
import TaskList from './components/TaskList';
import Settings from './components/Settings';

function App() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <Card>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">VideoInsight</h1>
                <p className="text-default-500">
                  Extract insights from YouTube and Bilibili videos using AI
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Navigation */}
          <Tabs 
            selectedKey={currentView} 
            onSelectionChange={(key) => setCurrentView(key as any)}
            className="w-full"
          >
            <Tab key="home" title="Home">
              <div className="space-y-6">
                <URLInput />
                <TaskList showRecent={true} />
              </div>
            </Tab>
            
            <Tab key="tasks" title="All Tasks">
              <TaskList showRecent={false} />
            </Tab>
            
            <Tab key="settings" title="Settings">
              <Settings />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default App;
