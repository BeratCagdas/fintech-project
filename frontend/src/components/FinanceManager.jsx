import React, { useState, useEffect } from "react";
import axios from "axios";
import CalculatorHub from "./CalculatorHub";
import "./FinanceManager.css"
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
  console.log("FinanceManager token:", savedToken);
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

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const net = income - (totalFixed + totalVariable);

  return (
    <div className="finance-container">
      <h2>📊 Aylık Finans Yönetimi</h2>

      <div className="income-section">
        <label>Aylık Gelir:</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
        />
      </div>

      <div className="expenses-section">
        <h3>Sabit Giderler</h3>
        <div className="expense-input">
          <input
            type="text"
            placeholder="Gider adı"
            value={newFixed.name}
            onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tutar"
            value={newFixed.amount}
            onChange={(e) => setNewFixed({ ...newFixed, amount: e.target.value })}
          />
          <button onClick={addFixedExpense}>Ekle</button>
        </div>

        <ul>
          {fixedExpenses.map((exp, i) => (
            <li key={i}>
              {exp.name}: {exp.amount}₺
            </li>
          ))}
        </ul>
        <p><strong>Toplam Sabit Gider:</strong> {totalFixed}₺</p>
      </div>

      <div className="expenses-section">
        <h3>Değişken Harcamalar</h3>
        <div className="expense-input">
          <input
            type="text"
            placeholder="Harcama adı"
            value={newVariable.name}
            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tutar"
            value={newVariable.amount}
            onChange={(e) => setNewVariable({ ...newVariable, amount: e.target.value })}
          />
          <button onClick={addVariableExpense}>Ekle</button>
        </div>

        <ul>
          {variableExpenses.map((exp, i) => (
            <li key={i}>
              {exp.name}: {exp.amount}₺
            </li>
          ))}
        </ul>
        <p><strong>Toplam Harcama:</strong> {totalVariable}₺</p>
      </div>

      <div className="net-section">
        <h3>💰 Net Kalan: {net}₺</h3>
      </div>

      <button onClick={saveFinanceData}>Kaydet</button>
    <div className="finance-manager-container">
      {/* Mevcut içerikleriniz */}
      <h1>Finans Yönetimi</h1>
      
      {/* Diğer componentleriniz... */}

      {/* Hesap Araçları Butonu */}
      <div className="tools-section">
        <button className="calculator-hub-button" onClick={openCalculatorHub}>
          <span className="button-icon">🧮</span>
          <span className="button-text">Hesap Araçları</span>
          <span className="button-badge">8 Araç</span>
        </button>
      </div>

      {/* Calculator Hub Modal */}
      <CalculatorHub 
        isOpen={isCalculatorHubOpen} 
        onClose={closeCalculatorHub} 
      />
    </div>
   
    </div>
    
  );
};

export default FinanceManager;
