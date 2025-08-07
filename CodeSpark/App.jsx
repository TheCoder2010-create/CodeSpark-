import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectDashboard from './components/ProjectDashboard';
import CodeEditor from './components/CodeEditor';
import FileExplorer from './components/FileExplorer';
import ApiService from './services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  LogOut, 
  User, 
  Settings, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectTree, setProjectTree] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await ApiService.verifyToken();
      if (response.valid) {
        setUser(response.user);
        await loadProjects(response.user.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (userId) => {
    try {
      const projectsData = await ApiService.getProjects(userId);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectData = async (project) => {
    try {
      setCurrentProject(project);
      
      // Load project files and tree
      const [filesData, treeData] = await Promise.all([
        ApiService.getProjectFiles(project.id),
        ApiService.getProjectTree(project.id)
      ]);
      
      setProjectFiles(filesData);
      setProjectTree(treeData);
      
      // Set first file as active if available
      if (filesData.length > 0) {
        setActiveFile(filesData[0]);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await ApiService.login(credentials);
      setUser(response.user);
      await loadProjects(response.user.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await ApiService.register(userData);
      setUser(response.user);
      await loadProjects(response.user.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      setUser(null);
      setProjects([]);
      setCurrentProject(null);
      setProjectFiles([]);
      setProjectTree({});
      setActiveFile(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProjectCreate = async (projectData) => {
    try {
      const newProject = await ApiService.createProject({
        ...projectData,
        user_id: user.id
      });
      setProjects(prev => [...prev, newProject]);
      return { success: true };
    } catch (error) {
      console.error('Failed to create project:', error);
      return { success: false, error: error.message };
    }
  };

  const handleProjectDelete = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await ApiService.deleteProject(project.id);
        setProjects(prev => prev.filter(p => p.id !== project.id));
        if (currentProject && currentProject.id === project.id) {
          setCurrentProject(null);
          setProjectFiles([]);
          setProjectTree({});
          setActiveFile(null);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleFileSelect = (file) => {
    setActiveFile(file);
  };

  const handleCodeChange = async (fileId, newContent) => {
    try {
      // Update local state immediately
      setActiveFile(prev => ({ ...prev, content: newContent }));
      setProjectFiles(prev => 
        prev.map(file => 
          file.id === fileId ? { ...file, content: newContent } : file
        )
      );
      
      // Save to backend
      await ApiService.updateFile(fileId, { content: newContent });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleAIAssist = async (type, file, prompt) => {
    try {
      let response;
      
      switch (type) {
        case 'chat':
          response = await ApiService.aiChat({
            user_id: user.id,
            project_id: currentProject?.id,
            prompt: prompt,
            session_type: 'general'
          });
          return response.response;
          
        case 'code_generation':
          response = await ApiService.generateCode({
            user_id: user.id,
            project_id: currentProject?.id,
            description: prompt.description,
            language: prompt.language,
            context_files: file ? [file.id] : []
          });
          
          // Insert generated code into active file
          if (response.generated_code && activeFile) {
            const newContent = activeFile.content + '\n\n' + response.generated_code;
            handleCodeChange(activeFile.id, newContent);
          }
          return response.generated_code;
          
        case 'code_analysis':
          if (!file) return 'No file selected for analysis';
          
          response = await ApiService.analyzeCode({
            project_id: currentProject?.id,
            file_id: file.id,
            analysis_type: prompt.analysis_type
          });
          return response.analysis;
          
        default:
          return 'Unknown AI assistance type';
      }
    } catch (error) {
      console.error('AI assist failed:', error);
      return `Error: ${error.message}`;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Code className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-400">Loading CodeForge AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Router>
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Top Navigation */}
        <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Code className="w-6 h-6 text-blue-500" />
                <span className="text-white font-semibold">CodeForge AI</span>
              </div>
              
              {currentProject && (
                <div className="text-gray-400 text-sm">
                  / {currentProject.name}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Credits: 100
              </Button>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.username}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProjectDashboard
                  projects={projects}
                  onProjectSelect={loadProjectData}
                  onProjectCreate={handleProjectCreate}
                  onProjectDelete={handleProjectDelete}
                  currentUser={user}
                />
              } 
            />
            <Route 
              path="/project/:id" 
              element={
                currentProject ? (
                  <div className="flex-1 flex">
                    {sidebarOpen && (
                      <div className="w-64">
                        <FileExplorer
                          projectTree={projectTree}
                          onFileSelect={handleFileSelect}
                          selectedFile={activeFile}
                          projectId={currentProject.id}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CodeEditor
                        files={projectFiles}
                        activeFile={activeFile}
                        onCodeChange={handleCodeChange}
                        onAIAssist={handleAIAssist}
                      />
                    </div>
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Authentication Screen Component
const AuthScreen = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = isLogin 
        ? await onLogin({ username: formData.username, password: formData.password })
        : await onRegister(formData);

      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Code className="w-8 h-8 text-blue-500 mr-2" />
            <span className="text-2xl font-bold text-white">CodeForge AI</span>
          </div>
          <CardTitle className="text-white">
            {isLogin ? 'Sign In' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'register'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger 
                value="login" 
                onClick={() => setIsLogin(true)}
                className="text-gray-300"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                onClick={() => setIsLogin(false)}
                className="text-gray-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              
              {!isLogin && (
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              )}
              
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
