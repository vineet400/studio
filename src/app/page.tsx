"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from '@/components/codemobile/Toolbar';
import { CodeEditor, SupportedLanguage } from '@/components/codemobile/CodeEditor';
import { PreviewPanel } from '@/components/codemobile/PreviewPanel';
import { useDebounce } from '@/hooks/useDebounce';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '@/lib/localStorageUtils';
import { codeCompletion, type CodeCompletionInput } from '@/ai/flows/code-completion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  html: 'codemobile_html',
  css: 'codemobile_css',
  js: 'codemobile_js',
};

const INITIAL_HTML = `<h1>Hello, Codemobile!</h1>
<p>Edit the HTML, CSS, and JavaScript to see live updates.</p>
<button id="myButton">Click Me</button>`;
const INITIAL_CSS = `body {
  font-family: sans-serif;
  padding: 20px;
  background-color: #f0f0f0;
  color: #333;
}
h1 {
  color: var(--primary); /* Using a CSS variable from the app's theme */
}
button {
  padding: 10px 15px;
  background-color: var(--accent); /* Using accent color */
  color: var(--accent-foreground);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #76c876; /* Darker green on hover */
}`;
const INITIAL_JS = `const button = document.getElementById('myButton');
button.addEventListener('click', () => {
  alert('Button clicked!');
});
console.log('Codemobile JS Loaded!');`;


