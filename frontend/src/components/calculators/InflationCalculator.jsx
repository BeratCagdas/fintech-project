import React, { useState } from "react";
import "./InflationCalculator.css";

const InflationCalculator = () => {
  const [calculationType, setCalculationType] = useState("past"); // past veya future
  const [amount, setAmount] = useState("10000");
  const [startYear, setStartYear] = useState("2020");
  const [endYear, setEndYear] = useState("2024");
  const [inflationRate, setInflationRate] = useState("45");
  const [result, setResult] = useState(null);

  const calculateInflation = () => {
    const amt = Number(amount);
    const rate = Number(inflationRate) / 100;
    const start = Number(startYear);
    const end = Number(endYear);

    if (isNaN(amt) || isNaN(rate) || isNaN(start) || isNaN(end)) {
      alert("Lütfen tüm alanları geçerli sayılarla doldurun!");
      return;
    }

    if (amt <= 0) {
      alert("Tutar sıfırdan büyük olmalıdır!");
      return;
    }

    if (calculationType === "past" && start >= end) {
      alert("Başlangıç yılı bitiş yılından küçük olmalıdır!");
      return;
    }

    if (calculationType === "future" && start >= end) {
      alert("Başlangıç yılı bitiş yılından küçük olmalıdır!");
      return;
    }

    const years = Math.abs(end - start);

    if (calculationType === "past") {
      // Geçmişteki para bugün kaç TL eder?
      const futureValue = amt * Math.pow(1 + rate, years);
      const purchasingPowerLoss = ((futureValue - amt) / amt) * 100;

      // Yıllık kırılım
      const yearlyBreakdown = [];
      for (let i = 0; i <= years; i++) {
        const yearValue = amt * Math.pow(1 + rate, i);
        yearlyBreakdown.push({
          year: start + i,
          value: yearValue,
          loss: i === 0 ? 0 : ((yearValue - amt) / amt) * 100
        });
      }

      setResult({
        type: "past",
        originalAmount: amt,
        adjustedAmount: futureValue.toFixed(2),
        purchasingPowerLoss: purchasingPowerLoss.toFixed(2),
        years,
        yearlyBreakdown,
        startYear: start,
        endYear: end
      });
    } else {
      // Bugünkü para gelecekte ne kadar değerli olacak? (Satın alma gücü kaybı)
      const futureValue = amt / Math.pow(1 + rate, years);
      const purchasingPowerLoss = ((amt - futureValue) / amt) * 100;

      // Yıllık kırılım
      const yearlyBreakdown = [];
      for (let i = 0; i <= years; i++) {
        const yearValue = amt / Math.pow(1 + rate, i);
        yearlyBreakdown.push({
          year: start + i,
          value: yearValue,
          loss: i === 0 ? 0 : ((amt - yearValue) / amt) * 100
        });
      }

      setResult({
        type: "future",
        originalAmount: amt,
        adjustedAmount: futureValue.toFixed(2),
        purchasingPowerLoss: purchasingPowerLoss.toFixed(2),
        years,
        yearlyBreakdown,
        startYear: start,
        endYear: end
      });
    }
  };

  return (
    <div className="inflation-calculator-container">
      <h2>💸 Enflasyon ve Satın Alma Gücü Hesaplayıcı</h2>
      <p className="description">
        Paranızın geçmişteki ve gelecekteki değerini hesaplayın. Enflasyonun satın alma gücünüze etkisini görün.
      </p>

      <div className="type-selector">
        <button
          className={`type-button ${calculationType === "past" ? "active" : ""}`}
          onClick={() => setCalculationType("past")}
        >
          ⏮️ Geçmişten Bugüne
        </button>
        <button
          className={`type-button ${calculationType === "future" ? "active" : ""}`}
          onClick={() => setCalculationType("future")}
        >
          ⏭️ Bugünden Geleceğe
        </button>
      </div>

      <div className="explanation-box">
        {calculationType === "past" ? (
          <p>
            📅 <strong>Geçmişten Bugüne:</strong> Geçmişteki bir tutarın bugünkü değerini hesaplayın.
            <br />
            Örnek: "2020'de ₺10,000 bugün ne kadar eder?"
          </p>
        ) : (
          <p>
            🔮 <strong>Bugünden Geleceğe:</strong> Bugünkü paranın gelecekteki satın alma gücünü hesaplayın.
            <br />
            Örnek: "Bugünkü ₺10,000 5 yıl sonra ne kadar değerli olacak?"
          </p>
        )}
      </div>

      <div className="input-group">
        <label>
          {calculationType === "past" ? "Geçmişteki Tutar (₺)" : "Bugünkü Tutar (₺)"}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10000"
        />
      </div>

      <div className="input-row">
        <div className="input-group">
          <label>Başlangıç Yılı</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="2020"
          />
        </div>

        <div className="input-group">
          <label>{calculationType === "past" ? "Bitiş Yılı (Bugün)" : "Gelecek Yıl"}</label>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder="2024"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Ortalama Yıllık Enflasyon Oranı (%)</label>
        <input
          type="number"
          step="0.1"
          value={inflationRate}
          onChange={(e) => setInflationRate(e.target.value)}
          placeholder="45"
        />
        <small>Türkiye için son yıllarda ortalama %40-50 arası</small>
      </div>

      <button className="calculate-button" onClick={calculateInflation}>
        🔍 Hesapla
      </button>

      {result && (
        <div className="results-container">
          <div className="main-result-card">
            {result.type === "past" ? (
              <>
                <div className="result-header">
                  <span className="year-badge">{result.startYear}</span>
                  <span className="arrow">→</span>
                  <span className="year-badge current">{result.endYear}</span>
                </div>
                <div className="amount-comparison">
                  <div className="amount-box original">
                    <div className="amount-label">Geçmişteki Tutar</div>
                    <div className="amount-value">₺{Number(result.originalAmount).toLocaleString('tr-TR')}</div>
                  </div>
                  <div className="amount-box adjusted">
                    <div className="amount-label">Bugünkü Karşılığı</div>
                    <div className="amount-value">₺{Number(result.adjustedAmount).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                <div className="loss-indicator warning">
                  <strong>Satın Alma Gücü Kaybı:</strong> %{result.purchasingPowerLoss}
                </div>
                <div className="interpretation">
                  💡 {result.startYear} yılında ₺{Number(result.originalAmount).toLocaleString('tr-TR')} ile 
                  alabildiğiniz ürünleri bugün almak için <strong>₺{Number(result.adjustedAmount).toLocaleString('tr-TR')}</strong> gerekiyor!
                </div>
              </>
            ) : (
              <>
                <div className="result-header">
                  <span className="year-badge current">{result.startYear}</span>
                  <span className="arrow">→</span>
                  <span className="year-badge">{result.endYear}</span>
                </div>
                <div className="amount-comparison">
                  <div className="amount-box original">
                    <div className="amount-label">Bugünkü Tutar</div>
                    <div className="amount-value">₺{Number(result.originalAmount).toLocaleString('tr-TR')}</div>
                  </div>
                  <div className="amount-box adjusted">
                    <div className="amount-label">Gelecekteki Değeri</div>
                    <div className="amount-value">₺{Number(result.adjustedAmount).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                <div className="loss-indicator danger">
                  <strong>Satın Alma Gücü Kaybı:</strong> %{result.purchasingPowerLoss}
                </div>
                <div className="interpretation">
                  💡 Bugün ₺{Number(result.originalAmount).toLocaleString('tr-TR')} ile alabildiğiniz ürünlerin 
                  değeri {result.years} yıl sonra sadece <strong>₺{Number(result.adjustedAmount).toLocaleString('tr-TR')}</strong> olacak!
                </div>
              </>
            )}
          </div>

          <div className="yearly-breakdown-section">
            <h4>📊 Yıllık Kırılım</h4>
            <div className="breakdown-table-wrapper">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Yıl</th>
                    <th>{result.type === "past" ? "Enflasyon Düzeltmeli Değer" : "Satın Alma Gücü"}</th>
                    <th>Kayıp/Artış</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyBreakdown.map((item, index) => (
                    <tr key={index} className={index === 0 || index === result.yearlyBreakdown.length - 1 ? "highlight-row" : ""}>
                      <td>{item.year}</td>
                      <td>₺{item.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                      <td className={item.loss > 0 ? "negative" : "neutral"}>
                        {item.loss > 0 ? `-${item.loss.toFixed(1)}%` : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tips-section">
            <h4>💡 Enflasyondan Korunma Yolları</h4>
            <div className="tips-grid">
              <div className="tip-card">
                <span className="tip-icon">📈</span>
                <div className="tip-content">
                  <strong>Yatırım Yapın</strong>
                  <p>Enflasyonun üzerinde getiri sağlayan araçlara yatırım yapın</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">💰</span>
                <div className="tip-content">
                  <strong>Çeşitlendirin</strong>
                  <p>Altın, döviz, hisse senedi gibi farklı varlıklara yatırım yapın</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">🏠</span>
                <div className="tip-content">
                  <strong>Reel Varlıklar</strong>
                  <p>Gayrimenkul gibi değer kaybetmeyen varlıklara yönelin</p>
                </div>
              </div>
              <div className="tip-card">
                <span className="tip-icon">📚</span>
                <div className="tip-content">
                  <strong>Kendinize Yatırım</strong>
                  <p>Eğitim ve becerilerinizi geliştirin, kazancınızı artırın</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InflationCalculator;