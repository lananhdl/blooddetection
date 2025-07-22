import React, { useState } from 'react';
import './VideoResultsDisplay.css';

const VideoResultsDisplay = ({ results, onReset }) => {
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  const getClassColor = (className) => {
    const colors = {
      'Platelets': '#FFD700',
      'RBC': '#FF6B6B',
      'WBC': '#4ECDC4'
    };
    return colors[className] || '#888888';
  };

  const currentFrame = results.frame_results[selectedFrame];

  return (
    <div className="video-results-container">
      <div className="video-results-header">
        <h2 className="video-results-title">🎥 Kết quả phân tích Video YouTube</h2>
        <button onClick={onReset} className="reset-btn">
          🔄 Phân tích video mới
        </button>
      </div>

      {/* Video Info */}
      <div className="video-info">
        <div className="info-card">
          <h3>📊 Thống kê tổng quan</h3>
          <div className="video-stats">
            <div className="stat-item">
              <span className="stat-value">{results.total_frames_processed}</span>
              <span className="stat-label">Frames đã xử lý</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.total_detections}</span>
              <span className="stat-label">Tổng detections</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.average_detections_per_frame.toFixed(1)}</span>
              <span className="stat-label">Trung bình/frame</span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Statistics */}
      <div className="class-statistics">
        <h3>🧬 Phân bố tế bào trong video</h3>
        <div className="class-charts">
          {Object.entries(results.class_statistics).map(([className, count]) => (
            <div key={className} className="class-stat-item">
              <div 
                className="class-color-bar"
                style={{ 
                  backgroundColor: getClassColor(className),
                  width: `${(count / results.total_detections) * 100}%`
                }}
              ></div>
              <div className="class-stat-info">
                <span className="class-name">{className}</span>
                <span className="class-count">{count} ({((count / results.total_detections) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame Browser */}
      <div className="frame-browser">
        <h3>🎬 Duyệt qua các frames</h3>
        
        {/* Frame Selector */}
        <div className="frame-selector">
          <label htmlFor="frame-slider">
            Frame {selectedFrame + 1}/{results.total_frames_processed}
            {currentFrame && ` (${currentFrame.detection_count} detections)`}
          </label>
          <input
            id="frame-slider"
            type="range"
            min="0"
            max={results.total_frames_processed - 1}
            value={selectedFrame}
            onChange={(e) => setSelectedFrame(Number(e.target.value))}
            className="frame-slider"
          />
          <div className="frame-controls">
            <button 
              onClick={() => setSelectedFrame(Math.max(0, selectedFrame - 1))}
              disabled={selectedFrame === 0}
              className="frame-btn"
            >
              ⏮️ Trước
            </button>
            <button 
              onClick={() => setSelectedFrame(Math.min(results.total_frames_processed - 1, selectedFrame + 1))}
              disabled={selectedFrame === results.total_frames_processed - 1}
              className="frame-btn"
            >
              Sau ⏭️
            </button>
          </div>
        </div>

        {/* Frame Image Display */}
        {currentFrame && (currentFrame.frame_image || currentFrame.original_frame) && (
          <div className="frame-image-display">
            <div className="frame-image-header">
              <h4>🖼️ Frame {selectedFrame + 1} ({currentFrame.timestamp || ''})</h4>
              <div className="frame-controls-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showBoundingBoxes}
                    onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {showBoundingBoxes ? '🎯 Bounding Boxes' : '📷 Ảnh gốc'}
                  </span>
                </label>
              </div>
            </div>

            <div className="frame-image-container">
              <img
                src={showBoundingBoxes ? currentFrame.frame_image : currentFrame.original_frame}
                alt={`Frame ${selectedFrame + 1}`}
                className="frame-image"
                loading="lazy"
              />
              {currentFrame.detections.length > 0 && (
                <div className="frame-overlay-stats">
                  <span className="detection-count-badge">
                    {currentFrame.detections.length} detections
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Frame Details */}
        {currentFrame && (
          <div className="current-frame-details">
            <h4>📋 Chi tiết Frame {selectedFrame + 1}</h4>
            
            {currentFrame.detections.length > 0 ? (
              <div className="frame-detections">
                <p className="detections-summary">
                  Tìm thấy <strong>{currentFrame.detections.length}</strong> tế bào:
                </p>
                
                <div className="detections-list">
                  {currentFrame.detections.map((detection, index) => (
                    <div key={index} className="detection-item">
                      <div 
                        className="detection-color"
                        style={{ backgroundColor: getClassColor(detection.class_name) }}
                      ></div>
                      <div className="detection-info">
                        <span className="detection-class">{detection.class_name}</span>
                        <span className="detection-confidence">
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="detection-coords">
                        (x: {detection.bbox[0].toFixed(0)}, y: {detection.bbox[1].toFixed(0)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-detections">
                <p>🔍 Không tìm thấy tế bào nào trong frame này</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline View */}
      <div className="timeline-view">
        <h3>📈 Timeline detections</h3>
        <div className="timeline-chart">
          {results.frame_results.map((frame, index) => (
            <div
              key={index}
              className={`timeline-bar ${index === selectedFrame ? 'active' : ''}`}
              style={{ 
                height: `${Math.max(5, (frame.detection_count / Math.max(...results.frame_results.map(f => f.detection_count))) * 100)}%` 
              }}
              onClick={() => setSelectedFrame(index)}
              title={`Frame ${index + 1}: ${frame.detection_count} detections`}
            ></div>
          ))}
        </div>
        <div className="timeline-labels">
          <span>Frame 1</span>
          <span>Frame {results.total_frames_processed}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <h4>🎨 Chú thích màu sắc</h4>
        <div className="legend-items">
          {['Platelets', 'RBC', 'WBC'].map(cellType => (
            <div key={cellType} className="legend-item">
              <div 
                className="legend-color"
                style={{ backgroundColor: getClassColor(cellType) }}
              ></div>
              <span className="legend-label">{cellType}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoResultsDisplay; 