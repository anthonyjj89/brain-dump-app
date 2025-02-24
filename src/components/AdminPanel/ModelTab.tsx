'use client';

import { useState, useEffect } from 'react';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  costPer1k: string;
}

const models: ModelOption[] = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast, efficient categorization',
    costPer1k: '$0.0005'
  },
  {
    id: 'deepseek-ai/deepseek-chat-7b',
    name: 'DeepSeek Chat 7B',
    description: 'Cost-effective, good for basic tasks',
    costPer1k: '$0.0001'
  }
];

interface TestResult {
  modelId: string;
  input: string;
  output: any;
  responseTime: number;
  tokenUsage: number;
  cost: number;
  timestamp: string;
}

export default function ModelTab() {
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [testInput, setTestInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // Load selected model from localStorage
    const savedModel = localStorage.getItem('selectedAIModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedAIModel', modelId);
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: testInput,
          type: 'text',
          modelId: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const data = await response.json();
      const endTime = performance.now();

      const newResult: TestResult = {
        modelId: selectedModel,
        input: testInput,
        output: data,
        responseTime: Math.round(endTime - startTime),
        tokenUsage: data.tokenUsage || 0,
        cost: data.cost || 0,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [newResult, ...prev].slice(0, 10)); // Keep last 10 results
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">AI Model Selection</h3>
        
        <div className="space-y-4">
          {models.map(model => (
            <div
              key={model.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                selectedModel === model.id
                  ? 'bg-blue-900/50 border-blue-500'
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{model.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Cost: {model.costPer1k} per 1K tokens</p>
                </div>
                <button
                  onClick={() => handleModelChange(model.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedModel === model.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedModel === model.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Test Model</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Input
            </label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a thought to test categorization..."
            />
          </div>

          <button
            onClick={handleTest}
            disabled={isLoading || !testInput.trim()}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200
              ${isLoading || !testInput.trim()
                ? 'bg-blue-800 cursor-not-allowed opacity-70'
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:scale-[1.02]'
              }
            `}
          >
            {isLoading ? 'Testing...' : 'Run Test'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-white">Recent Test Results</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className="bg-slate-900 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">
                    {result.responseTime}ms
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">Input: {result.input}</p>
                <pre className="text-xs bg-slate-950 rounded p-2 overflow-x-auto">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
                <div className="mt-2 text-xs text-gray-500">
                  Tokens: {result.tokenUsage} | Cost: ${result.cost.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
