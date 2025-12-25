import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import api from '../api';
import DarkModeToggle from '../components/DarkModeToggle';

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/user/profile');
        setUserData(res.data);
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setRiskProfile(res.data.riskProfile || 'medium');
        setInvestmentType(res.data.investmentType || 'kısa');
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    try {
      const res = await api.put('/api/user/profile', { name, email });
      setUserData(res.data);
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

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      '⚠️ UYARI: Hesabınızı silmek istediğinize emin misiniz?\n\n' +
      'Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.'
    );

    if (!confirmation) return;

    const doubleConfirm = window.prompt(
      'Devam etmek için "HESABIMI SIL" yazın:'
    );

    if (doubleConfirm !== 'HESABIMI SIL') {
      alert('❌ İşlem iptal edildi.');
      return;
    }

    try {
      await api.delete('/api/user/account');
      localStorage.removeItem('user');
      alert('✅ Hesabınız başarıyla silindi.');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('❌ Hesap silinirken hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
        <p>Ayarlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
            ← Geri
          </button>
          <div className='settings-darkmode-toggle'>
              <DarkModeToggle />
          </div>
          
        </div>
        <h1>⚙️ Ayarlar</h1>
        <p>Hesap ayarlarınızı buradan yönetebilirsiniz</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="settings-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="tab-icon">👤</span>
              Profil Bilgileri
            </button>

            <button
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="tab-icon">🔒</span>
              Güvenlik
            </button>

            <button
              className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="tab-icon">🎯</span>
              Tercihler
            </button>

            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="tab-icon">🔔</span>
              Bildirimler
            </button>

            <button
              className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <span className="tab-icon">⚠️</span>
              Tehlikeli Bölge
            </button>
          </div>
        </div>

        <div className="settings-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>👤 Profil Bilgileri</h2>
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
            <div className="settings-section">
              <h2>🔒 Güvenlik Ayarları</h2>
              <p className="section-description">
                Hesabınızın güvenliğini yönetin
              </p>

              <div className="security-card">
                <h3>Şifre Değiştir</h3>

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
            <div className="settings-section">
              <h2>🎯 Tercihler</h2>
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
            <div className="settings-section">
              <h2>🔔 Bildirim Ayarları</h2>
              <p className="section-description">
                Hangi bildirimleri almak istediğinizi seçin
              </p>

              <div className="notification-item">
                <div className="notification-info">
                  <h3>📧 E-posta Bildirimleri</h3>
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
                  <h3>💰 Bütçe Uyarıları</h3>
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
                  <h3>🏆 Başarı Bildirimleri</h3>
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
                  <h3>📊 Aylık Raporlar</h3>
                  <p>Her ay sonunda detaylı rapor alın</p>
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
                💾 Bildirimleri Kaydet
              </button>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="settings-section danger-zone">
              <h2>⚠️ Tehlikeli Bölge</h2>
              <p className="section-description">
                Bu işlemler geri alınamaz. Dikkatli olun!
              </p>

              <div className="danger-card">
                <div className="danger-info">
                  <h3>🗑️ Hesabı Sil</h3>
                  <p>
                    Hesabınızı kalıcı olarak silmek, tüm verilerinizi ve işlemlerinizi
                    geri dönüşü olmayacak şekilde siler. Bu işlem geri alınamaz.
                  </p>
                </div>
                <button className="btn-danger" onClick={handleDeleteAccount}>
                  Hesabı Kalıcı Olarak Sil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
