export default function ToolCallIndicator({
  query,
  location,
}: {
  query?: string;
  location?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-zinc-400 py-1">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span>
        Searching for{query ? ` "${query}"` : ' prices'}
        {location ? ` near ${location}` : ''}...
      </span>
    </div>
  );
}
