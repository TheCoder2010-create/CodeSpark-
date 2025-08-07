import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  Code,
  Users,
  Star,
  GitBranch,
  Clock,
  Folder,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ProjectDashboard = ({ 
  projects = [], 
  onProjectSelect, 
  onProjectCreate, 
  onProjectDelete,
  onProjectUpdate,
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by language
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(project => project.language === filterLanguage);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterLanguage]);

  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      python: 'bg-green-500',
      java: 'bg-orange-500',
      cpp: 'bg-purple-500',
      csharp: 'bg-indigo-500',
      php: 'bg-purple-600',
      ruby: 'bg-red-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-600',
      html: 'bg-orange-400',
      css: 'bg-blue-400'
    };
    return colors[language] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUniqueLanguages = () => {
    const languages = [...new Set(projects.map(p => p.language))];
    return languages.filter(Boolean);
  };

  return (
    <div className="h-full bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
          <p className="text-gray-400">Manage your coding projects with AI assistance</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Project</DialogTitle>
            </DialogHeader>
            <CreateProjectForm 
              onSubmit={(projectData) => {
                onProjectCreate(projectData);
                setShowCreateDialog(false);
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              {filterLanguage === 'all' ? 'All Languages' : filterLanguage}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700">
            <DropdownMenuItem 
              onClick={() => setFilterLanguage('all')}
              className="text-gray-300"
            >
              All Languages
            </DropdownMenuItem>
            {getUniqueLanguages().map(language => (
              <DropdownMenuItem
                key={language}
                onClick={() => setFilterLanguage(language)}
                className="text-gray-300"
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${getLanguageColor(language)}`} />
                {language}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {searchTerm || filterLanguage !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterLanguage !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first project to get started'
            }
          </p>
          {!searchTerm && filterLanguage === 'all' && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => onProjectSelect(project)}
              onDelete={() => onProjectDelete(project)}
              onUpdate={onProjectUpdate}
              getLanguageColor={getLanguageColor}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ 
  project, 
  onSelect, 
  onDelete, 
  onUpdate, 
  getLanguageColor, 
  formatDate 
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={onSelect}>
            <CardTitle className="text-white text-lg mb-1 group-hover:text-blue-400 transition-colors">
              {project.name}
            </CardTitle>
            <p className="text-gray-400 text-sm line-clamp-2">
              {project.description || 'No description'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={onSelect} className="text-gray-300">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdate(project)} className="text-gray-300">
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project)}
                className="text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0" onClick={onSelect}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getLanguageColor(project.language)}`} />
            <span className="text-sm text-gray-400 capitalize">{project.language}</span>
          </div>
          
          {project.is_public && (
            <Badge variant="outline" className="text-xs border-green-600 text-green-400">
              Public
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Updated {formatDate(project.updated_at)}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Code className="w-3 h-3 mr-1" />
              <span>0</span>
            </div>
            <div className="flex items-center">
              <GitBranch className="w-3 h-3 mr-1" />
              <span>main</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateProjectForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'javascript',
    is_public: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          className="bg-gray-700 border-gray-600 text-white"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your project"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm resize-none h-20"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Primary Language
        </label>
        <select
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="is_public" className="text-sm text-gray-300">
          Make this project public
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Create Project
        </Button>
      </div>
    </form>
  );
};

export default ProjectDashboard;

