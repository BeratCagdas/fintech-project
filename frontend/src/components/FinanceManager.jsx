import React, { useState, useEffect } from "react";
import axios from "axios";
import CalculatorHub from "./CalculatorHub";
import "./FinanceManager.css";

const FinanceManager = ({ token }) => {
  const [income, setIncome] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [newFixed, setNewFixed] = useState({ name: "", amount: "" });
  const [newVariable, setNewVariable] = useState({ name: "", amount: "" });
  const [isCalculatorHubOpen, setIsCalculatorHubOpen] = useState(false);

  const openCalculatorHub = () => {
    setIsCalculatorHubOpen(true);
  };

  const closeCalculatorHub = () => {
    setIsCalculatorHubOpen(false);
  };

  // Kullanıcının mevcut verilerini yükle
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;
    
    const fetchFinanceData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const finance = res.data.finance;
        if (finance) {
          setIncome(finance.monthlyIncome || 0);
          setFixedExpenses(finance.fixedExpenses || []);
          setVariableExpenses(finance.variableExpenses || []);
        }
      } catch (err) {
        console.error("Finans verileri alınamadı:", err);
      }
    };
    fetchFinanceData();
  }, []);

  // Değişiklikleri backend'e gönder
  const saveFinanceData = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      await axios.put(
        "http://localhost:5000/api/user/finance",
        { monthlyIncome: income, fixedExpenses, variableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );
      alert("Finans verileri kaydedildi!");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      alert("Veriler kaydedilemedi.");
    }
  };

  const addFixedExpense = () => {
    if (newFixed.name && newFixed.amount) {
      setFixedExpenses([...fixedExpenses, newFixed]);
      setNewFixed({ name: "", amount: "" });
    }
  };

  const addVariableExpense = () => {
    if (newVariable.name && newVariable.amount) {
      setVariableExpenses([...variableExpenses, newVariable]);
      setNewVariable({ name: "", amount: "" });
    }
  };

  const removeFixedExpense = (index) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const removeVariableExpense = (index) => {
    setVariableExpenses(variableExpenses.filter((_, i) => i !== index));
  };

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalExpenses = totalFixed + totalVariable;
  const net = income - totalExpenses;

  return (
    <div className="finance-manager-wrapper">
      {/* Header */}
      <div className="finance-header">
        <h1>💰 Finans Yönetimi</h1>
        <p>Aylık gelir ve giderlerinizi yönetin</p>
      </div>

      {/* Summary Cards */}
      <div className="finance-summary">
        <div className="summary-card income-card">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <div className="summary-label">Aylık Gelir</div>
            <div className="summary-value">₺{income.toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="summary-icon">💸</div>
          <div className="summary-content">
            <div className="summary-label">Toplam Gider</div>
            <div className="summary-value">₺{totalExpenses.toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <div className={`summary-card net-card ${net >= 0 ? 'positive' : 'negative'}`}>
          <div className="summary-icon">{net >= 0 ? '🏦' : '⚠️'}</div>
          <div className="summary-content">
            <div className="summary-label">Net Kalan</div>
            <div className="summary-value">₺{net.toLocaleString('tr-TR')}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="finance-grid">
        {/* Income Section */}
        <div className="finance-card">
          <div className="card-header">
            <h3>💰 Aylık Gelir</h3>
          </div>
          <div className="card-body">
            <div className="income-input-wrapper">
              <span className="currency-symbol">₺</span>
              <input
                type="number"
                className="income-input"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Fixed Expenses Section */}
        <div className="finance-card">
          <div className="card-header">
            <h3>📌 Sabit Giderler</h3>
            <span className="total-badge">₺{totalFixed.toLocaleString('tr-TR')}</span>
          </div>
          <div className="card-body">
            <div className="expense-input-group">
              <input
                type="text"
                className="expense-name-input"
                placeholder="Gider adı (örn: Kira)"
                value={newFixed.name}
                onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })}
              />
              <input
                type="number"
                className="expense-amount-input"
                placeholder="Tutar"
                value={newFixed.amount}
                onChange={(e) => setNewFixed({ ...newFixed, amount: e.target.value })}
              />
              <button className="add-btn" onClick={addFixedExpense}>
                ➕
              </button>
            </div>

            <div className="expense-list">
              {fixedExpenses.length === 0 ? (
                <p className="empty-message">Henüz sabit gider eklenmedi</p>
              ) : (
                fixedExpenses.map((exp, i) => (
                  <div key={i} className="expense-item">
                    <div className="expense-info">
                      <span className="expense-name">{exp.name}</span>
                      <span className="expense-amount">₺{Number(exp.amount).toLocaleString('tr-TR')}</span>
                    </div>
                    <button className="delete-btn" onClick={() => removeFixedExpense(i)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Variable Expenses Section */}
        <div className="finance-card">
          <div className="card-header">
            <h3>🛒 Değişken Harcamalar</h3>
            <span className="total-badge">₺{totalVariable.toLocaleString('tr-TR')}</span>
          </div>
          <div className="card-body">
            <div className="expense-input-group">
              <input
                type="text"
                className="expense-name-input"
                placeholder="Harcama adı (örn: Market)"
                value={newVariable.name}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
              />
              <input
                type="number"
                className="expense-amount-input"
                placeholder="Tutar"
                value={newVariable.amount}
                onChange={(e) => setNewVariable({ ...newVariable, amount: e.target.value })}
              />
              <button className="add-btn" onClick={addVariableExpense}>
                ➕
              </button>
            </div>

            <div className="expense-list">
              {variableExpenses.length === 0 ? (
                <p className="empty-message">Henüz değişken harcama eklenmedi</p>
              ) : (
                variableExpenses.map((exp, i) => (
                  <div key={i} className="expense-item">
                    <div className="expense-info">
                      <span className="expense-name">{exp.name}</span>
                      <span className="expense-amount">₺{Number(exp.amount).toLocaleString('tr-TR')}</span>
                    </div>
                    <button className="delete-btn" onClick={() => removeVariableExpense(i)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="save-btn" onClick={saveFinanceData}>
          💾 Değişiklikleri Kaydet
        </button>
        <button className="calculator-btn" onClick={openCalculatorHub}>
          🧮 Hesap Araçları <span className="badge">8</span>
        </button>
      </div>

      {/* Calculator Hub Modal */}
      <CalculatorHub 
        isOpen={isCalculatorHubOpen} 
        onClose={closeCalculatorHub} 
      />
    </div>
  );
};

export default FinanceManager;