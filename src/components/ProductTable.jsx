import { formatCurrency, formatInteger } from "../lib/formatters";

export default function ProductTable({ products }) {
  return (
    <section className="panel table-panel">
      <div className="panel__header panel__header--table">
        <div>
          <p className="eyebrow">Каталог</p>
          <h2>Товары магазина</h2>
        </div>
        <div className="panel__meta">Найдено товаров: {formatInteger(products.length)}</div>
      </div>

      <div className="table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Продажи</th>
              <th>Заказы</th>
              <th>Продано</th>
              <th>Комиссия</th>
              <th>Логистика</th>
              <th>Хранение</th>
              <th>Штрафы</th>
              <th>Итог</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-name">{product.name}</div>
                  <div className="product-meta">WB ID: {product.id}</div>
                </td>
                <td>{formatCurrency(product.sales)}</td>
                <td>{formatInteger(product.ordersCount)}</td>
                <td>{formatInteger(product.soldItems)}</td>
                <td>{formatCurrency(product.commission)}</td>
                <td>{formatCurrency(product.logistics)}</td>
                <td>{formatCurrency(product.storage)}</td>
                <td>{formatCurrency(product.fines)}</td>
                <td>{formatCurrency(product.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
