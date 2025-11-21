// frontend/src/components/MilestoneNotification.jsx
import React, { useEffect, useState } from 'react';
import './MilestoneNotification.css';

const MilestoneNotification = ({ milestone, onClose }) => {
  const [show, setShow] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setShow(true), 100);

    // Confetti generation
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360
    }));
    setConfettiPieces(pieces);

    // Auto close after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  if (!milestone) return null;

  return (
    <div className={`milestone-notification-overlay ${show ? 'show' : ''}`}>
      {/* Confetti */}
      <div className="confetti-container">
        {confettiPieces.map(piece => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotation}deg)`
            }}
          />
        ))}
      </div>

      {/* Milestone Card */}
      <div className={`milestone-card ${show ? 'show' : ''}`}>
        <button className="milestone-close-btn" onClick={handleClose}>✕</button>
        
        <div className="milestone-header">
          <div 
            className="milestone-icon-circle"
            style={{ background: milestone.color || '#667eea' }}
          >
            <span className="milestone-icon">{milestone.icon}</span>
          </div>
          <h2 className="milestone-achievement-label">🏆 BAŞARI KAZANILDI!</h2>
        </div>

        <div className="milestone-body">
          <h3 className="milestone-title">{milestone.title}</h3>
          <p className="milestone-message">{milestone.message}</p>
          
          {milestone.threshold && (
            <div className="milestone-threshold">
              <span className="threshold-label">Ulaşılan Seviye:</span>
              <span className="threshold-value">₺{milestone.threshold.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        <div className="milestone-footer">
          <button className="btn-celebrate" onClick={handleClose}>
            🎉 Harika!
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneNotification;