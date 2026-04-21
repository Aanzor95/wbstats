import { useEffect, useMemo, useState } from "react";
import FiltersPanel from "./components/FiltersPanel";
import ProductTable from "./components/ProductTable";
import StatCard from "./components/StatCard";
import { fetchReportDetails, WB_REPORTS_AVAILABLE_FROM } from "./api/wb";
import { aggregateDashboard } from "./lib/aggregations";
import { formatCurrency, formatInteger } from "./lib/formatters";

function toIsoDate(value) {
  return value.toISOString().slice(0, 10);
}

function getInitialRange(rangeKey) {
  const today = new Date();
  const end = toIsoDate(today);

  if (rangeKey === "today") {
    return { from: end, to: end };
  }

  if (rangeKey === "7") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { from: toIsoDate(start), to: end };
  }

  if (rangeKey === "30") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { from: toIsoDate(start), to: end };
  }

  return { from: WB_REPORTS_AVAILABLE_FROM, to: end };
}

const TOKEN = import.meta.env.VITE_WB_API_TOKEN || "";

export default function App() {
  const [rangeKey, setRangeKey] = useState("all");
  const [dateRange, setDateRange] = useState(() => getInitialRange("all"));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setDateRange(getInitialRange(rangeKey));
  }, [rangeKey]);

  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const data = await fetchReportDetails({
          token: TOKEN,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          signal: controller.signal,
        });

        if (!isCancelled) {
          setRows(data);
          setStatus("success");
        }
      } catch (loadError) {
        if (controller.signal.aborted || isCancelled) {
          return;
        }

        setRows([]);
        setStatus("error");
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить данные");
      }
    }

    load();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    setSelectedProductId("");
  }, [dateRange.from, dateRange.to]);

  const dashboard = useMemo(() => aggregateDashboard(rows, selectedProductId), [rows, selectedProductId]);

  const statCards = [
    { title: "Продажи", value: formatCurrency(dashboard.stats.sales), tone: "accent" },
    { title: "Количество заказов", value: formatInteger(dashboard.stats.ordersCount) },
    { title: "Продано товаров", value: formatInteger(dashboard.stats.soldItems) },
    { title: "Комиссия WB", value: formatCurrency(dashboard.stats.commission), tone: "default" },
    { title: "Логистика", value: formatCurrency(dashboard.stats.logistics), tone: "default" },
    { title: "Хранение", value: formatCurrency(dashboard.stats.storage), tone: "default" },
    { title: "Приёмка", value: formatCurrency(dashboard.stats.acceptance), tone: "default" },
    { title: "Штрафы", value: formatCurrency(dashboard.stats.fines), tone: "warning" },
    { title: "Доплаты", value: formatCurrency(dashboard.stats.extraPayments), tone: "success" },
    { title: "Удержания", value: formatCurrency(dashboard.stats.deductions), tone: "default" },
    { title: "ИТОГО", value: formatCurrency(dashboard.stats.total), tone: "dark" },
  ];

  return (
    <div className="app-shell">
      <div className="background-blur background-blur--one" />
      <div className="background-blur background-blur--two" />

      {status === "loading" ? (
        <div className="loading-modal" role="dialog" aria-modal="true" aria-labelledby="loading-title">
          <div className="loading-modal__backdrop" />
          <div className="loading-modal__card">
            <div className="loading-modal__spinner" aria-hidden="true" />
            <h2 id="loading-title">Загрузка данных</h2>
            <p>Подключаюсь к WB API и собираю статистику. Это может занять несколько секунд.</p>
          </div>
        </div>
      ) : null}

      <main className="dashboard-layout">
        <section className="stats-grid stats-grid--top">
          {statCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} tone={card.tone} />
          ))}
        </section>

        <FiltersPanel
          rangeKey={rangeKey}
          onRangeChange={setRangeKey}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          onDateChange={(key, value) => {
            setRangeKey("custom");
            setDateRange((current) => ({ ...current, [key === "from" ? "from" : "to"]: value }));
          }}
          products={dashboard.products}
          selectedProductId={selectedProductId}
          onProductChange={setSelectedProductId}
        />

        {status === "error" ? (
          <section className="panel state-panel state-panel--error">
            <h2>Не удалось загрузить данные</h2>
            <p>{error}</p>
            <p className="state-panel__hint">
              Если это лимит WB API, подождите немного и обновите страницу. Дашборд теперь делает меньше повторных запросов и не дублирует их в dev-режиме.
            </p>
          </section>
        ) : null}

        <ProductTable products={dashboard.visibleProducts} />
      </main>
    </div>
  );
}
