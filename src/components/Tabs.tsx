export interface TabItem<T> {
  value: T;
  label: string;
  badge?: number;
}

interface TabsProps<T> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string | number>({ items, value, onChange }: TabsProps<T>) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={item.value === value}
          className={`tab ${item.value === value ? "selected" : ""}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.badge ? <span className="count">{item.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}
