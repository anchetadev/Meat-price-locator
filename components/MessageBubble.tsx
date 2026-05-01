'use client';

import { UIMessage } from 'ai';
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
                {cleanText && <p className="whitespace-pre-wrap">{cleanText}</p>}
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
