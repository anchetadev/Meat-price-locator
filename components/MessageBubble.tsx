'use client';

import { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import PriceCard from './PriceCard';
import ToolCallIndicator from './ToolCallIndicator';

interface Props {
  message: UIMessage;
}

function parsePriceBlock(text: string): { priceTable: string | null; cleanText: string } {
  const match = text.match(/---PRICES---\n([\s\S]*?)\n---END-PRICES---/);
  if (!match) return { priceTable: null, cleanText: text };
  const priceTable = match[1];
  const cleanText = text.replace(/---PRICES---\n[\s\S]*?\n---END-PRICES---\n?/, '').trim();
  return { priceTable, cleanText };
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-red-800 text-white rounded-br-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700'
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            const { priceTable, cleanText } = parsePriceBlock(part.text);
            return (
              <div key={i}>
                {priceTable && <PriceCard rawTable={priceTable} />}
                {cleanText && (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-zinc-100">{children}</li>,
                      code: ({ children }) => <code className="bg-zinc-700 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-red-400 hover:text-red-300">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {cleanText}
                  </ReactMarkdown>
                )}
              </div>
            );
          }

          // v6 tool part type is 'tool-{toolName}'
          if (part.type === 'tool-searchMeatPrices') {
            const toolPart = part as unknown as {
              type: 'tool-searchMeatPrices';
              state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
              input?: { query?: string; location?: string };
              output?: { resultCount?: number };
            };

            if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
              return (
                <ToolCallIndicator
                  key={i}
                  query={toolPart.input?.query}
                  location={toolPart.input?.location}
                />
              );
            }

            if (toolPart.state === 'output-available') {
              const count = toolPart.output?.resultCount ?? 0;
              return (
                <p key={i} className="text-xs text-zinc-500 italic py-0.5">
                  Found {count} source{count !== 1 ? 's' : ''}. Analyzing prices...
                </p>
              );
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}
