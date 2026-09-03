// SIH Mining Vectorized Analytics & Anomaly Detection Engine

const MiningAnalytics = {
  // Compute descriptive statistics for numerical array
  calculateStats: function(data) {
    if (!data || data.length === 0) return null;
    
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    // Variance & Standard Deviation
    const sqDiffs = sorted.map(val => Math.pow(val - mean, 2));
    const variance = sqDiffs.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Quartiles
    const median = this.quantile(sorted, 0.50);
    const q1 = this.quantile(sorted, 0.25);
    const q3 = this.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    
    // Outlier boundaries (IQR Multiplier: 1.5)
    const lowerBound = Math.max(0, q1 - (1.5 * iqr));
    const upperBound = q3 + (1.5 * iqr);
    
    return {
      count: n,
      sum: sum,
      mean: mean,
      stdDev: stdDev,
      median: median,
      q1: q1,
      q3: q3,
      iqr: iqr,
      lowerBound: lowerBound,
      upperBound: upperBound
    };
  },

  // Quantile helper (R-7 interpolation)
  quantile: function(sortedArr, q) {
    const pos = (sortedArr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedArr[base + 1] !== undefined) {
      return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
    } else {
      return sortedArr[base];
    }
  },

  // Find operational outliers in colliery records
  detectAnomalies: function(collieries) {
    const productions = collieries.map(c => c.production);
    const stats = this.calculateStats(productions);
    
    const anomalies = [];
    collieries.forEach(c => {
      if (c.production < stats.lowerBound) {
        anomalies.push({
          mine: c.name,
          type: "LOW_OUTPUT",
          severity: "HIGH",
          production: c.production,
          threshold: stats.lowerBound,
          reason: "Production fell below lower IQR quartile fence."
        });
      } else if (c.production > stats.upperBound) {
        anomalies.push({
          mine: c.name,
          type: "SURGE_PRODUCTION",
          severity: "MEDIUM",
          production: c.production,
          threshold: stats.upperBound,
          reason: "Production exceeds upper IQR quartile boundary."
        });
      }
    });
    
    return { stats, anomalies };
  }
};

if (typeof window !== "undefined") {
  window.MiningAnalytics = MiningAnalytics;
}
