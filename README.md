#  FinTech Dashboard — AI-Powered Personal Finance & Investment System

🚀 **Live Demo:** [https://fintech-frontend-8nux.onrender.com](https://fintech-frontend-8nux.onrender.com)  
🖥️ **Backend API:** [https://fintech-dashboard-xm3z.onrender.com](https://fintech-dashboard-xm3z.onrender.com)  

---

## 🌐 Overview | Genel Bakış

**FinTech Dashboard**, kullanıcıların gelir-gider takibini yapabildiği, yatırım tavsiyesi alabileceği, geçmiş ay analizlerini görüntüleyebildiği ve bütçesini akıllı şekilde yönettiği tam kapsamlı bir **kişisel finans yönetim sistemidir.**  

Sistem;  
- Yapay zeka destekli yatırım önerileri 🧠  
- Otomatik aylık resetleme & geçmiş kaydı 📊  
- Yinelenen gider planlaması 🔁  
- PDF raporları ve analitik görselleştirme 📈  
özelliklerini içerir.  

---

---

## ⚙️ Tech Stack | Teknolojiler

### 🖥️ **Frontend**
- React (Vite)
- CSS
- Axios
- React Router
- html2canvas & jsPDF (PDF export)
- Context API (Auth & State)
- Toastify for UI notifications

### 🧩 **Backend**
- Node.js / Express.js  
- MongoDB (Mongoose)  
- JWT Authentication  
- dotenv  
- node-cron (Automated monthly reset)  
- @google/genai (Gemini API SDK)  

---

## 🧠 Features | Özellikler

### 💸 **1. Finance Manager**
- Aylık gelir & gider yönetimi  
- Sabit / değişken gider ayrımı  
- Otomatik yinelenen gider planı  
- Yaklaşan ödemelerin hatırlatılması  

### 🧾 **2. Monthly Reset System**
- Her ay başında otomatik resetleme  
- Önceki ayın verilerini “monthlyHistory” altına kaydetme  
- Kümülatif tasarruf takibi  
- 00:01’de cron job otomatik çalıştırma  

### 🤖 **3. AI Investment Advice**
- Gemini API ile yapay zekâ tabanlı yatırım tavsiyesi  
- Risk profili, vade tercihi, gelir ve gider analizine göre dinamik öneriler  
- Türkiye piyasasına uygun araçlar (BES, BIST, döviz, altın)  

### 📊 **4. Analytics Dashboard**
- Aylık gelir-gider grafikleri  
- Tasarruf trend analizi  
- PDF rapor export (html2canvas + jsPDF)  

### 🌗 **5. UI & Experience**
- Dark Mode Toggle  
- Modern FinTech teması  
- Google / GitHub giriş seçenekleri  

---

## 🚀 Installation | Kurulum

### 🔧 Backend
```bash
cd backend
npm install
npm run start
```

Create `.env` file:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
```

### 💻 Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧠 Example AI Response
🎯 Orta Risk ve Kısa Vadeli (3-6 ay) tercihli yatırımcı olarak size özel portföy önerisi:
**Önerilen Portföy Dağılımı:**

1. **Kısa Vadeli Borçlanma Araçları Fonları** - %50
* Bu fonlar, kısa vadeli devlet tahvilleri, özel sektör borçlanma araçları ve repo gibi enstrümanlara yatırım yaparak düşük riskle, mevduattan daha yüksek getiri potansiyeli sunar. Kısa vadeli vade tercihiniz için yüksek likidite ve göreceli istikrar sağlar.

* Tahmini Yıllık Getiri: %48

2. **Altın Fonları** - %30
* Enflasyona karşı koruma sağlama potansiyeli taşıyan altın, portföyünüzde çeşitlendirme aracı olarak yer alabilir. Altın fonları, fiziki altın alımına kıyasla daha pratik ve düşük maliyetli yatırım imkanı sunar. Kısa vadede dalgalanmalar görülebilir.

* Tahmini Yıllık Getiri: %30

3. **Döviz Mevduatı (USD/EUR) veya Döviz Fonları** - %20
* Türk lirası kurundaki dalgalanmalara karşı koruma sağlamak amacıyla döviz cinsinden varlıklar portföyünüze eklenebilir. Yüksek likidite sunar ve ekonomik belirsizlik dönemlerinde bir miktar güvenli liman görevi görebilir.

* Tahmini Yıllık Getiri: %28

💡 **Ek Tavsiye:** Aylık tasarruf miktarınız oldukça yüksek. Kısa vadeli hedeflerinizin yanı sıra, bu birikiminizin bir kısmını uzun vadeli hedefleriniz için (emeklilik, ev alımı vb.) ayırmayı düşünebilirsiniz. Bu durumda, Bireysel Emeklilik Sistemi (BES) veya daha dengeli/büyüme odaklı yatırım fonları gibi uzun vadeli araçları araştırmanız faydalı olacaktır.
⚠️ **Risk Uyarısı:** Geçmiş performans gelecekteki getirilerin garantisi değildir. Verilen tahmini getiriler mevcut piyasa koşulları ve varsayımlar dahilinde olup, piyasa dinamiklerine göre değişiklik gösterebilir. Yatırım kararı vermeden önce kişisel finansal durumunuzu detaylıca değerlendirmeniz ve gerekirse bağımsız bir finansal danışmana başvurmanız önemlidir.

## 🧩 Environment Variables
| Key | Description |
|-----|--------------|
| `PORT` | Backend port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Token secret key |
| `GEMINI_API_KEY` | Google Gemini API key |

---


## 🧠 Future Improvements | Gelecek Planları
- 💬 AI Chat tabanlı finans asistanı  
- 📈 Harcama kategorisi bazlı otomatik analiz  
- 📆 Takvim entegrasyonu (Google Calendar reminders)  

---

## 👨‍💻 Author | Geliştirici
**Berat Çağdaş**  
🎓 Finance & Banking Student | 💻 FinTech Developer  
GitHub: [@BeratCagdas](https://github.com/BeratCagdas)  
Project: **FinTech Dashboard — AI-Powered Personal Finance System**
