interface PriceRow {
  store: string;
  product: string;
  price: string;
  notes: string;
}

function parsePriceRows(rawTable: string): PriceRow[] {
  return rawTable
    .split('\n')
    .filter((line) => line.includes('|'))
    .map((line) => {
      const [store, product, price, notes] = line.split('|').map((s) => s.trim());
      return { store: store ?? '', product: product ?? '', price: price ?? '', notes: notes ?? '' };
    })
    .filter((row) => row.store && row.price);
}

function extractNumericPrice(priceStr: string): number {
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : Infinity;
}

export default function PriceCard({ rawTable }: { rawTable: string }) {
  const rows = parsePriceRows(rawTable);
  if (rows.length === 0) return null;

  const cheapest = rows.reduce((min, row) =>
    extractNumericPrice(row.price) < extractNumericPrice(min.price) ? row : min,
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
              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-800 last:border-0 ${
                    isBest ? 'bg-green-950/40' : ''
                  }`}
                >
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 font-medium text-zinc-200">
                    {isBest && (
                      <span className="text-green-400 text-[9px] sm:text-[10px] font-bold mr-1 sm:mr-1.5 bg-green-950 px-1 py-0.5 rounded">
                        BEST
                      </span>
                    )}
                    {row.store}
                  </td>
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 font-mono font-bold text-green-300 whitespace-nowrap">{row.price}</td>
                  <td className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-zinc-400 hidden sm:table-cell">{row.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
