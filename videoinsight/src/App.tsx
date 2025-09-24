import { Button } from '@heroui/react';
import { useAppStore } from './store/appStore';
import URLInput from './components/URLInput';
import TaskList from './components/TaskList';
import Settings from './components/Settings';

function App() {
  const { currentView, setCurrentView } = useAppStore();

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-8">
            <URLInput />
            <TaskList showRecent={true} />
          </div>
        );
      case 'tasks':
        return <TaskList showRecent={false} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-default-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">VideoInsight</h1>
              <p className="text-xs text-default-500">AI-powered video analysis</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <Button size="sm" color={currentView === 'home' ? 'primary' : 'default'} variant={currentView === 'home' ? 'solid' : 'flat'} onClick={() => setCurrentView('home')}>Home</Button>
            <Button size="sm" color={currentView === 'tasks' ? 'primary' : 'default'} variant={currentView === 'tasks' ? 'solid' : 'flat'} onClick={() => setCurrentView('tasks')}>Tasks</Button>
            <Button size="sm" color={currentView === 'settings' ? 'primary' : 'default'} variant={currentView === 'settings' ? 'solid' : 'flat'} onClick={() => setCurrentView('settings')}>Settings</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;