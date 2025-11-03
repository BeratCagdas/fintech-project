import React, { useState } from "react";
import "./CalculatorHub.css";

// Hesaplayıcı componentlerini import et
import BreakEvenCalculator from "./calculators/BreakEvenCalculator";
import CAGRCalculator from "./calculators/CAGRCalculator";
import CompoundInterestCalculator from "./calculators/CompoundInterestCalculator";
import FinancialRatiosCalculator from "./calculators/FinancialRatiosCalculator";
import InflationCalculator from "./calculators/InflationCalculator";
import LoanCalculator from "./calculators/LoanCalculator";
import NPVIRRCalculator from "./calculators/NPVIRRCalculator";
import RetirementCalculator from "./calculators/RetirementCalculator";

const CalculatorHub = ({ isOpen, onClose }) => {
  const [selectedCalculator, setSelectedCalculator] = useState(null);

  // Hesaplayıcı kartları
  const calculators = [
    {
      id: "npv-irr",
      name: "NPV & IRR",
      title: "Yatırım Analizi",
      description: "Net bugünkü değer ve iç verim oranı hesaplama",
      icon: "📊",
      color: "#667eea",
      component: NPVIRRCalculator
    },
    {
      id: "compound-interest",
      name: "Bileşik Faiz",
      title: "Bileşik Faiz Hesaplayıcı",
      description: "Yatırımınızın zamanla nasıl büyüyeceğini görün",
      icon: "💰",
      color: "#27ae60",
      component: CompoundInterestCalculator
    },
    {
      id: "loan",
      name: "Kredi",
      title: "Kredi/Mortgage Hesaplayıcı",
      description: "Aylık taksit ve toplam maliyet hesaplama",
      icon: "🏠",
      color: "#e74c3c",
      component: LoanCalculator
    },
    {
      id: "cagr",
      name: "CAGR",
      title: "CAGR Hesaplayıcı",
      description: "Bileşik yıllık büyüme oranı analizi",
      icon: "📈",
      color: "#27ae60",
      component: CAGRCalculator
    },
    {
      id: "retirement",
      name: "Emeklilik",
      title: "Emeklilik Planlaması",
      description: "Emeklilik için ne kadar birikim yapmalısınız?",
      icon: "🏖️",
      color: "#3498db",
      component: RetirementCalculator
    },
    {
      id: "breakeven",
      name: "Break-Even",
      title: "Break-Even Analizi",
      description: "Başabaş noktası ve kârlılık hesaplama",
      icon: "⚖️",
      color: "#e67e22",
      component: BreakEvenCalculator
    },
    {
      id: "ratios",
      name: "Finansal Oranlar",
      title: "Finansal Oranlar",
      description: "Likidite, kaldıraç ve karlılık oranları",
      icon: "📊",
      color: "#9b59b6",
      component: FinancialRatiosCalculator
    },
    {
      id: "inflation",
      name: "Enflasyon",
      title: "Enflasyon & Satın Alma Gücü",
      description: "Paranın geçmiş ve gelecekteki değerini hesaplayın",
      icon: "💸",
      color: "#f39c12",
      component: InflationCalculator
    }
  ];

  const handleCardClick = (calculator) => {
    setSelectedCalculator(calculator);
  };

  const handleBack = () => {
    setSelectedCalculator(null);
  };

  const handleCloseModal = () => {
    setSelectedCalculator(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="calculator-hub-overlay" onClick={handleCloseModal}>
      <div className="calculator-hub-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={handleCloseModal}>
          ✕
        </button>

        {!selectedCalculator ? (
          // Card Grid Görünümü
          <div className="calculator-hub-content">
            <div className="hub-header">
              <h2>🧮 Hesaplama Araçları</h2>
              <p>İhtiyacınız olan finansal hesaplayıcıyı seçin</p>
            </div>

            <div className="calculators-grid">
              {calculators.map((calc) => (
                <div
                  key={calc.id}
                  className="calculator-card"
                  onClick={() => handleCardClick(calc)}
                  style={{ borderTopColor: calc.color }}
                >
                  <div className="card-icon" style={{ background: calc.color + "20", color: calc.color }}>
                    {calc.icon}
                  </div>
                  <h3 className="card-title">{calc.name}</h3>
                  <p className="card-description">{calc.description}</p>
                  <div className="card-arrow" style={{ color: calc.color }}>
                    →
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Seçilen Hesaplayıcı Görünümü
          <div className="calculator-view">
            <div className="calculator-header">
              <button className="back-button" onClick={handleBack}>
                ← Geri
              </button>
              <h3>{selectedCalculator.title}</h3>
            </div>
            <div className="calculator-content">
              <selectedCalculator.component />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorHub;