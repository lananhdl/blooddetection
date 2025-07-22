import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🩸</div>
            <h1 className="logo-text">Blood Cell Detector</h1>
          </div>
          <p className="header-subtitle">
            AI-powered blood cell detection using SSD (Single Shot MultiBox Detector)
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Detectable Types:</span>
            <span className="stat-value">Platelets, RBC, WBC</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 