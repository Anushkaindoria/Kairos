// 20 financial years: FY2006-07 ... FY2025-26. All values are annual % returns.
// Equity = Nifty 50 (price return, FY-end to FY-end)
// Gold   = Indian gold price (INR per 10g, FY-end to FY-end)
// Debt   = PPF rate (proxy for safe fixed-income / FD)
// Inflation = CPI average
// NOTE: Approximate figures for a prototype. FY26 values are estimates.

export const FY_LABELS = [
  "FY07","FY08","FY09","FY10","FY11","FY12","FY13","FY14","FY15","FY16",
  "FY17","FY18","FY19","FY20","FY21","FY22","FY23","FY24","FY25","FY26",
];

export type AssetKey = "equity" | "gold" | "debt";

export const RETURNS: Record<AssetKey | "inflation", number[]> = {
  equity: [12.3, 23.9, -36.2, 73.8, 11.1, -9.2, 7.3, 18.0, 26.7, -8.9,
           18.6, 10.2, 14.9, -26.0, 70.9, 18.9, -0.6, 28.6, 5.4, -4.5],
  gold:   [5.0, 36.0, 22.0, 11.0, 24.0, 35.0, 5.0, -3.0, -7.0, 9.0,
           2.0, 6.0, 4.0, 33.0, 1.0, 18.0, 13.0, 13.0, 34.0, 60.0],
  debt:   [8.0, 8.0, 8.0, 8.0, 8.0, 8.6, 8.8, 8.7, 8.7, 8.7,
           8.1, 7.9, 8.0, 7.9, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1],
  inflation: [6.7, 6.2, 9.1, 12.4, 10.4, 8.4, 10.2, 9.5, 5.9, 4.9,
              4.5, 3.6, 3.4, 4.8, 6.2, 5.5, 6.7, 5.4, 4.6, 2.1],
};

export const ASSET_META: Record<AssetKey, { label: string; color: string }> = {
  equity: { label: "Equity (Nifty 50)", color: "#2563eb" },
  gold: { label: "Gold", color: "#d97706" },
  debt: { label: "Debt (PPF/FD)", color: "#16a34a" },
};

export const cagr = (returns: number[]): number => {
  const growth = returns.reduce((acc, r) => acc * (1 + r / 100), 1);
  return (Math.pow(growth, 1 / returns.length) - 1) * 100;
};

export const stats = (returns: number[]) => {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const best = Math.max(...returns);
  const worst = Math.min(...returns);
  return {
    cagr: cagr(returns),
    best,
    bestFY: FY_LABELS[returns.indexOf(best)],
    worst,
    worstFY: FY_LABELS[returns.indexOf(worst)],
    volatility: Math.sqrt(variance),
    positiveYears: returns.filter((r) => r > 0).length,
  };
};

export const AVG_INFLATION = cagr(RETURNS.inflation);