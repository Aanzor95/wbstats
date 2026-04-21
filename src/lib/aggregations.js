function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSaleRow(row) {
  return String(row.doc_type_name || "").trim().toLowerCase() === "продажа";
}

function getProductId(row) {
  return row.nm_id || row.nmId || row.nmID || row.subject_code || row.supplier_article || row.sa_name || "unknown";
}

function pickNonEmpty(...values) {
  return values
    .map((value) => String(value || "").trim())
    .find(Boolean);
}

function buildCompositeName(row) {
  const brand = pickNonEmpty(row.brand_name, row.brand, row.brandName);
  const subject = pickNonEmpty(row.subject_name, row.object, row.subjectName);
  const article = pickNonEmpty(row.supplier_article, row.vendor_code, row.vendorCode, row.sa_name);

  const parts = [brand, subject, article].filter(Boolean);
  if (parts.length) {
    return parts.join(" / ");
  }

  return "";
}

function getProductName(row) {
  return (
    pickNonEmpty(
      row.title,
      row.name,
      row.tech_size,
      row.subject_name,
      row.brand_name,
      row.supplier_article,
      row.sa_name,
      buildCompositeName(row),
    ) || `Товар ${getProductId(row)}`
  );
}

function getOrderId(row) {
  return String(row.srid || row.rid || row.odid || "").trim();
}

function createEmptyStats() {
  return {
    sales: 0,
    ordersCount: 0,
    soldItems: 0,
    commission: 0,
    logistics: 0,
    storage: 0,
    acceptance: 0,
    fines: 0,
    extraPayments: 0,
    deductions: 0,
    total: 0,
  };
}

function finalizeStats(stats) {
  stats.total =
    stats.sales -
    stats.commission -
    stats.logistics -
    stats.storage -
    stats.acceptance -
    stats.fines +
    stats.extraPayments -
    stats.deductions;

  return stats;
}

export function aggregateDashboard(rows, selectedProductId) {
  const productMap = new Map();
  const globalOrderIds = new Set();

  for (const row of rows) {
    const productId = String(getProductId(row));
    const productName = getProductName(row);
    const productStats = productMap.get(productId) || {
      id: productId,
      name: productName,
      sales: 0,
      ordersCount: 0,
      soldItems: 0,
      commission: 0,
      logistics: 0,
      storage: 0,
      acceptance: 0,
      fines: 0,
      extraPayments: 0,
      deductions: 0,
      total: 0,
      _orderIds: new Set(),
    };

    if (!productStats.name || productStats.name.startsWith("Товар ")) {
      productStats.name = productName;
    }

    productStats.sales += toNumber(row.retail_price_withdisc_rub);
    productStats.commission += toNumber(row.ppvz_sales_commission);
    productStats.logistics += toNumber(row.rebill_logistic_cost);
    productStats.storage += toNumber(row.storage_fee);
    productStats.acceptance += toNumber(row.acceptance);
    productStats.fines += toNumber(row.penalty);
    productStats.extraPayments += toNumber(row.additional_payment);
    productStats.deductions += toNumber(row.deduction);

    if (isSaleRow(row)) {
      productStats.soldItems += toNumber(row.quantity);
      const orderId = getOrderId(row);
      if (orderId) {
        productStats._orderIds.add(orderId);
        globalOrderIds.add(orderId);
      } else {
        productStats.ordersCount += 1;
      }
    }

    productMap.set(productId, productStats);
  }

  const products = Array.from(productMap.values()).map((product) => {
    const ordersCount = product.ordersCount + product._orderIds.size;
    const stats = {
      ...product,
      ordersCount,
      total:
        product.sales -
        product.commission -
        product.logistics -
        product.storage -
        product.acceptance -
        product.fines +
        product.extraPayments -
        product.deductions,
    };
    delete stats._orderIds;
    return stats;
  });

  products.sort((a, b) => b.sales - a.sales);

  const visibleProducts = selectedProductId
    ? products.filter((product) => product.id === selectedProductId)
    : products;

  const stats = createEmptyStats();
  for (const product of visibleProducts) {
    stats.sales += product.sales;
    stats.ordersCount += product.ordersCount;
    stats.soldItems += product.soldItems;
    stats.commission += product.commission;
    stats.logistics += product.logistics;
    stats.storage += product.storage;
    stats.acceptance += product.acceptance;
    stats.fines += product.fines;
    stats.extraPayments += product.extraPayments;
    stats.deductions += product.deductions;
  }

  if (!selectedProductId) {
    stats.ordersCount = globalOrderIds.size || stats.ordersCount;
  }

  return {
    stats: finalizeStats(stats),
    products,
    visibleProducts,
  };
}
