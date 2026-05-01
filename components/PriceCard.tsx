interface PriceRow {
  store: string;
  product: string;
  price: string;
  notes: string;
  url: string;
}

function parsePriceRows(rawTable: string): PriceRow[] {
  return rawTable
    .split('\n')
    .filter((line) => line.includes('|'))
    .map((line) => {
      const [store, product, price, notes, url] = line.split('|').map((s) => s.trim());
      return {
        store: store ?? '',
        product: product ?? '',
        price: price ?? '',
        notes: notes ?? '',
        url: url ?? '',
      };
    })
    .filter((row) => row.store && row.price);
}

function extractNumericPrice(priceStr: string): number {
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : Infinity;
}

function isValidUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://');
}

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-3 h-3 inline-block"
  >
    <path
      fillRule="evenodd"
      d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export default function PriceCard({ rawTable }: { rawTable: string }) {
  const rows = parsePriceRows(rawTable);
  if (rows.length === 0) return null;

  const cheapest = rows.reduce(
    (min, row) => (extractNumericPrice(row.price) < extractNumericPrice(min.price) ? row : min),
    rows[0]
  );

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden mb-3 -mx-1">
      <div className="bg-red-900/30 border-b border-zinc-700 px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
        <span className="text-[10px] sm:text-xs font-semibold text-red-400 uppercase tracking-wide">
          Price Comparison
        </span>
        <span className="text-xs text-zinc-500">·</span>
        <span className="text-[10px] sm:text-xs text-zinc-400">{rows.length} stores found</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] sm:text-xs">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-zinc-400 font-medium">Store</th>
              <th className="text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-zinc-400 font-medium">Price</th>
              <th className="text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-zinc-400 font-medium hidden sm:table-cell">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isBest = row === cheapest;
              const hasLink = isValidUrl(row.url);
              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-800 last:border-0 ${isBest ? 'bg-green-950/40' : ''}`}
                >
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 font-medium text-zinc-200">
                    <span className="inline-flex items-center gap-1.5">
                      {isBest && (
                        <span className="text-green-400 text-[9px] sm:text-[10px] font-bold bg-green-950 px-1 py-0.5 rounded">
                          BEST
                        </span>
                      )}
                      {row.store}
                      {hasLink && (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="View source"
                        >
                          <ExternalLinkIcon />
                        </a>
                      )}
                    </span>
                  </td>
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 font-mono font-bold text-green-300 whitespace-nowrap">
                    {row.price}
                  </td>
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-zinc-400 hidden sm:table-cell">
                    {row.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
