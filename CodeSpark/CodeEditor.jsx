import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Save, 
  FileText, 
  Settings, 
  Sparkles,
  MessageSquare,
  Code,
  Bug,
  Wand2
} from 'lucide-react';

const CodeEditor = ({ 
  files = [], 
  activeFile, 
  onFileChange, 
  onCodeChange,
  onRunCode,
  onSaveFile,
  onAIAssist 
}) => {
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco editor
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f0f0f',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#6b7280',
        'editor.selectionBackground': '#374151',
        'editor.inactiveSelectionBackground': '#1f2937',
      }
    });
    
    monaco.editor.setTheme('custom-dark');
  };

  const handleCodeChange = (value) => {
    if (onCodeChange && activeFile) {
      onCodeChange(activeFile.id, value);
    }
  };

  const getLanguageFromExtension = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return languageMap[ext] || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {activeFile ? activeFile.file_path : 'No file selected'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSaveFile && onSaveFile(activeFile)}
            className="text-gray-300 hover:text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRunCode && onRunCode(activeFile)}
            className="text-green-400 hover:text-green-300"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAIAssist && onAIAssist('general', activeFile)}
            className="text-purple-400 hover:text-purple-300"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI Assist
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              language={getLanguageFromExtension(activeFile.file_path)}
              value={activeFile.content || ''}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              theme="custom-dark"
              options={{
                fontSize: fontSize,
                fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                minimap: { enabled: true },
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                detectIndentation: true,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                unfoldOnClickAfterEndOfLine: false,
                contextmenu: true,
                mouseWheelZoom: true,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: true,
                smoothScrolling: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalHasArrows: false,
                  horizontalHasArrows: false,
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                bracketPairColorization: {
                  enabled: true
                },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-500">
                <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Select a file from the explorer to start coding</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <Tabs defaultValue="chat" className="h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="generate" className="text-xs">
                <Wand2 className="w-3 h-3 mr-1" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="debug" className="text-xs">
                <Bug className="w-3 h-3 mr-1" />
                Debug
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="p-4 h-full">
              <AIChat onAIAssist={onAIAssist} activeFile={activeFile} />
            </TabsContent>
            
            <TabsContent value="generate" className="p-4 h-full">
              <CodeGeneration onAIAssist={onAIAssist} activeFile={activeFile} />
            </TabsContent>
            
            <TabsContent value="debug" className="p-4 h-full">
              <CodeDebug onAIAssist={onAIAssist} activeFile={activeFile} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// AI Chat Component
const AIChat = ({ onAIAssist, activeFile }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Call AI assist
    if (onAIAssist) {
      onAIAssist('chat', activeFile, input).then(response => {
        const aiMessage = { role: 'assistant', content: response };
        setMessages(prev => [...prev, aiMessage]);
      });
    }
    
    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-300 mb-3">AI Assistant</h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Ask me anything about your code!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`p-2 rounded text-sm ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white ml-4' 
                : 'bg-gray-700 text-gray-300 mr-4'
            }`}>
              {message.content}
            </div>
          ))
        )}
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your code..."
          className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <Button size="sm" onClick={handleSendMessage}>
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Code Generation Component
const CodeGeneration = ({ onAIAssist, activeFile }) => {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');

  const handleGenerate = () => {
    if (!description.trim()) return;
    
    if (onAIAssist) {
      onAIAssist('code_generation', activeFile, {
        description,
        language
      });
    }
    
    setDescription('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Code Generation</h3>
      
      <div>
        <label className="block text-xs text-gray-400 mb-1">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what code you want to generate..."
          className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none h-24 resize-none"
        />
      </div>
      
      <Button onClick={handleGenerate} className="w-full">
        <Wand2 className="w-4 h-4 mr-2" />
        Generate Code
      </Button>
    </div>
  );
};

// Code Debug Component
const CodeDebug = ({ onAIAssist, activeFile }) => {
  const [analysisType, setAnalysisType] = useState('general');

  const handleAnalyze = () => {
    if (onAIAssist && activeFile) {
      onAIAssist('code_analysis', activeFile, { analysis_type: analysisType });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Code Analysis</h3>
      
      <div>
        <label className="block text-xs text-gray-400 mb-1">Analysis Type</label>
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="general">General Issues</option>
          <option value="performance">Performance</option>
          <option value="security">Security</option>
          <option value="best_practices">Best Practices</option>
          <option value="bugs">Bug Detection</option>
        </select>
      </div>
      
      <Button onClick={handleAnalyze} className="w-full">
        <Bug className="w-4 h-4 mr-2" />
        Analyze Code
      </Button>
      
      <div className="text-xs text-gray-500">
        <p>AI will analyze your current file for:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Potential bugs</li>
          <li>Performance issues</li>
          <li>Security vulnerabilities</li>
          <li>Code quality improvements</li>
        </ul>
      </div>
    </div>
  );
};

export default CodeEditor;

