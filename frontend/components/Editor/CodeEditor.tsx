'use client';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  highlightLine?: number;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  height = '400px',
  readOnly = false,
  highlightLine
}: CodeEditorProps) {
  const monacoLang = language === 'c' || language === 'cpp' || language === 'c++' ? 'cpp' : 'python';

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-400 text-xs ml-2 font-mono">
          {language === 'python' ? 'script.py' : language === 'c' ? 'main.c' : 'main.cpp'}
        </span>
      </div>
      <MonacoEditor
        height={height}
        language={monacoLang}
        value={value}
        onChange={(v) => onChange(v || '')}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          automaticLayout: true
        }}
        onMount={(editor, monaco) => {
          if (highlightLine) {
            editor.revealLineInCenter(highlightLine);
            editor.deltaDecorations([], [{
              range: new monaco.Range(highlightLine, 1, highlightLine, 1),
              options: {
                isWholeLine: true,
                className: 'bg-yellow-500/20',
                glyphMarginClassName: 'bg-yellow-500'
              }
            }]);
          }
        }}
      />
    </div>
  );
}
