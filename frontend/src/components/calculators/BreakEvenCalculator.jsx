import React, { useState } from "react";
import "./BreakEvenCalculator.css";

const BreakEvenCalculator = () => {
  const [fixedCosts, setFixedCosts] = useState("50000");
  const [variableCostPerUnit, setVariableCostPerUnit] = useState("30");
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState("80");
  const [targetProfit, setTargetProfit] = useState("0");
  const [result, setResult] = useState(null);

  const calculateBreakEven = () => {
    const fixed = Number(fixedCosts);
    const variable = Number(variableCostPerUnit);
    const price = Number(sellingPricePerUnit);
    const profit = Number(targetProfit);

    if (isNaN(fixed) || isNaN(variable) || isNaN(price) || isNaN(profit)) {
      alert("Lütfen geçerli sayısal değerler girin!");
      return;
    }

    if (fixed < 0 || variable < 0 || price <= 0) {
      alert("Geçersiz değerler! Maliyetler negatif olamaz.");
      return;
    }

    if (price <= variable) {
      alert("Satış fiyatı, birim değişken maliyetten büyük olmalıdır!");
      return;
    }

    // Katkı payı (Contribution Margin)
    const contributionMargin = price - variable;
    const contributionMarginRatio = (contributionMargin / price) * 100;

    // Break-Even Point (Units)
    const breakEvenUnits = Math.ceil(fixed / contributionMargin);

    // Break-Even Point (Revenue)
    const breakEvenRevenue = breakEvenUnits * price;

    // Hedef kâr için gerekli satış
    const unitsForTargetProfit = profit > 0 
      ? Math.ceil((fixed + profit) / contributionMargin)
      : breakEvenUnits;

    const revenueForTargetProfit = unitsForTargetProfit * price;

    // Maliyet analizi
    const totalCostAtBreakEven = fixed + (breakEvenUnits * variable);

    // Çeşitli satış senaryoları
    const scenarios = [
      { units: Math.floor(breakEvenUnits * 0.5), label: "%50 Kapasite" },
      { units: Math.floor(breakEvenUnits * 0.75), label: "%75 Kapasite" },
      { units: breakEvenUnits, label: "Break-Even" },
      { units: Math.floor(breakEvenUnits * 1.25), label: "%125 Kapasite" },
      { units: Math.floor(breakEvenUnits * 1.5), label: "%150 Kapasite" },
    ].map(scenario => {
      const revenue = scenario.units * price;
      const totalCost = fixed + (scenario.units * variable);
      const profit = revenue - totalCost;
      const profitMargin = (profit / revenue) * 100;

      return {
        ...scenario,
        revenue,
        totalCost,
        profit,
        profitMargin
      };
    });

    setResult({
      breakEvenUnits,
      breakEvenRevenue: breakEvenRevenue.toFixed(2),
      contributionMargin: contributionMargin.toFixed(2),
      contributionMarginRatio: contributionMarginRatio.toFixed(2),
      unitsForTargetProfit,
      revenueForTargetProfit: revenueForTargetProfit.toFixed(2),
      totalCostAtBreakEven: totalCostAtBreakEven.toFixed(2),
      scenarios
    });
  };

  return (
    <div className="breakeven-calculator-container">
      <h2>📊 Break-Even Analizi</h2>
      <p className="description">
        İşletmenizin başabaş noktasını hesaplayın. Ne kadar satış yapmalısınız ki maliyetleri karşılayasınız?
      </p>

      <div className="input-section">
        <h3>💰 Maliyet Bilgileri</h3>
        
        <div className="input-group">
          <label>Sabit Maliyetler (₺)</label>
          <input
            type="number"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(e.target.value)}
            placeholder="50000"
          />
          <small>Kira, maaş, sigorta gibi satış miktarından bağımsız maliyetler</small>
        </div>

        <div className="input-group">
          <label>Birim Değişken Maliyet (₺)</label>
          <input
            type="number"
            value={variableCostPerUnit}
            onChange={(e) => setVariableCostPerUnit(e.target.value)}
            placeholder="30"
          />
          <small>Her ürün için hammadde, paketleme, komisyon gibi maliyetler</small>
        </div>
      </div>

      <div className="input-section">
        <h3>💵 Satış Bilgileri</h3>
        
        <div className="input-group">
          <label>Birim Satış Fiyatı (₺)</label>
          <input
            type="number"
            value={sellingPricePerUnit}
            onChange={(e) => setSellingPricePerUnit(e.target.value)}
            placeholder="80"
          />
          <small>Her ürünü ne fiyata satıyorsunuz?</small>
        </div>

        <div className="input-group">
          <label>Hedef Kâr (₺) - İsteğe Bağlı</label>
          <input
            type="number"
            value={targetProfit}
            onChange={(e) => setTargetProfit(e.target.value)}
            placeholder="0"
          />
          <small>İstediğiniz kâr için kaç satış yapmanız gerektiğini hesaplar</small>
        </div>
      </div>

      <button className="calculate-button" onClick={calculateBreakEven}>
        🎯 Break-Even Hesapla
      </button>

      {result && (
        <div className="results-container">
          <div className="key-metrics">
            <div className="metric-card highlight">
              <div className="metric-icon">🎯</div>
              <div className="metric-label">Break-Even Noktası</div>
              <div className="metric-value">{result.breakEvenUnits} Adet</div>
              <div className="metric-sub">₺{Number(result.breakEvenRevenue).toLocaleString('tr-TR')} Ciro</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-label">Katkı Payı</div>
              <div className="metric-value">₺{result.contributionMargin}</div>
              <div className="metric-sub">%{result.contributionMarginRatio} Oran</div>
            </div>

            {Number(targetProfit) > 0 && (
              <div className="metric-card success">
                <div className="metric-icon">🎉</div>
                <div className="metric-label">Hedef Kâr İçin</div>
                <div className="metric-value">{result.unitsForTargetProfit} Adet</div>
                <div className="metric-sub">₺{Number(result.revenueForTargetProfit).toLocaleString('tr-TR')} Ciro</div>
              </div>
            )}
          </div>

          <div className="info-box">
            <h4>📋 Analiz Özeti</h4>
            <ul>
              <li>
                <strong>Break-Even Noktası:</strong> {result.breakEvenUnits} adet ürün satarak 
                ₺{Number(result.breakEvenRevenue).toLocaleString('tr-TR')} ciro yapmalısınız.
              </li>
              <li>
                <strong>Katkı Payı:</strong> Her satıştan ₺{result.contributionMargin} katkı payı elde ediyorsunuz.
                Bu miktar sabit maliyetlerinizi karşılamaya gidiyor.
              </li>
              <li>
                <strong>Break-Even'da Maliyet:</strong> ₺{Number(result.totalCostAtBreakEven).toLocaleString('tr-TR')}
              </li>
              {Number(targetProfit) > 0 && (
                <li>
                  <strong>Hedef Kâr:</strong> ₺{Number(targetProfit).toLocaleString('tr-TR')} kâr için 
                  {result.unitsForTargetProfit} adet satış yapmalısınız.
                </li>
              )}
            </ul>
          </div>

          <div className="scenarios-section">
            <h4>📈 Satış Senaryoları</h4>
            <div className="scenarios-table">
              <table>
                <thead>
                  <tr>
                    <th>Senaryo</th>
                    <th>Satış Miktarı</th>
                    <th>Ciro</th>
                    <th>Toplam Maliyet</th>
                    <th>Kâr/Zarar</th>
                    <th>Kar Marjı</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scenarios.map((scenario, index) => (
                    <tr key={index} className={scenario.profit >= 0 ? 'profit-row' : 'loss-row'}>
                      <td className="scenario-label">{scenario.label}</td>
                      <td>{scenario.units}</td>
                      <td>₺{scenario.revenue.toLocaleString('tr-TR')}</td>
                      <td>₺{scenario.totalCost.toLocaleString('tr-TR')}</td>
                      <td className={scenario.profit >= 0 ? 'profit' : 'loss'}>
                        {scenario.profit >= 0 ? '+' : ''}₺{scenario.profit.toLocaleString('tr-TR')}
                      </td>
                      <td>
                        {scenario.profit >= 0 ? '+' : ''}{scenario.profitMargin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tips-section">
            <h4>💡 İşletme Önerileri</h4>
            <div className="tips-grid">
              <div className="tip-card">
                <span className="tip-icon">📉</span>
                <div>
                  <strong>Maliyetleri Düşürün</strong>
                  <p>Sabit maliyetleri azaltmak break-even'ı düşürür</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">📈</span>
                <div>
                  <strong>Fiyat Artırın</strong>
                  <p>Satış fiyatı artışı katkı payını yükseltir</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">🔄</span>
                <div>
                  <strong>Hacmi Artırın</strong>
                  <p>Daha fazla satış yaparak kâra geçin</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">⚡</span>
                <div>
                  <strong>Verimliliği Artırın</strong>
                  <p>Birim değişken maliyeti düşürmeye çalışın</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakEvenCalculator;