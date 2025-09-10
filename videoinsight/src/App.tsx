import { 
  Card, 
  CardHeader, 
  Avatar,
  Chip,
  Button
} from '@heroui/react';
import { useAppStore } from './store/appStore';
import URLInput from './components/URLInput';
import TaskList from './components/TaskList';
import Settings from './components/Settings';

type ViewType = 'home' | 'tasks' | 'settings';

function App() {
  const { currentView, setCurrentView } = useAppStore();

  const navigationItems = [
    {
      key: 'home' as ViewType,
      label: 'Home',
      icon: '🏠',
      description: 'Process videos'
    },
    {
      key: 'tasks' as ViewType,
      label: 'All Tasks',
      icon: '📋',
      description: 'Task history'
    },
    {
      key: 'settings' as ViewType,
      label: 'Settings',
      icon: '⚙️',
      description: 'Configuration'
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-background to-default-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-white to-default-50 border-r border-default-200 shadow-lg flex flex-col">
        {/* Header */}
        <Card className="m-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-none shadow-xl">
          <CardHeader className="flex gap-4 p-6">
            <Avatar 
              src="/logo.png" 
              fallback="🎥"
              className="bg-gradient-to-br from-primary to-secondary text-white text-2xl"
              size="lg"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                VideoInsight
              </h1>
              <p className="text-default-600 text-sm">
                AI-powered video analysis
              </p>
              <div className="flex gap-1 mt-2">
                <Chip size="sm" color="primary" variant="flat">AI</Chip>
                <Chip size="sm" color="secondary" variant="flat">Multi-Platform</Chip>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                variant={currentView === item.key ? "solid" : "flat"}
                color={currentView === item.key ? "primary" : "default"}
                size="lg"
                className={`w-full justify-start h-16 ${
                  currentView === item.key 
                    ? 'shadow-lg bg-gradient-to-r from-primary to-secondary text-white' 
                    : 'hover:bg-default-100'
                }`}
                startContent={
                  <div className={`p-2 rounded-lg ${
                    currentView === item.key 
                      ? 'bg-white/20' 
                      : 'bg-default-100'
                  }`}>
                    <span className={`text-xl ${
                      currentView === item.key ? 'text-white' : 'text-default-600'
                    }`}>
                      {item.icon}
                    </span>
                  </div>
                }
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold">{item.label}</span>
                  <span className={`text-xs ${
                    currentView === item.key ? 'text-white/80' : 'text-default-400'
                  }`}>
                    {item.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-default-200">
          <div className="text-center">
            <p className="text-xs text-default-400">VideoInsight v0.1.0</p>
            <p className="text-xs text-default-400 mt-1">
              Built with React + HeroUI + Electron
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
