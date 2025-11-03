import React, { useState } from "react";
import "./NPVIRRCalculator.css";

const NPVIRRCalculator = () => {
  const [cashFlows, setCashFlows] = useState("-10000, 3000, 4000, 5000");
  const [discountRate, setDiscountRate] = useState("10");
  const [npv, setNpv] = useState(null);
  const [irr, setIrr] = useState(null);

  // ✅ Düzeltilmiş NPV hesaplaması
  const calculateNPV = () => {
    const rate = Number(discountRate) / 100;
    const flows = cashFlows.split(",").map(f => Number(f.trim()));

    if (flows.some(isNaN) || isNaN(rate)) {
      alert("Geçerli sayısal değerler girin!");
      return;
    }

    // Her akışı kendi dönemine göre iskonto et (t=0, t=1, t=2, ...)
    let npvValue = 0;
    for (let i = 0; i < flows.length; i++) {
      npvValue += flows[i] / Math.pow(1 + rate, i);
    }

    setNpv(npvValue.toFixed(2));
  };

  // ✅ Düzeltilmiş IRR hesaplaması
  const calculateIRR = () => {
    const flows = cashFlows.split(",").map(f => Number(f.trim()));
    
    if (flows.some(isNaN)) {
      alert("Geçerli sayısal değerler girin!");
      return;
    }
    
    if (!flows.some(f => f > 0) || !flows.some(f => f < 0)) {
      alert("IRR için en az bir pozitif ve bir negatif nakit akışı olmalı!");
      return;
    }

    const tolerance = 1e-7;
    const maxIterations = 1000;
    let rate = 0.1; // Başlangıç tahmini %10
    let iteration = 0;

    // NPV'yi verilen oran için hesapla
    const npvAt = r => {
      let total = 0;
      for (let i = 0; i < flows.length; i++) {
        total += flows[i] / Math.pow(1 + r, i);
      }
      return total;
    };

    // Newton-Raphson yöntemi ile IRR bul
    while (iteration < maxIterations) {
      const npv = npvAt(rate);
      const npvPlus = npvAt(rate + tolerance);
      const derivative = (npvPlus - npv) / tolerance;
      
      if (Math.abs(derivative) < 1e-10) break; // Türev çok küçükse dur
      
      const newRate = rate - npv / derivative;
      
      if (Math.abs(newRate - rate) < tolerance) {
        rate = newRate;
        break;
      }
      
      rate = newRate;
      iteration++;
    }

    if (iteration >= maxIterations) {
      alert("IRR hesaplanamadı. Farklı nakit akışları deneyin.");
      return;
    }

    setIrr((rate * 100).toFixed(2));
  };

  return (
    <div className="advanced-finance-container">
      <h2>📊 Gelişmiş Finansal Hesaplamalar</h2>

      <div className="input-group">
        <label>İskonto Oranı (%)</label>
        <input
          type="number"
          value={discountRate}
          onChange={(e) => setDiscountRate(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Nakit Akışları (virgülle ayır)</label>
        <input
          type="text"
          value={cashFlows}
          onChange={(e) => setCashFlows(e.target.value)}
        />
      </div>

      <div className="button-row">
        <button onClick={calculateNPV}>NPV Hesapla</button>
        <button onClick={calculateIRR}>IRR Hesapla</button>
      </div>

      {npv && (
        <div className="result-box">
          <p><strong>Net Bugünkü Değer (NPV):</strong> ₺{npv}</p>
        </div>
      )}

      {irr && (
        <div className="result-box">
          <p><strong>İç Verim Oranı (IRR):</strong> %{irr}</p>
        </div>
      )}
      
    </div>
  );
};

export default NPVIRRCalculator;