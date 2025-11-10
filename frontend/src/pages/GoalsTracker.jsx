import React, { useState, useEffect } from "react";
import api from "../api"; // axios yerine api import ettik
import "./GoalsTracker.css";

const GoalsTracker = () => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    category: "savings"
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    console.log(newGoal);
  }, [newGoal]);

  const fetchGoals = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await api.get("/api/user/profile"); // api kullanıyoruz, token otomatik
      setGoals(res.data.finance?.goals || []);
    } catch (err) {
      console.error("Hedefler yüklenemedi:", err);
    }
  };

  const handleAddGoal = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Token bulunamadı");

    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      return alert("Lütfen tüm alanları doldurun!");
    }

    try {
      await api.post("/api/user/goals", newGoal); // api kullanıyoruz, token otomatik
      
      setNewGoal({
        title: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
        category: "savings"
      });
      setShowModal(false);
      fetchGoals();
      alert("Hedef başarıyla eklendi!");
    } catch (err) {
      console.error("Hedef eklenemedi:", err);
      alert("Hedef eklenirken hata oluştu!");
    }
  };

  const handleUpdateProgress = async (goalId, newAmount) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.put(
        `/api/user/goals/${goalId}`,
        { currentAmount: newAmount }
      ); // api kullanıyoruz, token otomatik
      fetchGoals();
    } catch (err) {
      console.error("Hedef güncellenemedi:", err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;

    try {
      await api.delete(`/api/user/goals/${goalId}`); // api kullanıyoruz, token otomatik
      fetchGoals();
      alert("Hedef silindi!");
    } catch (err) {
      console.error("Hedef silinemedi:", err);
    }
  };

  const calculateProgress = (current, target) => {
    return Math.min(100, ((current / target) * 100).toFixed(1));
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      savings: "🏦",
      home: "🏠",
      car: "🚗",
      vacation: "✈️",
      education: "🎓",
      retirement: "🏖️",
      other: "🎯"
    };
    return icons[category] || "🎯";
  };

  const getCategoryName = (category) => {
    const names = {
      savings: "Tasarruf",
      home: "Ev",
      car: "Araba",
      vacation: "Tatil",
      education: "Eğitim",
      retirement: "Emeklilik",
      other: "Diğer"
    };
    return names[category] || "Diğer";
  };
  return (
    <div className="goals-tracker-container">
      {/* Header */}
      <div className="goals-header">
        <div>
          <h2>🎯 Hedeflerim</h2>
          <p>Finansal hedeflerinizi takip edin ve başarıya ulaşın</p>
        </div>
        <button className="add-goal-btn" onClick={() => setShowModal(true)}>
          ➕ Yeni Hedef Ekle
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>Henüz hedef eklenmedi</h3>
          <p>Finansal hedeflerinizi ekleyerek başlayın!</p>
          <button className="add-goal-btn" onClick={() => setShowModal(true)}>
            İlk Hedefimi Ekle
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = progress >= 100;
            const isNearDeadline = daysRemaining <= 30 && daysRemaining > 0;
            const isOverdue = daysRemaining < 0;

            return (
              <div key={goal._id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
                <div className="goal-card-header">
                  <div className="goal-icon">{getCategoryIcon(goal.category)}</div>
                  <div className="goal-info">
                    <h3>{goal.title}</h3>
                    <span className="goal-category">{getCategoryName(goal.category)}</span>
                  </div>
                  <button 
                    className="delete-goal-btn"
                    onClick={() => handleDeleteGoal(goal._id)}
                  >
                    🗑️
                  </button>
                </div>

                <div className="goal-amounts">
                  <div className="amount-item">
                    <span className="amount-label">Mevcut</span>
                    <span className="amount-value">₺{Number(goal.currentAmount).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="amount-divider">→</div>
                  <div className="amount-item">
                    <span className="amount-label">Hedef</span>
                    <span className="amount-value">₺{Number(goal.targetAmount).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ 
                        width: `${progress}%`,
                        background: isCompleted 
                          ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                          : 'linear-gradient(90deg, #667eea, #764ba2)'
                      }}
                    >
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="goal-footer">
                  <div className={`deadline-info ${isOverdue ? 'overdue' : isNearDeadline ? 'warning' : ''}`}>
                    <span className="deadline-icon">
                      {isOverdue ? '⚠️' : isNearDeadline ? '⏰' : '📅'}
                    </span>
                    <span>
                      {isOverdue 
                        ? `${Math.abs(daysRemaining)} gün gecikti`
                        : daysRemaining === 0
                        ? 'Bugün sona eriyor!'
                        : `${daysRemaining} gün kaldı`
                      }
                    </span>
                  </div>

                  {!isCompleted && (
                    <button
                      className="update-progress-btn"
                      onClick={() => setEditingGoal(goal)}
                    >
                      💰 İlerleme Ekle
                    </button>
                  )}

                  {isCompleted && (
                    <div className="completed-badge">✅ Tamamlandı!</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🎯 Yeni Hedef Ekle</h3>

            <div className="form-group">
              <label>Hedef Adı</label>
              <input
                type="text"
                placeholder="örn: Ev almak, Araba"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Kategori</label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              >
                <option value="savings">🏦 Tasarruf</option>
                <option value="home">🏠 Ev</option>
                <option value="car">🚗 Araba</option>
                <option value="vacation">✈️ Tatil</option>
                <option value="education">🎓 Eğitim</option>
                <option value="retirement">🏖️ Emeklilik</option>
                <option value="other">🎯 Diğer</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hedef Tutar (₺)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mevcut Tutar (₺)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Hedef Tarihi</label>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleAddGoal}>
                ✅ Hedef Ekle
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                ❌ İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {editingGoal && (
        <div className="modal-overlay" onClick={() => setEditingGoal(null)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>💰 İlerleme Ekle</h3>
            <p className="modal-subtitle">{editingGoal.title}</p>

            <div className="form-group">
              <label>Yeni Tutar (₺)</label>
              <input
                type="number"
                defaultValue={editingGoal.currentAmount}
                onChange={(e) => {
                  const input = e.target;
                  input.dataset.value = e.target.value;
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const newAmount = Number(e.target.dataset.value || e.target.value);
                    handleUpdateProgress(editingGoal._id, newAmount);
                    setEditingGoal(null);
                  }
                }}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={(e) => {
                  const input = e.target.closest('.modal-content').querySelector('input');
                  const newAmount = Number(input.value);
                  handleUpdateProgress(editingGoal._id, newAmount);
                  setEditingGoal(null);
                }}
              >
                ✅ Güncelle
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingGoal(null)}>
                ❌ İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTracker;