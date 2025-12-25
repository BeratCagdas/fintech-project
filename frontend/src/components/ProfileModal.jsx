import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileModal.css';
import api from '../api';

function ProfileModal({ isOpen, onClose, userData: initialUserData, onUpdate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(initialUserData);

  // Profile settings
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference settings
  const [riskProfile, setRiskProfile] = useState('medium');
  const [investmentType, setInvestmentType] = useState('kısa');
  const [currency, setCurrency] = useState('TRY');
  const [language, setLanguage] = useState('tr');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(true);

  useEffect(() => {
    if (initialUserData) {
      setUserData(initialUserData);
      setName(initialUserData.name || '');
      setEmail(initialUserData.email || '');
      setRiskProfile(initialUserData.riskProfile || 'medium');
      setInvestmentType(initialUserData.investmentType || 'kısa');
    }
  }, [initialUserData]);

  const handleUpdateProfile = async () => {
    try {
      const res = await api.put('/api/user/profile', { name, email });
      setUserData(res.data);
      if (onUpdate) onUpdate(res.data);
      alert('✅ Profil bilgileri güncellendi!');
    } catch (err) {
      console.error(err);
      alert('❌ Profil güncellenirken hata oluştu!');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('❌ Yeni şifreler eşleşmiyor!');
      return;
    }

    if (newPassword.length < 6) {
      alert('❌ Şifre en az 6 karakter olmalıdır!');
      return;
    }

    try {
      await api.put('/api/user/password', {
        currentPassword,
        newPassword
      });
      alert('✅ Şifre başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      alert('❌ Şifre değiştirilemedi! Mevcut şifrenizi kontrol edin.');
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      const res = await api.put('/api/user/preferences', {
        riskProfile,
        investmentType,
        currency,
        language
      });
      setUserData(res.data);
      if (onUpdate) onUpdate(res.data);
      alert('✅ Tercihler kaydedildi!');
    } catch (err) {
      console.error(err);
      alert('❌ Tercihler kaydedilirken hata oluştu!');
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      await api.put('/api/user/notifications', {
        emailNotifications,
        budgetAlerts,
        milestoneAlerts,
        monthlyReports
      });
      alert('✅ Bildirim ayarları kaydedildi!');
    } catch (err) {
      console.error(err);
      alert('❌ Bildirim ayarları kaydedilirken hata oluştu!');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose}></div>
      <div className="profile-modal">
        <div className="profile-modal-header">
           ⚙️ Hesap Ayarları
          <button className="d1-profile-modal-close" onClick={onClose}>✕ </button>
               
        </div>

        <div className="profile-modal-content">
          {/* Sidebar Tabs */}
          <div className="profile-modal-sidebar">
            <button
              className={`profile-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="tab-icon">👤</span>
              Profil Bilgileri
            </button>

            <button
              className={`profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="tab-icon">🔒</span>
              Güvenlik
            </button>

            <button
              className={`profile-tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="tab-icon">🎯</span>
              Tercihler
            </button>

            <button
              className={`profile-tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="tab-icon">🔔</span>
              Bildirimler
            </button>
          </div>

          {/* Main Content */}
          <div className="profile-modal-main">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="profile-section">
                <h3>👤 Profil Bilgileri</h3>
                <p className="section-description">
                  Temel profil bilgilerinizi güncelleyin
                </p>

                <div className="form-group">
                  <label>İsim</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız"
                  />
                </div>

                <div className="form-group">
                  <label>E-posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <button className="btn-primary" onClick={handleUpdateProfile}>
                  💾 Değişiklikleri Kaydet
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="profile-section">
                <h3>🔒 Güvenlik Ayarları</h3>
                <p className="section-description">
                  Hesabınızın güvenliğini yönetin
                </p>

                <div className="security-card">
                  <h4>Şifre Değiştir</h4>

                  <div className="form-group">
                    <label>Mevcut Şifre</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mevcut şifreniz"
                    />
                  </div>

                  <div className="form-group">
                    <label>Yeni Şifre</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifre (min. 6 karakter)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                    />
                  </div>

                  <button className="btn-primary" onClick={handleChangePassword}>
                    🔐 Şifreyi Değiştir
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="profile-section">
                <h3>🎯 Tercihler</h3>
                <p className="section-description">
                  Uygulama tercihlerinizi özelleştirin
                </p>

                <div className="form-group">
                  <label>Risk Profili</label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value)}
                  >
                    <option value="low">Düşük Risk</option>
                    <option value="medium">Orta Risk</option>
                    <option value="high">Yüksek Risk</option>
                  </select>
                  <small>Yatırım önerilerinizi etkiler</small>
                </div>

                <div className="form-group">
                  <label>Yatırım Vadesi</label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                  >
                    <option value="kısa">Kısa Vade (3-6 Ay)</option>
                    <option value="orta">Orta Vade (6-12 Ay)</option>
                    <option value="uzun">Uzun Vade (1-3 Yıl)</option>
                  </select>
                  <small>Yatırım stratejinizi belirler</small>
                </div>

                <div className="form-group">
                  <label>Para Birimi</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="TRY">🇹🇷 Türk Lirası (₺)</option>
                    <option value="USD">🇺🇸 Dolar ($)</option>
                    <option value="EUR">🇪🇺 Euro (€)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dil</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="tr">🇹🇷 Türkçe</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>

                <button className="btn-primary" onClick={handleUpdatePreferences}>
                  💾 Tercihleri Kaydet
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="profile-section">
                <h3>🔔 Bildirim Ayarları</h3>
                <p className="section-description">
                  Hangi bildirimleri almak istediğinizi seçin
                </p>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>📧 E-posta Bildirimleri</h4>
                    <p>Önemli güncellemeler için e-posta alın</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>💰 Bütçe Uyarıları</h4>
                    <p>Bütçe limitlerini aştığınızda bildirim alın</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={budgetAlerts}
                      onChange={(e) => setBudgetAlerts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>🏆 Başarı Bildirimleri</h4>
                    <p>Yeni milestone kazandığınızda bildirim alın</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={milestoneAlerts}
                      onChange={(e) => setMilestoneAlerts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>📊 Aylık Raporlar</h4>
                    <p>Aylık finansal özet raporu alın</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={monthlyReports}
                      onChange={(e) => setMonthlyReports(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <button className="btn-primary" onClick={handleUpdateNotifications}>
                  💾 Ayarları Kaydet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileModal;