export default function CodemobilePage() {
  const { toast } = useToast();

  const [htmlCode, setHtmlCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [jsCode, setJsCode] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('html');
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [currentCursorPos, setCurrentCursorPos] = useState<number>(0);

  const debouncedHtml = useDebounce(htmlCode, 500);
  const debouncedCss = useDebounce(cssCode, 500);
  const debouncedJs = useDebounce(jsCode, 500);

  const [liveHtml, setLiveHtml] = useState(htmlCode);
  const [liveCss, setLiveCss] = useState(cssCode);
  const [liveJs, setLiveJs] = useState(jsCode);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setHtmlCode(loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.html, INITIAL_HTML));
    setCssCode(loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.css, INITIAL_CSS));
    setJsCode(loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.js, INITIAL_JS));
  }, []);
  
  useEffect(() => {
    if(isClient) saveStateToLocalStorage(LOCAL_STORAGE_KEYS.html, htmlCode);
  }, [htmlCode, isClient]);
  useEffect(() => {
    if(isClient) saveStateToLocalStorage(LOCAL_STORAGE_KEYS.css, cssCode);
  }, [cssCode, isClient]);
  useEffect(() => {
    if(isClient) saveStateToLocalStorage(LOCAL_STORAGE_KEYS.js, jsCode);
  }, [jsCode, isClient]);

  const handleRunPreview = useCallback(() => {
    setLiveHtml(htmlCode);
    setLiveCss(cssCode);
    setLiveJs(jsCode);
    toast({ title: "Preview Updated", description: "Live preview has been refreshed." });
  }, [htmlCode, cssCode, jsCode, toast]);

  useEffect(() => {
    handleRunPreview();
  }, [debouncedHtml, debouncedCss, debouncedJs, handleRunPreview]);


  const handleSaveToLocalStorage = () => {
    saveStateToLocalStorage(LOCAL_STORAGE_KEYS.html, htmlCode);
    saveStateToLocalStorage(LOCAL_STORAGE_KEYS.css, cssCode);
    saveStateToLocalStorage(LOCAL_STORAGE_KEYS.js, jsCode);
    toast({ title: "Code Saved!", description: "Your code has been saved to local storage." });
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file("index.html", htmlCode);
    zip.file("style.css", cssCode);
    zip.file("script.js", jsCode);
    
    // Add a basic HTML file that links the CSS and JS
    const linkedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codemobile Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    ${htmlCode}
    <script src="script.js"></script>
</body>
</html>`;
    zip.file("index.html", linkedHtml);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "codemobile-project.zip");
      toast({ title: "Download Started", description: "Your project is being downloaded as a ZIP file." });
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      toast({ title: "Download Failed", description: "Could not generate ZIP file.", variant: "destructive" });
    }
  };
  
  const fetchSuggestions = useCallback(async (language: SupportedLanguage, code: string, cursorPosition: number) => {
    if (!code.trim() && cursorPosition === 0) { // Don't fetch for empty editor unless user types
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const input: CodeCompletionInput = { code, language, cursorPosition };
      const result = await codeCompletion(input);
      setSuggestions(result.suggestions || []);
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestionsOpen(true);
      } else {
        setSuggestionsOpen(false);
      }
    } catch (error) {
      console.error("Error fetching code suggestions:", error);
      setSuggestions([]);
      setSuggestionsOpen(false);
      toast({ title: "AI Error", description: "Could not fetch suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toast]);

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 750);

  const handleCursorActivity = useCallback((cursorPosition: number, currentCode: string) => {
    setCurrentCursorPos(cursorPosition);
    debouncedFetchSuggestions(activeTab, currentCode, cursorPosition);
  }, [activeTab, debouncedFetchSuggestions]);

  const handleSuggestionSelect = (suggestion: string, currentCode: string, cursorPosition: number) => {
    const newCode = currentCode.substring(0, cursorPosition) + suggestion + currentCode.substring(cursorPosition);
    const newCursorPos = cursorPosition + suggestion.length;

    if (activeTab === 'html') setHtmlCode(newCode);
    else if (activeTab === 'css') setCssCode(newCode);
    else if (activeTab === 'javascript') setJsCode(newCode);
    
    // This is tricky because CodeEditor also tries to set cursor.
    // Let CodeEditor handle its own cursor update after insertion for now.
    // Then trigger a new suggestion fetch if needed.
    setTimeout(() => { // allow state to update
      handleCursorActivity(newCursorPos, newCode);
    }, 0);

    setSuggestionsOpen(false);
  };


  const codeEditorProps = {
    suggestions,
    onSuggestionSelect: handleSuggestionSelect,
    isSuggestionsOpen,
    setSuggestionsOpen,
    isLoadingSuggestions,
    onCursorActivity: handleCursorActivity,
  };

  if (!isClient) {
    // Render minimal UI or loading state during SSR/SSG build or before hydration
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading Codemobile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Toolbar 
        onSave={handleSaveToLocalStorage} 
        onDownload={handleDownloadZip}
        onRunPreview={handleRunPreview}
        isGenerating={isLoadingSuggestions}
      />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-3/5 flex flex-col p-1 md:p-2 space-y-1 md:space-y-2 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SupportedLanguage)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 sticky top-0 bg-background z-10 px-1 py-1.5 h-auto">
              <TabsTrigger value="html" className="px-3 py-1.5 text-sm">HTML</TabsTrigger>
              <TabsTrigger value="css" className="px-3 py-1.5 text-sm">CSS</TabsTrigger>
              <TabsTrigger value="javascript" className="px-3 py-1.5 text-sm">JavaScript</TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="flex-1 mt-0 min-h-0">
              <CodeEditor language="html" value={htmlCode} onChange={setHtmlCode} {...codeEditorProps} />
            </TabsContent>
            <TabsContent value="css" className="flex-1 mt-0 min-h-0">
              <CodeEditor language="css" value={cssCode} onChange={setCssCode} {...codeEditorProps} />
            </TabsContent>
            <TabsContent value="javascript" className="flex-1 mt-0 min-h-0">
              <CodeEditor language="javascript" value={jsCode} onChange={setJsCode} {...codeEditorProps} />
            </TabsContent>
          </Tabs>
        </div>
        
        <Separator orientation="vertical" className="hidden md:block mx-0.5" />

        <div className="w-full md:w-2/5 p-1 md:p-2 overflow-y-auto flex flex-col">
          <PreviewPanel html={liveHtml} css={liveCss} js={liveJs} />
        </div>
      </div>
    </div>
  );
}
