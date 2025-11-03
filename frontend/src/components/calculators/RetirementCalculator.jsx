import React, { useState } from "react";
import "./RetirementCalculator.css";

const RetirementCalculator = () => {
  const [currentAge, setCurrentAge] = useState("30");
  const [retirementAge, setRetirementAge] = useState("65");
  const [currentSavings, setCurrentSavings] = useState("50000");
  const [monthlyContribution, setMonthlyContribution] = useState("2000");
  const [expectedReturn, setExpectedReturn] = useState("8");
  const [monthlyExpenseGoal, setMonthlyExpenseGoal] = useState("15000");
  const [yearsInRetirement, setYearsInRetirement] = useState("25");
  const [inflationRate, setInflationRate] = useState("40");
  const [result, setResult] = useState(null);

  const calculateRetirement = () => {
    const age = Number(currentAge);
    const retAge = Number(retirementAge);
    const savings = Number(currentSavings);
    const monthly = Number(monthlyContribution);
    const annualReturn = Number(expectedReturn) / 100;
    const monthlyExpense = Number(monthlyExpenseGoal);
    const retYears = Number(yearsInRetirement);
    const inflation = Number(inflationRate) / 100;

    if (
      isNaN(age) || isNaN(retAge) || isNaN(savings) || isNaN(monthly) ||
      isNaN(annualReturn) || isNaN(monthlyExpense) || isNaN(retYears) || isNaN(inflation)
    ) {
      alert("Lütfen tüm alanları geçerli sayılarla doldurun!");
      return;
    }

    if (age >= retAge) {
      alert("Emeklilik yaşı şu anki yaşınızdan büyük olmalıdır!");
      return;
    }

    // Emekliliğe kalan yıl
    const yearsToRetirement = retAge - age;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = annualReturn / 12;

    // Mevcut birikimin emeklilikte ulaşacağı değer
    const futureValueSavings = savings * Math.pow(1 + monthlyReturn, monthsToRetirement);

    // Aylık katkıların gelecekteki değeri
    let futureValueContributions = 0;
    if (monthly > 0 && monthlyReturn > 0) {
      futureValueContributions = monthly * ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
    } else if (monthly > 0) {
      futureValueContributions = monthly * monthsToRetirement;
    }

    const totalAtRetirement = futureValueSavings + futureValueContributions;

    // Emeklilikte enflasyon düzeltmeli aylık ihtiyaç
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflation, yearsToRetirement);

    // Emeklilik süresince gereken toplam para (basit hesap - enflasyon ortalama)
    const totalNeeded = adjustedMonthlyExpense * 12 * retYears;

    // Eksik/fazla
    const surplus = totalAtRetirement - totalNeeded;
    const isSufficient = surplus >= 0;

    // Emeklilikte çekebileceği aylık miktar (%4 kural)
    const safeMonthlySustainable = (totalAtRetirement * 0.04) / 12;

    // Emeklilik yıllarında yıllık harcama simülasyonu
    const yearlySimulation = [];
    let remainingBalance = totalAtRetirement;
    const yearlyExpense = adjustedMonthlyExpense * 12;

    for (let year = 1; year <= Math.min(retYears, 30); year++) {
      const annualInflation = Math.pow(1 + inflation, year - 1);
      const adjustedYearlyExpense = yearlyExpense * annualInflation;
      
      remainingBalance = remainingBalance * (1 + annualReturn) - adjustedYearlyExpense;
      
      yearlySimulation.push({
        year: retAge + year - 1,
        balance: Math.max(0, remainingBalance),
        expense: adjustedYearlyExpense
      });

      if (remainingBalance <= 0) break;
    }

    setResult({
      totalAtRetirement: totalAtRetirement.toFixed(2),
      totalNeeded: totalNeeded.toFixed(2),
      surplus: surplus.toFixed(2),
      isSufficient,
      adjustedMonthlyExpense: adjustedMonthlyExpense.toFixed(2),
      safeMonthlySustainable: safeMonthlySustainable.toFixed(2),
      yearsToRetirement,
      totalContributed: (savings + (monthly * 12 * yearsToRetirement)).toFixed(2),
      yearlySimulation
    });
  };

  return (
    <div className="retirement-calculator-container">
      <h2>🏖️ Emeklilik Planlaması</h2>
      <p className="description">
        Rahat bir emeklilik için ne kadar birikim yapmanız gerektiğini hesaplayın.
      </p>

      <div className="input-section">
        <h3>👤 Kişisel Bilgiler</h3>
        
        <div className="input-row">
          <div className="input-group">
            <label>Şu Anki Yaşınız</label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Emeklilik Yaşı</label>
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="input-section">
        <h3>💰 Mevcut Durum</h3>
        
        <div className="input-group">
          <label>Mevcut Birikimleriniz (₺)</label>
          <input
            type="number"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Aylık Katkı (₺)</label>
          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
          />
          <small>Emekliliğe kadar her ay yatıracağınız miktar</small>
        </div>
      </div>

      <div className="input-section">
        <h3>📊 Varsayımlar</h3>
        
        <div className="input-row">
          <div className="input-group">
            <label>Beklenen Yıllık Getiri (%)</label>
            <input
              type="number"
              step="0.1"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
            <small>Ortalama yatırım getirisi</small>
          </div>

          <div className="input-group">
            <label>Yıllık Enflasyon (%)</label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="input-section">
        <h3>🎯 Emeklilik Hedefi</h3>
        
        <div className="input-row">
          <div className="input-group">
            <label>Hedef Aylık Harcama (₺)</label>
            <input
              type="number"
              value={monthlyExpenseGoal}
              onChange={(e) => setMonthlyExpenseGoal(e.target.value)}
            />
            <small>Bugünkü değerle istediğiniz aylık gelir</small>
          </div>

          <div className="input-group">
            <label>Emeklilik Süresi (Yıl)</label>
            <input
              type="number"
              value={yearsInRetirement}
              onChange={(e) => setYearsInRetirement(e.target.value)}
            />
            <small>Emeklilik döneminin süresi</small>
          </div>
        </div>
      </div>

      <button className="calculate-button" onClick={calculateRetirement}>
        🎯 Planı Hesapla
      </button>

      {result && (
        <div className="results-container">
          <div className={`status-banner ${result.isSufficient ? 'success' : 'warning'}`}>
            {result.isSufficient ? (
              <>
                <span className="status-icon">✅</span>
                <div>
                  <strong>Tebrikler!</strong> Emeklilik hedefinize ulaşabilirsiniz!
                </div>
              </>
            ) : (
              <>
                <span className="status-icon">⚠️</span>
                <div>
                  <strong>Dikkat!</strong> Mevcut planınız emeklilik hedefiniz için yetersiz.
                </div>
              </>
            )}
          </div>

          <div className="summary-grid">
            <div className="summary-card highlight">
              <div className="summary-label">Emeklilikte Toplam Birikminiz</div>
              <div className="summary-value">₺{Number(result.totalAtRetirement).toLocaleString('tr-TR')}</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">İhtiyaç Duyacağınız Toplam</div>
              <div className="summary-value">₺{Number(result.totalNeeded).toLocaleString('tr-TR')}</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Fazla / Eksik</div>
              <div className="summary-value" style={{ color: result.isSufficient ? '#27ae60' : '#e74c3c' }}>
                {result.isSufficient ? '+' : ''}₺{Number(result.surplus).toLocaleString('tr-TR')}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Emekliliğe Kalan Süre</div>
              <div className="summary-value">{result.yearsToRetirement} Yıl</div>
            </div>
          </div>

          <div className="info-box">
            <h4>📋 Detaylı Bilgi</h4>
            <ul>
              <li>
                <strong>Toplam yatırım:</strong> ₺{Number(result.totalContributed).toLocaleString('tr-TR')}
              </li>
              <li>
                <strong>Bugünkü hedef aylık harcama:</strong> ₺{Number(monthlyExpenseGoal).toLocaleString('tr-TR')}
              </li>
              <li>
                <strong>Emeklilikte enflasyon düzeltmeli aylık harcama:</strong> ₺{Number(result.adjustedMonthlyExpense).toLocaleString('tr-TR')}
              </li>
              <li>
                <strong>Güvenli çekilebilir aylık miktar (%4 kuralı):</strong> ₺{Number(result.safeMonthlySustainable).toLocaleString('tr-TR')}
              </li>
            </ul>
          </div>

          {result.yearlySimulation.length > 0 && (
            <div className="simulation-section">
              <h4>📈 Emeklilik Yılları Simülasyonu</h4>
              <div className="simulation-table">
                <table>
                  <thead>
                    <tr>
                      <th>Yaş</th>
                      <th>Kalan Birikim</th>
                      <th>Yıllık Harcama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlySimulation.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td>{item.year}</td>
                        <td>₺{item.balance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                        <td>₺{item.expense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.yearlySimulation.length > 10 && (
                  <small className="table-note">İlk 10 yıl gösteriliyor...</small>
                )}
              </div>
            </div>
          )}

          <div className="tips-section">
            <h4>💡 Öneriler</h4>
            <div className="tips-grid">
              {!result.isSufficient && (
                <>
                  <div className="tip-card">
                    <span className="tip-icon">📈</span>
                    <p>Aylık katkınızı artırın</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">⏰</span>
                    <p>Emeklilik yaşınızı erteleyin</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">💰</span>
                    <p>Daha yüksek getirili yatırımlar değerlendirin</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🏠</span>
                    <p>Emeklilikte harcamalarınızı gözden geçirin</p>
                  </div>
                </>
              )}
              {result.isSufficient && (
                <>
                  <div className="tip-card success">
                    <span className="tip-icon">✅</span>
                    <p>Planınız güzel görünüyor!</p>
                  </div>
                  <div className="tip-card success">
                    <span className="tip-icon">📊</span>
                    <p>Yılda bir planınızı güncelleyin</p>
                  </div>
                  <div className="tip-card success">
                    <span className="tip-icon">🎯</span>
                    <p>Çeşitlendirilmiş portföy oluşturun</p>
                  </div>
                  <div className="tip-card success">
                    <span className="tip-icon">🛡️</span>
                    <p>Acil durum fonu ayırın</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirementCalculator;