import React, { useState } from "react";
import "./CompoundInterestCalculator.css";

const CompoundInterestCalculator = () => {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("8");
  const [time, setTime] = useState("10");
  const [frequency, setFrequency] = useState("12"); // Aylık
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [result, setResult] = useState(null);

  const calculateCompoundInterest = () => {
    const P = Number(principal);
    const r = Number(rate) / 100;
    const t = Number(time);
    const n = Number(frequency);
    const PMT = Number(monthlyContribution);

    if (isNaN(P) || isNaN(r) || isNaN(t) || isNaN(n) || isNaN(PMT)) {
      alert("Lütfen geçerli sayısal değerler girin!");
      return;
    }

    if (P < 0 || r < 0 || t < 0 || PMT < 0) {
      alert("Değerler negatif olamaz!");
      return;
    }

    // Başlangıç sermayesinin bileşik faiz ile büyümesi
    const futureValuePrincipal = P * Math.pow(1 + r / n, n * t);

    // Düzenli katkıların gelecekteki değeri (Anuite formülü)
    let futureValueContributions = 0;
    if (PMT > 0) {
      const monthlyRate = r / 12;
      const totalMonths = t * 12;
      futureValueContributions = PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const totalFutureValue = futureValuePrincipal + futureValueContributions;
    const totalContributions = P + (PMT * 12 * t);
    const totalInterest = totalFutureValue - totalContributions;

    setResult({
      futureValue: totalFutureValue.toFixed(2),
      totalContributions: totalContributions.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      returnRate: ((totalInterest / totalContributions) * 100).toFixed(2)
    });
  };

  const getFrequencyText = () => {
    const freqMap = {
      "1": "Yıllık",
      "4": "3 Ayda Bir",
      "12": "Aylık",
      "365": "Günlük"
    };
    return freqMap[frequency] || "Aylık";
  };

  return (
    <div className="compound-interest-container">
      <h2>💰 Bileşik Faiz Hesaplayıcı</h2>
      <p className="description">
        Yatırımınızın zamanla nasıl büyüyeceğini görün. Düzenli katkılarla servet oluşturun!
      </p>

      <div className="input-group">
        <label>Başlangıç Sermayesi (₺)</label>
        <input
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="10000"
        />
      </div>

      <div className="input-group">
        <label>Yıllık Faiz Oranı (%)</label>
        <input
          type="number"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="8"
        />
      </div>

      <div className="input-group">
        <label>Yatırım Süresi (Yıl)</label>
        <input
          type="number"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="10"
        />
      </div>

      <div className="input-group">
        <label>Bileşik Faiz Frekansı</label>
        <select 
          value={frequency} 
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="1">Yıllık</option>
          <option value="4">3 Ayda Bir</option>
          <option value="12">Aylık</option>
          <option value="365">Günlük</option>
        </select>
      </div>

      <div className="input-group">
        <label>Aylık Katkı (₺)</label>
        <input
          type="number"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          placeholder="500"
        />
        <small>İsteğe bağlı - Her ay ekleyeceğiniz miktar</small>
      </div>

      <button className="calculate-button" onClick={calculateCompoundInterest}>
        📊 Hesapla
      </button>

      {result && (
        <div className="results-container">
          <h3>📈 Sonuçlar</h3>
          
          <div className="result-card highlight">
            <div className="result-label">Toplam Biriken Tutar</div>
            <div className="result-value">₺{Number(result.futureValue).toLocaleString('tr-TR')}</div>
          </div>

          <div className="result-row">
            <div className="result-card">
              <div className="result-label">Toplam Yatırılan</div>
              <div className="result-value">₺{Number(result.totalContributions).toLocaleString('tr-TR')}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Kazanılan Faiz</div>
              <div className="result-value success">₺{Number(result.totalInterest).toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="result-card">
            <div className="result-label">Getiri Oranı</div>
            <div className="result-value">%{result.returnRate}</div>
          </div>

          <div className="info-box">
            <p>
              <strong>🎯 Özet:</strong> {time} yıl boyunca {getFrequencyText().toLowerCase()} 
              bileşik faiz ile ₺{Number(principal).toLocaleString('tr-TR')} başlangıç sermayeniz ve 
              aylık ₺{Number(monthlyContribution).toLocaleString('tr-TR')} katkınızla 
              <strong> ₺{Number(result.totalInterest).toLocaleString('tr-TR')} faiz</strong> kazanacaksınız!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompoundInterestCalculator;