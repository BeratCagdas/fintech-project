import React, { useState } from "react";
import "./LoanCalculator.css";

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState("500000");
  const [interestRate, setInterestRate] = useState("1.5");
  const [loanTerm, setLoanTerm] = useState("120");
  const [result, setResult] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const calculateLoan = () => {
    const P = Number(loanAmount);
    const monthlyRate = Number(interestRate) / 100;
    const n = Number(loanTerm);

    if (isNaN(P) || isNaN(monthlyRate) || isNaN(n) || P <= 0 || monthlyRate < 0 || n <= 0) {
      alert("Lütfen geçerli değerler girin!");
      return;
    }

    // Aylık taksit hesaplama (Eşit Taksit - Annuity)
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment = P * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }

    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    // Amortisman tablosu oluştur
    const amortizationSchedule = [];
    let remainingBalance = P;

    for (let month = 1; month <= n; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      // Son ayda kayan virgül hatası için düzeltme
      if (month === n) remainingBalance = 0;

      amortizationSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: remainingBalance > 0 ? remainingBalance : 0
      });
    }

    setResult({
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      schedule: amortizationSchedule
    });
    setShowTable(false);
  };

  return (
    <div className="loan-calculator-container">
      <h2>🏠 Kredi / Mortgage Hesaplayıcı</h2>
      <p className="description">
        Konut kredisi, taşıt kredisi veya ihtiyaç kredisi için aylık taksit ve toplam maliyeti hesaplayın.
      </p>

      <div className="input-group">
        <label>Kredi Tutarı (₺)</label>
        <input
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          placeholder="500000"
        />
      </div>

      <div className="input-group">
        <label>Aylık Faiz Oranı (%)</label>
        <input
          type="number"
          step="0.01"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="1.5"
        />
        <small>Bankanın aylık faiz oranını girin (örn: %1.5)</small>
      </div>

      <div className="input-group">
        <label>Vade (Ay)</label>
        <input
          type="number"
          value={loanTerm}
          onChange={(e) => setLoanTerm(e.target.value)}
          placeholder="120"
        />
        <small>Kredi vadesi (örn: 120 ay = 10 yıl)</small>
      </div>

      <button className="calculate-button" onClick={calculateLoan}>
        💰 Hesapla
      </button>

      {result && (
        <div className="results-container">
          <h3>📊 Kredi Özeti</h3>

          <div className="result-card highlight">
            <div className="result-label">Aylık Taksit</div>
            <div className="result-value">₺{Number(result.monthlyPayment).toLocaleString('tr-TR')}</div>
          </div>

          <div className="result-row">
            <div className="result-card">
              <div className="result-label">Toplam Ödeme</div>
              <div className="result-value">₺{Number(result.totalPayment).toLocaleString('tr-TR')}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Toplam Faiz</div>
              <div className="result-value warning">₺{Number(result.totalInterest).toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="info-box">
            <p>
              <strong>💡 Bilgi:</strong> ₺{Number(loanAmount).toLocaleString('tr-TR')} krediye 
              {loanTerm} ay boyunca <strong>₺{Number(result.totalInterest).toLocaleString('tr-TR')} faiz</strong> ödeyeceksiniz.
              Toplam geri ödeme tutarı: <strong>₺{Number(result.totalPayment).toLocaleString('tr-TR')}</strong>
            </p>
          </div>

          <button 
            className="table-toggle-button" 
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? "📋 Amortisman Tablosunu Gizle" : "📋 Amortisman Tablosunu Göster"}
          </button>

          {showTable && (
            <div className="amortization-table-container">
              <h4>📈 Ödeme Planı</h4>
              <div className="table-wrapper">
                <table className="amortization-table">
                  <thead>
                    <tr>
                      <th>Ay</th>
                      <th>Taksit</th>
                      <th>Ana Para</th>
                      <th>Faiz</th>
                      <th>Kalan Borç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>₺{row.payment.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>₺{row.principal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="interest-cell">₺{row.interest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>₺{row.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;