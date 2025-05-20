import type * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
}

export function PreviewPanel({ html, css, js }: PreviewPanelProps) {
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const srcDoc = `
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script type="module">${js}</script>
          </body>
        </html>
      `;
      setIframeSrcDoc(srcDoc);
    }, 250); // Debounce update to avoid rapid iframe reloads

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-lg">Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <iframe
          srcDoc={iframeSrcDoc}
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0 bg-white"
          loading="lazy"
        />
      </CardContent>
    </Card>
  );
}
