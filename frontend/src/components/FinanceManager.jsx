import React, { useState, useEffect } from "react";
import axios from "axios";
import CalculatorHub from "./CalculatorHub";
import DarkModeToggle from "./DarkModeToggle";
import "./FinanceManager.css";
import { Link ,useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
const FinanceManager = ({ token }) => {
  const [income, setIncome] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [isCalculatorHubOpen, setIsCalculatorHubOpen] = useState(false);
  const { showToast } = useToast();
  const [newFixed, setNewFixed] = useState({ 
    name: "", 
    amount: "",
    isRecurring: false,
    frequency: 'monthly',
    dayOfMonth: 1,
    dayOfWeek: 1,
    autoAdd: false,
    category: 'diger'
  });
  const [newVariable, setNewVariable] = useState({ name: "", amount: "" });

  const openCalculatorHub = () => setIsCalculatorHubOpen(true);
  const closeCalculatorHub = () => setIsCalculatorHubOpen(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;

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

  const saveFinanceData = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      await axios.put(
        "http://localhost:5000/api/user/finance",
        { monthlyIncome: income, fixedExpenses, variableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );
       showToast('Finans Verileri Başarıyla Kaydedildi', 'success');
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      showToast('Veriler Kaydedilemedi!', 'warning');
    }
  };
const updateIncome = async (newIncome) => {
  const savedToken = localStorage.getItem("token");
  if (!savedToken) return alert("Token bulunamadı.");

  try {
    await axios.put(
      "http://localhost:5000/api/user/finance",
      { 
        monthlyIncome: newIncome, 
        fixedExpenses, 
        variableExpenses 
      },
      { headers: { Authorization: `Bearer ${savedToken}` } }
    );
    
    setIncome(newIncome);
      showToast('Aylık Gelir Güncellendi', 'success');
    
  } catch (err) {
    console.error('Gelir güncelleme hatası:', err);
    showToast('Gelir Güncellenemedi!', 'error');
  }
};
  const addFixedExpense = async () => {
    if (!newFixed.name || !newFixed.amount) {
     showToast('Lütfen gider adı ve tutarı giriniz', 'warning');
      return;
    }

    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      if (newFixed.isRecurring) {
        const res = await axios.post(
          'http://localhost:5000/api/recurring/expense',
          newFixed,
          { headers: { Authorization: `Bearer ${savedToken}` } }
        );
        
        if (res.data.success) {
            showToast('✅ Tekrarlayan gider eklendi!', 'success');
          fetchFinanceData();
        }
      } else {
        setFixedExpenses([...fixedExpenses, newFixed]);
      }

      setNewFixed({ 
        name: "", 
        amount: "",
        isRecurring: false,
        frequency: 'monthly',
        dayOfMonth: 1,
        dayOfWeek: 1,
        autoAdd: false,
        category: 'diger'
      });
    } catch (err) {
      console.error('Gider ekleme hatası:', err);
       showToast(' Gider Eklenemedi', 'success');
    }
  };

  const addVariableExpense = async () => {
  if (!newVariable.name || !newVariable.amount) {
     showToast('Lütfen Alanları Doldurun', 'success');
    return;
  }

  const savedToken = localStorage.getItem("token");
  if (!savedToken) return alert("Token bulunamadı.");

  try {
   
    const updatedVariableExpenses = [...variableExpenses, newVariable];
    
    await axios.put(
      "http://localhost:5000/api/user/finance",
      { 
        monthlyIncome: income, 
        fixedExpenses, 
        variableExpenses: updatedVariableExpenses 
      },
      { headers: { Authorization: `Bearer ${savedToken}` } }
    );
    
   showToast('Değişken Gider Eklendi', 'success');
    
    // State'i güncelle
    setVariableExpenses(updatedVariableExpenses);
    setNewVariable({ name: "", amount: "" });
    
  } catch (err) {
    console.error('Değişken gider ekleme hatası:', err);
    showToast('Değişken Gider Eklenemedi', 'warning');
  }
};

 const removeFixedExpense = async (index) => {
  const savedToken = localStorage.getItem("token");
  if (!savedToken) return alert("Token bulunamadı.");

  try {
    const updatedFixedExpenses = fixedExpenses.filter((_, i) => i !== index);
    
    await axios.put(
      "http://localhost:5000/api/user/finance",
      { 
        monthlyIncome: income, 
        fixedExpenses: updatedFixedExpenses, 
        variableExpenses 
      },
      { headers: { Authorization: `Bearer ${savedToken}` } }
    );
    
       showToast('Sabit Gider Silindi', 'success');
    setFixedExpenses(updatedFixedExpenses);
    
  } catch (err) {
    console.error('Sabit gider silme hatası:', err);
       showToast('Sabit Gider Silinemedi', 'warning');
  }
};

 const removeVariableExpense = async (index) => {
  const savedToken = localStorage.getItem("token");
  if (!savedToken) return alert("Token bulunamadı.");

  try {
    const updatedVariableExpenses = variableExpenses.filter((_, i) => i !== index);
    
    await axios.put(
      "http://localhost:5000/api/user/finance",
      { 
        monthlyIncome: income, 
        fixedExpenses, 
        variableExpenses: updatedVariableExpenses 
      },
      { headers: { Authorization: `Bearer ${savedToken}` } }
    );
    
      showToast('Değişken Gider Silindi', 'success');
    setVariableExpenses(updatedVariableExpenses);
    
  } catch (err) {
    console.error('Değişken gider silme hatası:', err);
    showToast('Değişken Gider Silinemedi', 'warning');
  }
};

  const toggleRecurring = async (expenseId) => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/recurring/expense/${expenseId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      if (res.data.success) {
        alert(res.data.message);
        fetchFinanceData();
      }
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız');
    }
  };

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalExpenses = totalFixed + totalVariable;
  const net = income - totalExpenses;

  return (
    <div className="finance-manager-wrapper">
      
      {/* Header Section */}
    <header className="finance-main-header">
    <div className="finance-header-container">
      {/* Sol Taraf - Başlık ve Navigasyon */}
      <div className="finance-header-left-section">
        <div className="finance-title-group">
          <h1 className="finance-page-title">💰 Finans Yönetimi</h1>
          <p className="finance-page-subtitle">Aylık gelir ve giderlerinizi kolayca yönetin</p>
        </div>
        <nav className="finance-navigation-menu">
          <Link to="/" className="finance-nav-item">
            <span className="finance-nav-icon">🏠</span>
            Ana Sayfa
          </Link>
          <Link to="/dashboard" className="finance-nav-item">
            <span className="finance-nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/analytics" className="finance-nav-item">
            <span className="finance-nav-icon">📈</span>
            Analytics
          </Link>
        </nav>
      </div>

      {/* Sağ Taraf - Utility Buttons */}
      <div className="finance-header-right-section">
        <div className="finance-utility-section">
          <button className="finance-calculator-btn" onClick={openCalculatorHub}>
            <span className="finance-btn-icon">🧮</span>
            Hesap Araçları
            <span className="finance-badge">8</span>
          </button>
          <DarkModeToggle />
          <div className="finance-notification-badge">
            <span className="finance-notification-icon">🔔</span>
          </div>
        </div>
      </div>
    </div>
  </header>

      {/* Summary Cards */}
      <div className="finance-summary">
        <div className="summary-card income-card">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <div className="summary-label">Aylık Gelir</div>
            <div className="summary-value">₺{income.toLocaleString("tr-TR")}</div>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="summary-icon">💸</div>
          <div className="summary-content">
            <div className="summary-label">Toplam Gider</div>
            <div className="summary-value">₺{totalExpenses.toLocaleString("tr-TR")}</div>
          </div>
        </div>

        <div className={`summary-card net-card ${net >= 0 ? "positive" : "negative"}`}>
          <div className="summary-icon">{net >= 0 ? "🏦" : "⚠️"}</div>
          <div className="summary-content">
            <div className="summary-label">Net Kalan</div>
            <div className="summary-value">₺{net.toLocaleString("tr-TR")}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="finance-content">
        
        {/* Income Section */}
        <div className="finance-section income-section">
          <div className="section-header">
            <h2>💰 Aylık Gelir</h2>
          </div>
          <div className="section-body">
            <div className="income-input-wrapper">
              <span className="currency-symbol">₺</span>
                <input
                  type="number"
                  className="income-input"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  onBlur={(e) => updateIncome(Number(e.target.value))}
                  placeholder="0"
                />
            </div>
          </div>
        </div>

        {/* Fixed Expenses Section */}
        <div className="finance-section expenses-section">
          <div className="section-header">
            <h2>📌 Sabit Giderler</h2>
            <span className="total-badge">₺{totalFixed.toLocaleString("tr-TR")}</span>
          </div>
          
          <div className="section-body">
            {/* Add Expense Form */}
            <div className="add-expense-form">
              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Gider adı (örn: Elektrik)"
                  value={newFixed.name}
                  onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input amount-input"
                  placeholder="Tutar"
                  value={newFixed.amount}
                  onChange={(e) => setNewFixed({ ...newFixed, amount: e.target.value })}
                />
                <select
                  value={newFixed.category}
                  onChange={(e) => setNewFixed({ ...newFixed, category: e.target.value })}
                  className="form-select"
                >
                  <option value="diger">📂 Diğer</option>
                  <option value="kira">🏠 Kira</option>
                  <option value="faturalar">💡 Faturalar</option>
                  <option value="abonelik">📺 Abonelik</option>
                  <option value="kredi">💳 Kredi</option>
                  <option value="sigorta">🛡️ Sigorta</option>
                  <option value="egitim">📚 Eğitim</option>
                </select>
                <button onClick={addFixedExpense} className="btn-add">
                  <span className="btn-icon">➕</span>
                  Ekle
                </button>
              </div>

              {/* Recurring Options */}
              <div className="recurring-wrapper">
                <label className="recurring-toggle">
                  <input
                    type="checkbox"
                    checked={newFixed.isRecurring}
                    onChange={(e) => setNewFixed({ ...newFixed, isRecurring: e.target.checked })}
                  />
                  <span className="toggle-label">🔄 Tekrarlayan Gider</span>
                </label>

                {newFixed.isRecurring && (
                  <div className="recurring-options">
                    <select
                      value={newFixed.frequency}
                      onChange={(e) => setNewFixed({ ...newFixed, frequency: e.target.value })}
                      className="recurring-select"
                    >
                      <option value="daily">📅 Günlük</option>
                      <option value="weekly">📆 Haftalık</option>
                      <option value="monthly">🗓️ Aylık</option>
                      <option value="yearly">📋 Yıllık</option>
                    </select>

                    {(newFixed.frequency === 'monthly' || newFixed.frequency === 'yearly') && (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ayın hangi günü?"
                        value={newFixed.dayOfMonth}
                        onChange={(e) => setNewFixed({ ...newFixed, dayOfMonth: parseInt(e.target.value) })}
                        className="recurring-input"
                      />
                    )}

                    {newFixed.frequency === 'weekly' && (
                      <select
                        value={newFixed.dayOfWeek}
                        onChange={(e) => setNewFixed({ ...newFixed, dayOfWeek: parseInt(e.target.value) })}
                        className="recurring-select"
                      >
                        <option value="1">Pazartesi</option>
                        <option value="2">Salı</option>
                        <option value="3">Çarşamba</option>
                        <option value="4">Perşembe</option>
                        <option value="5">Cuma</option>
                        <option value="6">Cumartesi</option>
                        <option value="0">Pazar</option>
                      </select>
                    )}

                    <label className="auto-add-toggle">
                      <input
                        type="checkbox"
                        checked={newFixed.autoAdd}
                        onChange={(e) => setNewFixed({ ...newFixed, autoAdd: e.target.checked })}
                      />
                      <span>⚡ Otomatik Ekle</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Expenses List */}
            <div className="expenses-list">
              {fixedExpenses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Henüz sabit gider eklenmemiş</p>
                </div>
              ) : (
                fixedExpenses.map((exp, i) => (
                  <div key={i} className={`expense-item ${exp.isRecurring && !exp.isActive ? 'inactive' : ''}`}>
                    <div className="expense-left">
                      {exp.isRecurring && (
                        <span className="recurring-badge" title="Tekrarlayan gider">🔄</span>
                      )}
                      <div className="expense-details">
                        <div className="expense-name">{exp.name}</div>
                        {exp.isRecurring && (
                          <div className="expense-meta">
                            {exp.frequency === 'monthly' && `Her ayın ${exp.dayOfMonth}'inde`}
                            {exp.frequency === 'weekly' && 'Haftalık'}
                            {exp.frequency === 'daily' && 'Günlük'}
                            {exp.frequency === 'yearly' && 'Yıllık'}
                            {exp.nextPaymentDate && (
                              <> • {new Date(exp.nextPaymentDate).toLocaleDateString('tr-TR')}</>
                            )}
                            {exp.autoAdd && <span className="auto-badge">⚡ Otomatik</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="expense-right">
                      <span className="expense-amount">₺{Number(exp.amount).toLocaleString("tr-TR")}</span>
                      <div className="expense-actions">
                        {exp.isRecurring && exp._id && (
                          <button 
                            className={`btn-toggle ${exp.isActive ? 'active' : ''}`}
                            onClick={() => toggleRecurring(exp._id)}
                            title={exp.isActive ? 'Aktif' : 'Pasif'}
                          >
                            {exp.isActive ? '✓' : '✕'}
                          </button>
                        )}
                        <button className="btn-delete" onClick={() => removeFixedExpense(i)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Variable Expenses Section */}
        <div className="finance-section expenses-section">
          <div className="section-header">
            <h2>🛒 Değişken Harcamalar</h2>
            <span className="total-badge">₺{totalVariable.toLocaleString("tr-TR")}</span>
          </div>
          
          <div className="section-body">
            <div className="add-expense-form">
              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Harcama adı"
                  value={newVariable.name}
                  onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input amount-input"
                  placeholder="Tutar"
                  value={newVariable.amount}
                  onChange={(e) => setNewVariable({ ...newVariable, amount: e.target.value })}
                />
                <button onClick={addVariableExpense} className="btn-add">
                  <span className="btn-icon">➕</span>
                  Ekle
                </button>
              </div>
            </div>

            <div className="expenses-list">
              {variableExpenses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Henüz değişken harcama eklenmemiş</p>
                </div>
              ) : (
                variableExpenses.map((exp, i) => (
                  <div key={i} className="expense-item">
                    <div className="expense-left">
                      <div className="expense-details">
                        <div className="expense-name">{exp.name}</div>
                      </div>
                    </div>
                    <div className="expense-right">
                      <span className="expense-amount">₺{Number(exp.amount).toLocaleString("tr-TR")}</span>
                      <div className="expense-actions">
                        <button className="btn-delete" onClick={() => removeVariableExpense(i)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button className="btn-calculator" onClick={openCalculatorHub}>
          <span className="btn-icon">🧮</span>
          Hesap Araçları
          <span className="badge">8</span>
        </button>
      </div>

      <CalculatorHub isOpen={isCalculatorHubOpen} onClose={closeCalculatorHub} />
    </div>
  );
};

export default FinanceManager;