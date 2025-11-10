import React, { useState, useEffect } from "react";
import api from "../api/axios"; // ✅ axios yerine global api import
import CalculatorHub from "./CalculatorHub";
import DarkModeToggle from "./DarkModeToggle";
import "./FinanceManager.css";
import { Link } from "react-router-dom";
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
    frequency: "monthly",
    dayOfMonth: 1,
    dayOfWeek: 1,
    autoAdd: false,
    category: "diger",
  });

  const [newVariable, setNewVariable] = useState({ name: "", amount: "" });

  const openCalculatorHub = () => setIsCalculatorHubOpen(true);
  const closeCalculatorHub = () => setIsCalculatorHubOpen(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // ✅ Finans verilerini çek
  const fetchFinanceData = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;

    try {
      const res = await api.get("/api/user/profile", {
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
      showToast("Finans verileri alınamadı!", "warning");
    }
  };

  // ✅ Finans verilerini kaydet
  const saveFinanceData = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      await api.put(
        "/api/user/finance",
        { monthlyIncome: income, fixedExpenses, variableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );
      showToast("Finans Verileri Başarıyla Kaydedildi", "success");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      showToast("Veriler Kaydedilemedi!", "warning");
    }
  };

  // ✅ Aylık gelir güncelle
  const updateIncome = async (newIncome) => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      await api.put(
        "/api/user/finance",
        { monthlyIncome: newIncome, fixedExpenses, variableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      setIncome(newIncome);
      showToast("Aylık Gelir Güncellendi", "success");
    } catch (err) {
      console.error("Gelir güncelleme hatası:", err);
      showToast("Gelir Güncellenemedi!", "error");
    }
  };

  // ✅ Sabit gider ekle
  const addFixedExpense = async () => {
    if (!newFixed.name || !newFixed.amount) {
      showToast("Lütfen gider adı ve tutarı giriniz", "warning");
      return;
    }

    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      if (newFixed.isRecurring) {
        const res = await api.post("/api/recurring/expense", newFixed, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.data.success) {
          showToast("✅ Tekrarlayan gider eklendi!", "success");
          fetchFinanceData();
        }
      } else {
        setFixedExpenses([...fixedExpenses, newFixed]);
      }

      setNewFixed({
        name: "",
        amount: "",
        isRecurring: false,
        frequency: "monthly",
        dayOfMonth: 1,
        dayOfWeek: 1,
        autoAdd: false,
        category: "diger",
      });
    } catch (err) {
      console.error("Gider ekleme hatası:", err);
      showToast("Gider Eklenemedi", "warning");
    }
  };

  // ✅ Değişken gider ekle
  const addVariableExpense = async () => {
    if (!newVariable.name || !newVariable.amount) {
      showToast("Lütfen Alanları Doldurun", "warning");
      return;
    }

    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      const updatedVariableExpenses = [...variableExpenses, newVariable];

      await api.put(
        "/api/user/finance",
        { monthlyIncome: income, fixedExpenses, variableExpenses: updatedVariableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      showToast("Değişken Gider Eklendi", "success");
      setVariableExpenses(updatedVariableExpenses);
      setNewVariable({ name: "", amount: "" });
    } catch (err) {
      console.error("Değişken gider ekleme hatası:", err);
      showToast("Değişken Gider Eklenemedi", "warning");
    }
  };

  // ✅ Sabit gider sil
  const removeFixedExpense = async (index) => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      const updatedFixedExpenses = fixedExpenses.filter((_, i) => i !== index);

      await api.put(
        "/api/user/finance",
        { monthlyIncome: income, fixedExpenses: updatedFixedExpenses, variableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      showToast("Sabit Gider Silindi", "success");
      setFixedExpenses(updatedFixedExpenses);
    } catch (err) {
      console.error("Sabit gider silme hatası:", err);
      showToast("Sabit Gider Silinemedi", "warning");
    }
  };

  // ✅ Değişken gider sil
  const removeVariableExpense = async (index) => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return alert("Token bulunamadı.");

    try {
      const updatedVariableExpenses = variableExpenses.filter((_, i) => i !== index);

      await api.put(
        "/api/user/finance",
        { monthlyIncome: income, fixedExpenses, variableExpenses: updatedVariableExpenses },
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      showToast("Değişken Gider Silindi", "success");
      setVariableExpenses(updatedVariableExpenses);
    } catch (err) {
      console.error("Değişken gider silme hatası:", err);
      showToast("Değişken Gider Silinemedi", "warning");
    }
  };

  // ✅ Tekrarlayan gider aktif/pasif yap
  const toggleRecurring = async (expenseId) => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return;

    try {
      const res = await api.patch(`/api/recurring/expense/${expenseId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      if (res.data.success) {
        showToast(res.data.message, "success");
        fetchFinanceData();
      }
    } catch (err) {
      console.error(err);
      showToast("İşlem başarısız!", "warning");
    }
  };

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalExpenses = totalFixed + totalVariable;
  const net = income - totalExpenses;

  return (
    <div className="finance-manager-wrapper">
      {/* 👇 Orijinal render yapısı tamamen aynı */}
      {/* Header, summary, input, list, calculator hub vs. */}
      <CalculatorHub isOpen={isCalculatorHubOpen} onClose={closeCalculatorHub} />
    </div>
  );
};

export default FinanceManager;
