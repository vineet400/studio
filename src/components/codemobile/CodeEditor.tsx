import type * as React from 'react';
import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

export type SupportedLanguage = 'html' | 'css' | 'javascript';

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  onCursorActivity: (cursorPosition: number, code: string) => void;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string, currentCode: string, cursorPosition: number) => void;
  isSuggestionsOpen: boolean;
  setSuggestionsOpen: (open: boolean) => void;
  isLoadingSuggestions: boolean;
}

export function CodeEditor({
  language,
  value,
  onChange,
  onCursorActivity,
  suggestions,
  onSuggestionSelect,
  isSuggestionsOpen,
  setSuggestionsOpen,
  isLoadingSuggestions,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    if (textareaRef.current) {
      onCursorActivity(textareaRef.current.selectionStart, event.target.value);
    }
  };
  
  const handleKeyUpOrClick = () => {
    if (textareaRef.current) {
      onCursorActivity(textareaRef.current.selectionStart, textareaRef.current.value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const currentValue = textareaRef.current.value;
      
      // Insert suggestion
      const newValue = currentValue.substring(0, cursorPosition) + suggestion + currentValue.substring(cursorPosition);
      onChange(newValue);
      
      // Manually update cursor position after insertion and focus
      // This needs to be done in a timeout to allow React to re-render
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = cursorPosition + suggestion.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          onCursorActivity(newCursorPosition, newValue); // Notify parent of new cursor pos
        }
      }, 0);
      
      setSuggestionsOpen(false);
    }
  };


  return (
    <Card className="h-full flex flex-col shadow-md rounded-lg overflow-hidden">
      <CardContent className="p-0 flex-1 relative">
        <Popover open={isSuggestionsOpen && suggestions.length > 0} onOpenChange={setSuggestionsOpen}>
          <PopoverAnchor asChild>
            <div className="w-full h-full"> {/* Anchor for Popover */}
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextAreaChange}
                onClick={handleKeyUpOrClick}
                onKeyUp={handleKeyUpOrClick}
                placeholder={`Enter ${language.toUpperCase()} code here...`}
                className="font-mono h-full w-full resize-none border-0 rounded-none p-3 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                spellCheck="false"
                aria-label={`${language} code editor`}
              />
            </div>
          </PopoverAnchor>
          <PopoverContent 
            className="w-[300px] p-0 shadow-xl rounded-md max-h-60 overflow-y-auto"
            align="start" // Adjust as needed, might need to be dynamic based on cursor
            side="bottom"   // Prefer bottom, but might need to adjust
            sideOffset={5}
          >
            {isLoadingSuggestions ? (
              <div className="p-3 text-sm text-muted-foreground">Loading suggestions...</div>
            ) : (
              <ul className="divide-y divide-border">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-150"
                    role="option"
                    aria-selected={false} // Can be enhanced with keyboard navigation
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
