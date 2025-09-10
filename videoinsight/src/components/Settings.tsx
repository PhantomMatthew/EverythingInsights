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
    { key: 'ollama:llama3', label: 'Llama 3 (Local)' },
    { key: 'ollama:qwen', label: 'Qwen (Local)' },
    { key: 'ollama:mistral', label: 'Mistral (Local)' },
    { key: 'openai:gpt-4', label: 'GPT-4' },
    { key: 'openai:gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
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
    <div className="space-y-6">
      {/* LLM Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">AI Model Settings</h3>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
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
          >
            {llmModels.map((model) => (
              <SelectItem key={model.key}>
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
          >
            {whisperModels.map((model) => (
              <SelectItem key={model.key}>
                {model.label}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">API Keys</h3>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
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
          />
        </CardBody>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">General Settings</h3>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
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
          >
            {themes.map((theme) => (
              <SelectItem key={theme.key}>
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
          >
            {outputFormats.map((format) => (
              <SelectItem key={format.key}>
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
          />
        </CardBody>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">System Information</h3>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Dependencies:</p>
              <ul className="text-default-500 mt-1 space-y-1">
                <li>• yt-dlp (required)</li>
                <li>• ffmpeg (required)</li>
                <li>• whisper (required)</li>
                <li>• ollama (optional, for local models)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Version:</p>
              <p className="text-default-500 mt-1">VideoInsight v0.1.0</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="flat">
              Check Dependencies
            </Button>
            <Button size="sm" variant="flat">
              View Logs
            </Button>
            <Button size="sm" variant="flat" color="warning">
              Clear Cache
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button color="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;