import React, { useState } from "react";
import "./FinancialRatiosCalculator.css";

const FinancialRatiosCalculator = () => {
  // Bilanço verileri
  const [currentAssets, setCurrentAssets] = useState("500000");
  const [inventory, setInventory] = useState("150000");
  const [currentLiabilities, setCurrentLiabilities] = useState("300000");
  const [totalAssets, setTotalAssets] = useState("1000000");
  const [totalLiabilities, setTotalLiabilities] = useState("600000");
  const [equity, setEquity] = useState("400000");
  
  // Gelir tablosu verileri
  const [revenue, setRevenue] = useState("2000000");
  const [netIncome, setNetIncome] = useState("150000");
  const [operatingIncome, setOperatingIncome] = useState("200000");
  
  const [result, setResult] = useState(null);

  const calculateRatios = () => {
    const CA = Number(currentAssets);
    const INV = Number(inventory);
    const CL = Number(currentLiabilities);
    const TA = Number(totalAssets);
    const TL = Number(totalLiabilities);
    const EQ = Number(equity);
    const REV = Number(revenue);
    const NI = Number(netIncome);
    const OI = Number(operatingIncome);

    if ([CA, INV, CL, TA, TL, EQ, REV, NI, OI].some(isNaN)) {
      alert("Lütfen tüm alanları geçerli sayılarla doldurun!");
      return;
    }

    if (CL === 0 || TA === 0 || EQ === 0 || REV === 0) {
      alert("Payda değerleri sıfır olamaz!");
      return;
    }

    // Likidite Oranları
    const currentRatio = CA / CL;
    const quickRatio = (CA - INV) / CL;
    const cashRatio = ((CA - INV) * 0.5) / CL; // Basitleştirilmiş

    // Kaldıraç Oranları
    const debtToEquity = TL / EQ;
    const debtToAssets = TL / TA;
    const equityMultiplier = TA / EQ;

    // Karlılık Oranları
    const netProfitMargin = (NI / REV) * 100;
    const operatingMargin = (OI / REV) * 100;
    const returnOnAssets = (NI / TA) * 100;
    const returnOnEquity = (NI / EQ) * 100;

    // Değerlendirmeler
    const evaluateLiquidity = (ratio) => {
      if (ratio >= 2) return { status: "Mükemmel", color: "#27ae60" };
      if (ratio >= 1.5) return { status: "İyi", color: "#2ecc71" };
      if (ratio >= 1) return { status: "Kabul Edilebilir", color: "#f39c12" };
      return { status: "Zayıf", color: "#e74c3c" };
    };

    const evaluateDebtToEquity = (ratio) => {
      if (ratio <= 0.5) return { status: "Çok İyi", color: "#27ae60" };
      if (ratio <= 1) return { status: "İyi", color: "#2ecc71" };
      if (ratio <= 2) return { status: "Orta", color: "#f39c12" };
      return { status: "Riskli", color: "#e74c3c" };
    };

    const evaluateProfitability = (percent) => {
      if (percent >= 20) return { status: "Mükemmel", color: "#27ae60" };
      if (percent >= 10) return { status: "İyi", color: "#2ecc71" };
      if (percent >= 5) return { status: "Orta", color: "#f39c12" };
      if (percent >= 0) return { status: "Zayıf", color: "#e67e22" };
      return { status: "Zarar", color: "#e74c3c" };
    };

    setResult({
      liquidity: {
        currentRatio: { value: currentRatio.toFixed(2), ...evaluateLiquidity(currentRatio) },
        quickRatio: { value: quickRatio.toFixed(2), ...evaluateLiquidity(quickRatio) },
        cashRatio: { value: cashRatio.toFixed(2), ...evaluateLiquidity(cashRatio) }
      },
      leverage: {
        debtToEquity: { value: debtToEquity.toFixed(2), ...evaluateDebtToEquity(debtToEquity) },
        debtToAssets: { value: (debtToAssets * 100).toFixed(2) },
        equityMultiplier: { value: equityMultiplier.toFixed(2) }
      },
      profitability: {
        netProfitMargin: { value: netProfitMargin.toFixed(2), ...evaluateProfitability(netProfitMargin) },
        operatingMargin: { value: operatingMargin.toFixed(2), ...evaluateProfitability(operatingMargin) },
        returnOnAssets: { value: returnOnAssets.toFixed(2), ...evaluateProfitability(returnOnAssets) },
        returnOnEquity: { value: returnOnEquity.toFixed(2), ...evaluateProfitability(returnOnEquity) }
      }
    });
  };

  const RatioCard = ({ title, value, status, color, unit = "" }) => (
    <div className="ratio-card">
      <div className="ratio-title">{title}</div>
      <div className="ratio-value" style={{ color: color || "#2c3e50" }}>
        {value}{unit}
      </div>
      {status && (
        <div className="ratio-status" style={{ background: color + "20", color }}>
          {status}
        </div>
      )}
    </div>
  );

  return (
    <div className="financial-ratios-container">
      <h2>📊 Finansal Oranlar Hesaplayıcı</h2>
      <p className="description">
        Şirketinizin finansal sağlığını ve performansını analiz edin. Likidite, kaldıraç ve karlılık oranlarını hesaplayın.
      </p>

      <div className="input-section">
        <h3>📋 Bilanço Verileri</h3>
        
        <div className="input-row">
          <div className="input-group">
            <label>Dönen Varlıklar (₺)</label>
            <input
              type="number"
              value={currentAssets}
              onChange={(e) => setCurrentAssets(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Stoklar (₺)</label>
            <input
              type="number"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Kısa Vadeli Borçlar (₺)</label>
            <input
              type="number"
              value={currentLiabilities}
              onChange={(e) => setCurrentLiabilities(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Toplam Varlıklar (₺)</label>
            <input
              type="number"
              value={totalAssets}
              onChange={(e) => setTotalAssets(e.target.value)}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Toplam Borçlar (₺)</label>
            <input
              type="number"
              value={totalLiabilities}
              onChange={(e) => setTotalLiabilities(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Özkaynak (₺)</label>
            <input
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="input-section">
        <h3>💰 Gelir Tablosu Verileri</h3>
        
        <div className="input-row">
          <div className="input-group">
            <label>Net Satışlar (₺)</label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Net Kâr (₺)</label>
            <input
              type="number"
              value={netIncome}
              onChange={(e) => setNetIncome(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Faaliyet Kârı (₺)</label>
          <input
            type="number"
            value={operatingIncome}
            onChange={(e) => setOperatingIncome(e.target.value)}
          />
        </div>
      </div>

      <button className="calculate-button" onClick={calculateRatios}>
        🔍 Oranları Hesapla
      </button>

      {result && (
        <div className="results-container">
          <div className="ratios-section">
            <h3>💧 Likidite Oranları</h3>
            <p className="section-description">Şirketin kısa vadeli borç ödeme gücünü gösterir</p>
            <div className="ratios-grid">
              <RatioCard
                title="Cari Oran"
                value={result.liquidity.currentRatio.value}
                status={result.liquidity.currentRatio.status}
                color={result.liquidity.currentRatio.color}
              />
              <RatioCard
                title="Asit-Test Oranı"
                value={result.liquidity.quickRatio.value}
                status={result.liquidity.quickRatio.status}
                color={result.liquidity.quickRatio.color}
              />
              <RatioCard
                title="Nakit Oranı"
                value={result.liquidity.cashRatio.value}
                status={result.liquidity.cashRatio.status}
                color={result.liquidity.cashRatio.color}
              />
            </div>
          </div>

          <div className="ratios-section">
            <h3>⚖️ Kaldıraç Oranları</h3>
            <p className="section-description">Şirketin borç yapısını ve finansal riskini gösterir</p>
            <div className="ratios-grid">
              <RatioCard
                title="Borç/Özkaynak"
                value={result.leverage.debtToEquity.value}
                status={result.leverage.debtToEquity.status}
                color={result.leverage.debtToEquity.color}
              />
              <RatioCard
                title="Borç/Varlık"
                value={result.leverage.debtToAssets.value}
                unit="%"
              />
              <RatioCard
                title="Özkaynak Çarpanı"
                value={result.leverage.equityMultiplier.value}
              />
            </div>
          </div>

          <div className="ratios-section">
            <h3>💹 Karlılık Oranları</h3>
            <p className="section-description">Şirketin kâr elde etme yeteneğini gösterir</p>
            <div className="ratios-grid">
              <RatioCard
                title="Net Kâr Marjı"
                value={result.profitability.netProfitMargin.value}
                status={result.profitability.netProfitMargin.status}
                color={result.profitability.netProfitMargin.color}
                unit="%"
              />
              <RatioCard
                title="Faaliyet Kâr Marjı"
                value={result.profitability.operatingMargin.value}
                status={result.profitability.operatingMargin.status}
                color={result.profitability.operatingMargin.color}
                unit="%"
              />
              <RatioCard
                title="Varlık Kârlılığı (ROA)"
                value={result.profitability.returnOnAssets.value}
                status={result.profitability.returnOnAssets.status}
                color={result.profitability.returnOnAssets.color}
                unit="%"
              />
              <RatioCard
                title="Özkaynak Kârlılığı (ROE)"
                value={result.profitability.returnOnEquity.value}
                status={result.profitability.returnOnEquity.status}
                color={result.profitability.returnOnEquity.color}
                unit="%"
              />
            </div>
          </div>

          <div className="interpretation-section">
            <h4>📖 Oran Yorumlama Rehberi</h4>
            <div className="interpretation-grid">
              <div className="interpretation-card">
                <strong>Cari Oran:</strong> 2.0 ve üzeri ideal. Şirket her ₺1 borç için ₺2 varlığa sahip.
              </div>
              <div className="interpretation-card">
                <strong>Asit-Test:</strong> 1.0 ve üzeri yeterli. Stoklar hariç likidite durumu.
              </div>
              <div className="interpretation-card">
                <strong>Borç/Özkaynak:</strong> 1.0'ın altı ideal. Düşük finansal risk gösterir.
              </div>
              <div className="interpretation-card">
                <strong>Net Kâr Marjı:</strong> %10+ iyi kabul edilir. Sektöre göre değişir.
              </div>
              <div className="interpretation-card">
                <strong>ROE:</strong> %15+ mükemmel. Hissedar getirisi gösterir.
              </div>
              <div className="interpretation-card">
                <strong>ROA:</strong> %5+ iyi. Varlık kullanım verimliliğini gösterir.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialRatiosCalculator;