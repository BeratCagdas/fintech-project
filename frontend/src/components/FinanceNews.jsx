import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ✅ Doğrudan axios kullan (harici API için)
import './FinanceNews.css';

// Axios instance - Harici API için özel
const newsApi = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const FinanceNews = ({ maxNews = 10, refreshInterval = 600000 }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const parseRSS = (xmlText) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    const newsArray = [];
    items.forEach((item, index) => {
      if (index >= maxNews) return;
      
      const title = item.querySelector('title')?.textContent;
      const link = item.querySelector('link')?.textContent;
      const description = item.querySelector('description')?.textContent;
      const pubDate = item.querySelector('pubDate')?.textContent;
      
      if (title && link) {
        newsArray.push({
          id: link,
          title: title,
          description: description?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || '',
          source: 'Bloomberg',
          url: link,
          image: null,
          publishedAt: pubDate ? new Date(pubDate) : new Date()
        });
      }
    });
    
    return newsArray;
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const rssUrl = 'https://feeds.bloomberg.com/markets/news.rss';
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
      
      // newsApi ile istek at (harici servis için)
      const response = await newsApi.get(proxyUrl);
      const newsData = parseRSS(response.data);
      
      setNews(newsData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Haberler alınamadı:', err.response?.data || err.message);
      setError('Haberler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval);
    return () => clearInterval(interval);
  }, [maxNews, refreshInterval]);

  if (loading && !lastUpdate) {
    return (
    <div className="finance-news-container">
      <div className="news-header">
        <h3>📰 Finans Haberleri</h3>
        <div className="header-actions">
          {lastUpdate && (
            <span className="last-update">
              {lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button 
            className="refresh-btn" 
            onClick={fetchNews}
            disabled={loading}
            title="Haberleri Yenile"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="news-list">
        {news.map((item) => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            <div className="news-content">
              <h4 className="news-title">{item.title}</h4>
              <p className="news-description">{item.description}</p>
              <div className="news-meta">
                <span className="news-source">📰 {item.source}</span>
                <span className="news-time">
                  {item.publishedAt.toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default FinanceNews;