import type * as React from 'react';
import { Save, Download, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ToolbarProps {
  onSave: () => void;
  onDownload: () => void;
  onRunPreview: () => void;
  isGenerating?: boolean;
}

export function Toolbar({ onSave, onDownload, onRunPreview, isGenerating = false }: ToolbarProps) {
  return (
    <div className="flex items-center space-x-2 p-3 border-b bg-card shadow-sm">
      <Button variant="ghost" size="sm" onClick={onSave} aria-label="Save to Local Storage">
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={onDownload} aria-label="Download as ZIP">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button 
        variant="default" 
        size="sm" 
        onClick={onRunPreview} 
        aria-label="Run Preview"
        className="bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={isGenerating}
      >
        {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        {isGenerating ? 'Updating...' : 'Run Preview'}
      </Button>
    </div>
  );
}
