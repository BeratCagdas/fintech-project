import React, { useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import api from '../api';
import './OnboardingModal.css';

const OnboardingModal = () => {
  const { 
    showOnboarding, 
    currentStep, 
    nextStep, 
    prevStep, 
    skipOnboarding, 
    completeOnboarding 
  } = useOnboarding();

  const [formData, setFormData] = useState({
    monthlyIncome: '',
    riskProfile: 'medium',
    investmentType: 'orta'
  });

  const [loading, setLoading] = useState(false);

  if (!showOnboarding) return null;

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitSetup = async () => {
    setLoading(true);
    try {
      // Gelir güncelle
      await api.post('/api/user/update-finance', {
        monthlyIncome: parseFloat(formData.monthlyIncome) || 0
      });

      // Risk profili güncelle
      await api.post('/api/user/update-profile', {
        riskProfile: formData.riskProfile,
        investmentType: formData.investmentType
      });

      nextStep();
    } catch (err) {
      console.error('Setup error:', err);
      alert('Bilgiler kaydedilemedi. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  const addSampleData = async () => {
    setLoading(true);
    try {
      // Örnek gelir
      await api.post('/api/user/update-finance', {
        monthlyIncome: 50000
      });

      // Örnek sabit giderler
      const sampleFixedExpenses = [
        { name: 'Kira', amount: 15000, category: 'kira', isRecurring: false },
        { name: 'Elektrik', amount: 500, category: 'faturalar', isRecurring: false },
        { name: 'Su', amount: 150, category: 'faturalar', isRecurring: false },
        { name: 'İnternet', amount: 300, category: 'faturalar', isRecurring: false }
      ];

      for (const expense of sampleFixedExpenses) {
        await api.post('/api/user/add-fixed-expense', expense);
      }

      // Örnek değişken giderler
      const sampleVariableExpenses = [
        { name: 'Market', amount: 3000, category: 'market' },
        { name: 'Restoran', amount: 1500, category: 'yemek' },
        { name: 'Ulaşım', amount: 800, category: 'ulasim' },
        { name: 'Sinema', amount: 400, category: 'eglence' }
      ];

      for (const expense of sampleVariableExpenses) {
        await api.post('/api/user/add-variable-expense', expense);
      }

      completeOnboarding();
      window.location.reload();
    } catch (err) {
      console.error('Sample data error:', err);
      alert('Örnek veriler eklenemedi.');
    }
    setLoading(false);
  };

  const steps = [
    // Step 0: Welcome
    {
      title: '👋 Hoş Geldiniz!',
      content: (
        <div className="onboarding-step welcome-step">
          <div className="welcome-icon"></div>
          <h2>FinTech Dashboard'a Hoş Geldiniz!</h2>
          <p className="welcome-text">
            Kişisel finans yönetiminizi kolaylaştırmak için tasarlanmış
            yapay zeka destekli bir platformuz. Finansal özgürlüğünüze giden yolda
            güçlü araçlar, akıllı analizler ve kişiselleştirilmiş önerilerle yanınızdayız.
          </p>
          <div className="feature-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">📊</span>
              <span>Gelir-Gider Takibi & Analizler</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🤖</span>
              <span>AI Yatırım Tavsiyeleri & Smart Insights</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🎯</span>
              <span>Hedef Takibi & Milestone Sistemi</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">📈</span>
              <span>8 Hesaplama Aracı & PDF Raporlar</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🏆</span>
              <span>15+ Başarı Rozeti & Streak Sistemi</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">💱</span>
              <span>Canlı Piyasa Verileri & Haberler</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🌙</span>
              <span>Dark Mode & Responsive Tasarım</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🔒</span>
              <span>Güvenli & Gizlilik Odaklı</span>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <button className="btn-skip" onClick={skipOnboarding}>
            Atla
          </button>
          <button className="btn-next" onClick={nextStep}>
            Başlayalım! →
          </button>
        </>
      )
    },

    // Step 1: Quick Setup
    {
      title: '⚙️ Hızlı Kurulum',
      content: (
        <div className="onboarding-step setup-step">
          <p className="step-description">
            Kişiselleştirilmiş AI önerileri, akıllı bütçe uyarıları ve size özel
            finansal analizler için birkaç temel bilgi alalım:
          </p>

          <div className="form-group">
            <label>💵 Aylık Geliriniz (₺)</label>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleInputChange}
              placeholder="Örn: 50000"
              className="onboarding-input"
            />
            <span className="input-hint">Bu bilgi AI tavsiyelerinizi özelleştirecek. Dilerseniz sonra değiştirebilirsiniz.</span>
          </div>

          <div className="form-group">
            <label>📊 Risk Profiliniz</label>
            <select
              name="riskProfile"
              value={formData.riskProfile}
              onChange={handleInputChange}
              className="onboarding-select"
            >
              <option value="low">🛡️ Düşük Risk (Güvenli - Tahvil, Mevduat)</option>
              <option value="medium">⚖️ Orta Risk (Dengeli - Karma Portföy)</option>
              <option value="high">🚀 Yüksek Risk (Agresif - Hisse, Kripto)</option>
            </select>
            <span className="input-hint">Yatırım önerileriniz bu profile göre şekillenecek.</span>
          </div>

          <div className="form-group">
            <label>⏱️ Yatırım Vadesi</label>
            <select
              name="investmentType"
              value={formData.investmentType}
              onChange={handleInputChange}
              className="onboarding-select"
            >
              <option value="kısa">📅 Kısa Vade (3-6 ay) - Acil fon</option>
              <option value="orta">📆 Orta Vade (6-12 ay) - Hedef odaklı</option>
              <option value="uzun">📊 Uzun Vade (1-3 yıl) - Büyüme odaklı</option>
            </select>
            <span className="input-hint">Ne kadar süre yatırım yapmayı planlıyorsunuz?</span>
          </div>
        </div>
      ),
      actions: (
        <>
          <button className="btn-back" onClick={prevStep}>
            ← Geri
          </button>
          <button
            className="btn-next"
            onClick={handleSubmitSetup}
            disabled={loading || !formData.monthlyIncome}
          >
            {loading ? 'Kaydediliyor...' : 'Devam →'}
          </button>
        </>
      )
    },

    // Step 2: Feature Tour
    {
      title: '🎯 Özellikler',
      content: (
        <div className="onboarding-step features-step">
          <p className="step-description">
            Platform özelliklerine detaylı bir göz atalım:
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Dashboard</h4>
              <p>Finansal durumunuzu tek bakışta görün. 6 farklı istatistik kartı, finansal trend grafikleri, ortalama harcama analizi."Geçmiş aylar" butonu ile Geçmiş ayların analizi ve takibi.  "Yeni Aya Geç" butonu ile diğer aya geçin "Her ayın birinde otomatik de yeni aya geçer". Sidebar'da aktivite grafiği, bütçe uyarıları ve profil bilgileriniz.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h4>Finance Manager</h4>
              <p>Gelir ve giderlerinizi kategorilere ayırarak yönetin. Sabit ve değişken giderler ekleyin. Recurring (tekrarlayan) giderler için otomatik ayarlama yapın. Kategori bazlı harcama takibi. Tüm giderlerinizi düzenleyin ve silin.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h4>AI Yatırım Tavsiyeleri</h4>
              <p>Yapay zeka destekli kişiselleştirilmiş yatırım önerileri alın. Risk profilinize ve vade tercihinize özel portföy oluşturun. Akıllı içgörüler (Smart Insights) ile haftalık, aylık ve özel tasarruf ipuçları alın. Yaklaşan ödemeler için bildirimler.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h4>Hedefler & Milestone'lar</h4>
              <p>Finansal hedeflerinizi belirleyin ve ilerlemenizi takip edin. Hedef tutar, mevcut tutar ve son tarih belirleyin. Milestone sistemi ile başarılarınızı açın: İlk 100K, İlk 500K, 1M Kulübü ve daha fazlası. Her başarı için özel rozetler kazanın!</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h4>Başarılar & Streak</h4>
              <p>15+ farklı milestone açın. Tasarruf serinizi (streak) devam ettirin. "İlk Adım", "Hızlı Başlangıç", "Düzenli Tasarrufçu", "Tasarruf Yıldızı" gibi rozetler kazanın. Başarımlarınızı modal'da görüntüleyin. Günlük giriş yaparak streak'inizi artırın!</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h4>Analytics & Raporlar</h4>
              <p>8 farklı finansal hesaplama aracı: Faiz, kredi, emeklilik, yatırım hesaplayıcıları. Kategori bazlı harcama analizleri. Aylık, 3 aylık, 6 aylık ve yıllık trend grafikleri. PDF export ile tüm verilerinizi indirin. Detaylı finansal raporlar.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h4>Akıllı Bildirimler</h4>
              <p>Bütçe aşımı uyarıları alın. Yaklaşan recurring ödemeler için bildirim. Milestone açıldığında kutlama ekranı. Smart Insights ile haftalık ipuçları. Tasarruf hedeflerinize yaklaştığınızda özel mesajlar.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌙</div>
              <h4>Dark Mode & Tema</h4>
              <p>Gece modu desteği ile gözlerinizi yormuyor. Modern gradient tasarım. Responsive layout ile mobil, tablet ve desktop uyumlu. Animasyonlu geçişler ve hover efektleri. Kişiselleştirilebilir arayüz.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💱</div>
              <h4>Piyasa Verileri</h4>
              <p>Ana sayfada canlı döviz kurları (USD, EUR, GBP). Kripto para fiyatları (BTC, ETH). Borsa endeksleri (BIST 100). Altın fiyatları. Güncel finans haberleri Bloomberg'den.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h4>Ayarlar & Kişiselleştirme</h4>
              <p>Profil bilgilerinizi güncelleyin. Risk profili ve yatırım vadesi ayarları. Bildirim tercihlerinizi yönetin. Hesap güvenliği ayarları. Tema ve görünüm tercihleri. Onboarding'i sıfırlama seçeneği.</p>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <button className="btn-back" onClick={prevStep}>
            ← Geri
          </button>
          <button className="btn-next" onClick={nextStep}>
            Anladım →
          </button>
        </>
      )
    },

    // Step 3: Sample Data
    {
      title: '🎨 Hazır mısınız?',
      content: (
        <div className="onboarding-step final-step">
          <div className="final-icon">🚀</div>
          <h2>Harika! Her Şey Hazır!</h2>
          <p className="final-text">
            Artık FinTech Dashboard'unuzu kullanmaya başlayabilirsiniz.
            Dashboard'da finansal durumunuzu görüntüleyin, giderlerinizi yönetin,
            AI'dan yatırım önerileri alın ve hedeflerinize ulaşın!
          </p>

          <div className="quick-tips">
            <h4>🎯 İlk Adımlarınız:</h4>
            <ul>
              <li>📊 <strong>Dashboard:</strong> Finansal durumunuzu inceleyin</li>
              <li>💰 <strong>Finance Manager:</strong> Gelir ve giderlerinizi ekleyin</li>
              <li>🤖 <strong>AI Önerileri:</strong> Kişiselleştirilmiş tavsiyeler alın</li>
              <li>🎯 <strong>Hedefler:</strong> Tasarruf hedeflerinizi belirleyin</li>
              <li>🏆 <strong>Milestone:</strong> İlk rozetinizi kazanın!</li>
            </ul>
          </div>

          <div className="sample-data-option">
            <h4>💡 Platformu Keşfedin:</h4>
            <p>
              Platformu test etmek ve tüm özellikleri denemek için örnek veriler eklemek ister misiniz?
              (Kira, faturalar, market gibi gerçekçi giderler eklenecek. Dilediğiniz zaman silebilirsiniz)
            </p>
            <button
              className="btn-sample-data"
              onClick={addSampleData}
              disabled={loading}
            >
              {loading ? '⏳ Ekleniyor...' : '🎨 Örnek Veriler Ekle'}
            </button>
            <span className="sample-hint">
              Örnek gelir: ₺50,000 + 8 örnek gider (Kira, Elektrik, Su, İnternet, Market, Restoran, Ulaşım, Eğlence)
            </span>
          </div>
        </div>
      ),
      actions: (
        <>
          <button className="btn-back" onClick={prevStep}>
            ← Geri
          </button>
          <button className="btn-finish" onClick={completeOnboarding}>
            Başlayalım! 🎉
          </button>
        </>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Header */}
        <div className="onboarding-header">
          <h3>{currentStepData.title}</h3>
          <span className="step-counter">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Content */}
        <div className="onboarding-content">
          {currentStepData.content}
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          {currentStepData.actions}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;