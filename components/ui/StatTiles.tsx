type StatTile = {
  label: string;
  value: string | number;
};

type StatTilesProps = {
  items: StatTile[];
};

export default function StatTiles({ items }: StatTilesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div className="co-noise-card rounded-xl p-4" key={item.label}>
          <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
