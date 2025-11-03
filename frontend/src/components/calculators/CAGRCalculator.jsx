import React, { useState } from "react";
import "./CAGRCalculator.css";

const CAGRCalculator = () => {
  const [initialValue, setInitialValue] = useState("10000");
  const [finalValue, setFinalValue] = useState("16000");
  const [years, setYears] = useState("4");
  const [result, setResult] = useState(null);

  const calculateCAGR = () => {
    const initial = Number(initialValue);
    const final = Number(finalValue);
    const period = Number(years);

    if (isNaN(initial) || isNaN(final) || isNaN(period)) {
      alert("Lütfen geçerli sayısal değerler girin!");
      return;
    }

    if (initial <= 0 || final <= 0 || period <= 0) {
      alert("Değerler sıfırdan büyük olmalıdır!");
      return;
    }

    // CAGR Formülü: ((Final/Initial)^(1/years) - 1) * 100
    const cagr = (Math.pow(final / initial, 1 / period) - 1) * 100;
    const totalReturn = ((final - initial) / initial) * 100;
    const totalGain = final - initial;

    // Yıllık büyüme simülasyonu
    const yearlyGrowth = [];
    let currentValue = initial;
    
    for (let year = 0; year <= period; year++) {
      yearlyGrowth.push({
        year: year,
        value: year === 0 ? initial : currentValue * Math.pow(1 + cagr / 100, 1),
        displayValue: year === 0 ? initial : currentValue * Math.pow(1 + cagr / 100, 1)
      });
      if (year < period) {
        currentValue = currentValue * (1 + cagr / 100);
      }
    }

    setResult({
      cagr: cagr.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      totalGain: totalGain.toFixed(2),
      yearlyGrowth: yearlyGrowth
    });
  };

  const getPerformanceColor = (cagr) => {
    if (cagr >= 15) return "#27ae60"; // Mükemmel
    if (cagr >= 10) return "#2ecc71"; // İyi
    if (cagr >= 5) return "#f39c12";  // Orta
    if (cagr >= 0) return "#e67e22";  // Zayıf
    return "#e74c3c"; // Negatif
  };

  const getPerformanceText = (cagr) => {
    if (cagr >= 15) return "🔥 Mükemmel Performans";
    if (cagr >= 10) return "✅ İyi Performans";
    if (cagr >= 5) return "📊 Orta Performans";
    if (cagr >= 0) return "⚠️ Zayıf Performans";
    return "❌ Negatif Getiri";
  };

  return (
    <div className="cagr-calculator-container">
      <h2>📈 CAGR Hesaplayıcı</h2>
      <p className="description">
        Yatırımınızın yıllık ortalama büyüme oranını (CAGR) hesaplayın ve performansını analiz edin.
      </p>

      <div className="input-group">
        <label>Başlangıç Değeri (₺)</label>
        <input
          type="number"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
          placeholder="10000"
        />
      </div>

      <div className="input-group">
        <label>Bitiş Değeri (₺)</label>
        <input
          type="number"
          value={finalValue}
          onChange={(e) => setFinalValue(e.target.value)}
          placeholder="16000"
        />
      </div>

      <div className="input-group">
        <label>Yatırım Süresi (Yıl)</label>
        <input
          type="number"
          step="0.1"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          placeholder="4"
        />
        <small>Ondalık değer girebilirsiniz (örn: 2.5 yıl)</small>
      </div>

      <button className="calculate-button" onClick={calculateCAGR}>
        🎯 CAGR Hesapla
      </button>

      {result && (
        <div className="results-container">
          <div 
            className="result-card highlight"
            style={{ background: `linear-gradient(135deg, ${getPerformanceColor(Number(result.cagr))} 0%, ${getPerformanceColor(Number(result.cagr))}dd 100%)` }}
          >
            <div className="result-label">Bileşik Yıllık Büyüme Oranı (CAGR)</div>
            <div className="result-value">%{result.cagr}</div>
            <div className="performance-badge">{getPerformanceText(Number(result.cagr))}</div>
          </div>

          <div className="result-row">
            <div className="result-card">
              <div className="result-label">Toplam Getiri</div>
              <div className="result-value" style={{ color: Number(result.totalReturn) >= 0 ? '#27ae60' : '#e74c3c' }}>
                %{result.totalReturn}
              </div>
            </div>

            <div className="result-card">
              <div className="result-label">Kazanç/Kayıp</div>
              <div className="result-value" style={{ color: Number(result.totalGain) >= 0 ? '#27ae60' : '#e74c3c' }}>
                ₺{Number(result.totalGain).toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          <div className="info-box">
            <p>
              <strong>📊 Analiz:</strong> Yatırımınız {years} yıl boyunca yılda ortalama 
              <strong> %{result.cagr}</strong> büyüdü. Başlangıç değeri 
              ₺{Number(initialValue).toLocaleString('tr-TR')} iken, 
              ₺{Number(finalValue).toLocaleString('tr-TR')} değere ulaştı.
            </p>
          </div>

          <div className="yearly-growth-section">
            <h4>📅 Yıllık Büyüme Simülasyonu</h4>
            <div className="growth-timeline">
              {result.yearlyGrowth.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-year">Yıl {item.year}</div>
                  <div className="timeline-value">
                    ₺{item.displayValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </div>
                  {index < result.yearlyGrowth.length - 1 && (
                    <div className="timeline-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="benchmark-section">
            <h4>🎯 Kıyaslama</h4>
            <div className="benchmark-grid">
              <div className="benchmark-item">
                <span>Enflasyon (avg)</span>
                <span className="benchmark-value">~%40-60</span>
              </div>
              <div className="benchmark-item">
                <span>Altın (5 yıl avg)</span>
                <span className="benchmark-value">~%30-35</span>
              </div>
              <div className="benchmark-item">
                <span>BIST 100 (5 yıl avg)</span>
                <span className="benchmark-value">~%25-35</span>
              </div>
              <div className="benchmark-item">
                <span>Vadeli Mevduat</span>
                <span className="benchmark-value">~%35-50</span>
              </div>
            </div>
            <small className="benchmark-note">* Ortalama değerlerdir, dönemlere göre değişir</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default CAGRCalculator;