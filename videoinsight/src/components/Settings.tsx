import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Select,
  SelectItem,
  Divider
} from '@heroui/react';
import { useAppStore } from '../store/appStore';

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  const llmModels = [
    { key: 'ollama:qwen3:30b', label: 'Qwen 3 30B (Local)' },
    { key: 'ollama:qwen3:235b', label: 'Qwen 3 235B (Local)' },
    { key: 'ollama:qwen', label: 'Qwen (Local)' },
    { key: 'ollama:llama3', label: 'Llama 3 (Local)' },
    { key: 'ollama:mistral', label: 'Mistral (Local)' },
    { key: 'openai:gpt-4', label: 'GPT-4' },
    { key: 'openai:gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { key: 'claude:claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { key: 'claude:claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ];

  const whisperModels = [
    { key: 'tiny', label: 'Tiny (Fastest, Less Accurate)' },
    { key: 'base', label: 'Base (Balanced)' },
    { key: 'small', label: 'Small (Better Accuracy)' },
    { key: 'medium', label: 'Medium (High Accuracy)' },
    { key: 'large', label: 'Large (Best Accuracy, Slowest)' },
  ];

  const themes = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System Default' },
  ];

  const outputFormats = [
    { key: 'md', label: 'Markdown (.md)' },
    { key: 'txt', label: 'Plain Text (.txt)' },
  ];

  return (
    <div className="space-y-8">
      {/* LLM Settings */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-white to-default-50">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">AI Model Settings</h3>
              <p className="text-sm text-default-500">Configure language and speech recognition models</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6 p-6">
          <Select
            label="LLM Model"
            description="Choose the language model for summarization"
            selectedKeys={[localSettings.llmModel]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setLocalSettings({
                ...localSettings,
                llmModel: selected,
              });
            }}
            variant="bordered"
            size="lg"
            startContent={<span className="text-primary">🧠</span>}
          >
            {llmModels.map((model) => (
              <SelectItem 
                key={model.key}
                startContent={
                  <span className="text-lg">
                    {model.key.startsWith('ollama:') ? '🏠' : 
                     model.key.startsWith('openai:') ? '🔥' : '⚡'}
                  </span>
                }
              >
                {model.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Whisper Model"
            description="Choose the speech recognition model"
            selectedKeys={[localSettings.whisperModel]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setLocalSettings({
                ...localSettings,
                whisperModel: selected,
              });
            }}
            variant="bordered"
            size="lg"
            startContent={<span className="text-warning">🎤</span>}
          >
            {whisperModels.map((model) => (
              <SelectItem 
                key={model.key}
                startContent={<span>🎵</span>}
              >
                {model.label}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* API Keys */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-white to-default-50">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-warning to-danger rounded-xl">
              <span className="text-white text-xl">🔑</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">API Keys</h3>
              <p className="text-sm text-default-500">Configure API credentials for cloud services</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6 p-6">
          <Input
            label="OpenAI API Key"
            placeholder="sk-..."
            type="password"
            value={localSettings.apiKeys.openai || ''}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              apiKeys: {
                ...localSettings.apiKeys,
                openai: e.target.value,
              },
            })}
            description="Required for OpenAI models (GPT-4, GPT-3.5)"
            variant="bordered"
            size="lg"
            startContent={<span className="text-success">🔥</span>}
          />

          <Input
            label="Anthropic Claude API Key"
            placeholder="sk-ant-..."
            type="password"
            value={localSettings.apiKeys.claude || ''}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              apiKeys: {
                ...localSettings.apiKeys,
                claude: e.target.value,
              },
            })}
            description="Required for Claude models"
            variant="bordered"
            size="lg"
            startContent={<span className="text-secondary">⚡</span>}
          />
        </CardBody>
      </Card>

      {/* General Settings */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-white to-default-50">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-success to-primary rounded-xl">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">General Settings</h3>
              <p className="text-sm text-default-500">Customize your application experience</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6 p-6">
          <Select
            label="Theme"
            description="Choose the app theme"
            selectedKeys={[localSettings.theme]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as 'light' | 'dark' | 'system';
              setLocalSettings({
                ...localSettings,
                theme: selected,
              });
            }}
            variant="bordered"
            size="lg"
            startContent={<span className="text-warning">🎨</span>}
          >
            {themes.map((theme) => (
              <SelectItem 
                key={theme.key}
                startContent={
                  <span>
                    {theme.key === 'light' ? '☀️' : 
                     theme.key === 'dark' ? '🌙' : '💻'}
                  </span>
                }
              >
                {theme.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Export Format"
            description="Default format for exported summaries"
            selectedKeys={[localSettings.outputFormat]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as 'txt' | 'md';
              setLocalSettings({
                ...localSettings,
                outputFormat: selected,
              });
            }}
            variant="bordered"
            size="lg"
            startContent={<span className="text-secondary">📄</span>}
          >
            {outputFormats.map((format) => (
              <SelectItem 
                key={format.key}
                startContent={<span>{format.key === 'md' ? '📝' : '📄'}</span>}
              >
                {format.label}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Temporary Directory"
            placeholder="/tmp/videoinsight"
            value={localSettings.tempDirectory}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              tempDirectory: e.target.value,
            })}
            description="Directory for temporary files (videos, audio, etc.)"
            variant="bordered"
            size="lg"
            startContent={<span className="text-primary">📁</span>}
          />

          <div className="space-y-2">
            <Input
              label="Cookies File Path"
              placeholder="/path/to/cookies.txt"
              value={localSettings.cookiesFile}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                cookiesFile: e.target.value,
              })}
              description="Path to cookies.txt file for yt-dlp authentication (optional)"
              variant="bordered"
              size="lg"
              startContent={<span className="text-warning">🍪</span>}
              endContent={
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  onClick={async () => {
                    if (window.electronAPI?.showOpenDialog) {
                      const result = await window.electronAPI.showOpenDialog({
                        title: 'Select Cookies File',
                        filters: [
                          { name: 'Text Files', extensions: ['txt'] },
                          { name: 'All Files', extensions: ['*'] }
                        ],
                        properties: ['openFile']
                      });
                      
                      if (!result.canceled && result.filePaths.length > 0) {
                        setLocalSettings({
                          ...localSettings,
                          cookiesFile: result.filePaths[0],
                        });
                      }
                    }
                  }}
                  startContent={<span>📂</span>}
                >
                  Browse
                </Button>
              }
            />
            {localSettings.cookiesFile && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-success">✅</span>
                <span className="text-default-600">
                  Cookies file: {localSettings.cookiesFile.split('/').pop()}
                </span>
                <span className="text-xs text-default-400">
                  ({localSettings.cookiesFile})
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* System Information */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-white to-default-50">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-secondary to-warning rounded-xl">
              <span className="text-white text-xl">💻</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">System Information</h3>
              <p className="text-sm text-default-500">Dependencies and application details</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🔧</span>
                  <h4 className="font-bold text-primary-800">Dependencies</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-success">✅</span>
                    <span>yt-dlp (required)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✅</span>
                    <span>ffmpeg (required)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✅</span>
                    <span>whisper (required)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-warning">⚠️</span>
                    <span>ollama (optional, for local models)</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-success-50 to-primary-50 border-success-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📦</span>
                  <h4 className="font-bold text-success-800">Application</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-success-700">Version:</span>
                    <span className="font-semibold">v0.1.0</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-success-700">Platform:</span>
                    <span className="font-semibold">Electron</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-success-700">UI:</span>
                    <span className="font-semibold">HeroUI + React</span>
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              size="md" 
              variant="flat" 
              color="primary"
              startContent={<span>🔍</span>}
            >
              Check Dependencies
            </Button>
            <Button 
              size="md" 
              variant="flat" 
              color="secondary"
              startContent={<span>📋</span>}
            >
              View Logs
            </Button>
            <Button 
              size="md" 
              variant="flat" 
              color="warning"
              startContent={<span>🧹</span>}
            >
              Clear Cache
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button 
          variant="bordered" 
          onClick={handleReset}
          size="lg"
          className="px-8"
        >
          Reset Changes
        </Button>
        <Button 
          color="primary" 
          onClick={handleSave}
          size="lg"
          className="px-8 font-semibold"
          startContent={<span>💾</span>}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;