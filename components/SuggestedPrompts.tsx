const PROMPTS = [
  "What's the cheapest ground beef near me?",
  'Compare chicken breast prices across stores',
  'Best steak deals this week',
  'Is salmon on sale anywhere nearby?',
  'Pork chop prices at Walmart vs Kroger',
  'Where can I find the cheapest whole chicken?',
];

interface Props {
  onSelect: (prompt: string) => void;
  location: string | null;
}

export default function SuggestedPrompts({ onSelect, location }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-8 text-center px-4 py-4 sm:py-8">
      <div>
        <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🥩</div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">Meat Price Scout</h2>
        <p className="text-zinc-400 text-sm mt-1.5 sm:mt-2 max-w-xs sm:max-w-sm">
          {location
            ? `Ask me about meat prices near ${location}`
            : 'Set your location below to find local prices'}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full max-w-lg">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-red-800
                       text-zinc-300 hover:text-white rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2
                       text-xs sm:text-sm transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
