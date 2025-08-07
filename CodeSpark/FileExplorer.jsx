import { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Edit,
  Download,
  Upload,
  Search,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FileExplorer = ({ 
  projectTree = {}, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  onFileRename,
  selectedFile,
  projectId 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTree, setFilteredTree] = useState(projectTree);

  useEffect(() => {
    if (searchTerm) {
      const filtered = filterTree(projectTree, searchTerm.toLowerCase());
      setFilteredTree(filtered);
    } else {
      setFilteredTree(projectTree);
    }
  }, [projectTree, searchTerm]);

  const filterTree = (tree, term) => {
    const filtered = {};
    
    Object.keys(tree).forEach(key => {
      const item = tree[key];
      
      if (item.type === 'file') {
        if (key.toLowerCase().includes(term) || item.path.toLowerCase().includes(term)) {
          filtered[key] = item;
        }
      } else if (item.type === 'directory') {
        const filteredChildren = filterTree(item.children || {}, term);
        if (Object.keys(filteredChildren).length > 0 || key.toLowerCase().includes(term)) {
          filtered[key] = {
            ...item,
            children: filteredChildren
          };
        }
      }
    });
    
    return filtered;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileSelect = (file) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'cs': '🔷',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'json': '📋',
      'xml': '📄',
      'md': '📝',
      'sql': '🗃️',
      'sh': '⚡',
      'yml': '⚙️',
      'yaml': '⚙️'
    };
    return iconMap[ext] || '📄';
  };

  const renderTreeItem = (key, item, path = '', level = 0) => {
    const fullPath = path ? `${path}/${key}` : key;
    const isExpanded = expandedFolders.has(fullPath);
    const isSelected = selectedFile && selectedFile.path === item.path;

    if (item.type === 'directory') {
      return (
        <div key={fullPath}>
          <div
            className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer group ${
              level > 0 ? `ml-${level * 4}` : ''
            }`}
            onClick={() => toggleFolder(fullPath)}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <div className="flex items-center flex-1">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400 mr-1" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400 mr-1" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400 mr-2" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400 mr-2" />
              )}
              <span className="text-sm text-gray-300 truncate">{key}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onFileCreate && onFileCreate(fullPath, 'file')}>
                  <FileText className="w-4 h-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFileCreate && onFileCreate(fullPath, 'folder')}>
                  <Folder className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFileRename && onFileRename(item)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onFileDelete && onFileDelete(item)}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isExpanded && item.children && (
            <div>
              {Object.keys(item.children).map(childKey =>
                renderTreeItem(childKey, item.children[childKey], fullPath, level + 1)
              )}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={fullPath}
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer group ${
            isSelected ? 'bg-blue-600' : ''
          }`}
          onClick={() => handleFileSelect(item)}
          style={{ paddingLeft: `${level * 16 + 24}px` }}
        >
          <div className="flex items-center flex-1">
            <span className="mr-2 text-sm">{getFileIcon(key)}</span>
            <span className="text-sm text-gray-300 truncate">{key}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onFileRename && onFileRename(item)}>
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadFile(item)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onFileDelete && onFileDelete(item)}
                className="text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
  };

  const handleDownloadFile = (file) => {
    const blob = new Blob([file.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_path.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-300">Explorer</h2>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileCreate && onFileCreate('', 'file')}
              className="h-6 w-6 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileCreate && onFileCreate('', 'folder')}
              className="h-6 w-6 p-0"
            >
              <Folder className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-xs bg-gray-700 border-gray-600 text-gray-300"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(filteredTree).length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No files found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="py-2">
            {Object.keys(filteredTree).map(key =>
              renderTreeItem(key, filteredTree[key])
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {Object.keys(filteredTree).length} items
          </span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
              title="Upload files"
            >
              <Upload className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;

