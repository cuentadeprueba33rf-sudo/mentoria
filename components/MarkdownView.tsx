import React from 'react';

// A simple component to render text with basic markdown-like features
// In a full production app, use react-markdown and rehype-katex
export const MarkdownView: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="text-base leading-7 space-y-4">
      {content.split('\n\n').map((block, i) => {
        // Code Block
        if (block.startsWith('```')) {
          const codeContent = block.replace(/```\w*\n?/, '').replace(/```$/, '');
          return (
            <div key={i} className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4 shadow-inner">
              <pre>{codeContent}</pre>
            </div>
          );
        }
        
        // List
        if (block.match(/^[*-] /m)) {
             const listItems = block.split('\n').filter(l => l.trim().length > 0);
             return (
                 <ul key={i} className="list-disc pl-6 space-y-1">
                     {listItems.map((item, j) => (
                         <li key={j}>{item.replace(/^[*-] /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                     ))}
                 </ul>
             )
        }

        // Heading
        if (block.startsWith('##')) {
            return <h3 key={i} className="text-xl font-bold mt-4 mb-2 text-primary-600 dark:text-primary-400">{block.replace(/##\s*/, '')}</h3>
        }
        if (block.startsWith('#')) {
             return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">{block.replace(/#\s*/, '')}</h2>
        }

        // Standard Paragraph with Bold/Italic support
        const parts = block.split(/(\*\*.*?\*\*|`.*?`)/g);
        return (
          <p key={i} className="text-slate-700 dark:text-slate-300">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={j} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-500">{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};
