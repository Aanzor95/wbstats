const QUICK_RANGES = [
  { key: "today", label: "Сегодня" },
  { key: "7", label: "7 дней" },
  { key: "30", label: "30 дней" },
  { key: "all", label: "Всё" },
];

export default function FiltersPanel({
  rangeKey,
  onRangeChange,
  dateFrom,
  dateTo,
  onDateChange,
  products,
  selectedProductId,
  onProductChange,
}) {
  return (
    <section className="panel filters-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Фильтры</p>
          <h2>Управление отчётом</h2>
        </div>
      </div>

      <div className="filters-panel__row">
        <div className="quick-ranges">
          {QUICK_RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              className={rangeKey === range.key ? "chip chip--active" : "chip"}
              onClick={() => onRangeChange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-grid">
        <label className="field">
          <span>Дата от</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => onDateChange("from", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Дата до</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onDateChange("to", event.target.value)}
          />
        </label>

        <label className="field field--wide">
          <span>Товар</span>
          <select value={selectedProductId} onChange={(event) => onProductChange(event.target.value)}>
            <option value="">Все товары</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
