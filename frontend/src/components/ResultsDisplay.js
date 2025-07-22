import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';
import './ResultsDisplay.css';

const ResultsDisplay = ({ results, originalImage, onReset }) => {
  const [image, setImage] = useState(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });
  const [selectedDetection, setSelectedDetection] = useState(null);
  const stageRef = useRef();

  useEffect(() => {
          const loadImage = () => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImage(img);
          // Calculate stage dimensions cho trained model (300x300)
          const containerWidth = Math.min(600, window.innerWidth - 40); // 600px cho model size 300x300
          const aspectRatio = img.height / img.width;
          const height = containerWidth * aspectRatio;
          setStageDimensions({ width: containerWidth, height: height });
        };
        img.src = originalImage;
      };

    if (originalImage) {
      loadImage();
    }
  }, [originalImage]);

  const getClassColor = (className) => {
    const colors = {
      'Platelets': '#FFD700',
      'RBC': '#FF6B6B',
      'WBC': '#4ECDC4'
    };
    return colors[className] || '#888888';
  };

  const getClassStats = () => {
    const stats = { 'Platelets': 0, 'RBC': 0, 'WBC': 0 };
    results.detections.forEach(detection => {
      if (stats.hasOwnProperty(detection.class_name)) {
        stats[detection.class_name]++;
      }
    });
    return stats;
  };

  const handleDetectionClick = (detection) => {
    setSelectedDetection(detection);
  };

  const downloadResults = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = 'blood_cell_detection_result.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const stats = getClassStats();

  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="results-title">Detection Results</h2>
        <div className="results-actions">
          <button onClick={downloadResults} className="download-btn">
            📥 Download Result
          </button>
          <button onClick={onReset} className="reset-btn">
            🔄 Analyze New Image
          </button>
        </div>
      </div>

      <div className="results-content">
        <div className="image-section">
          <div className="canvas-container">
            <Stage
              width={stageDimensions.width}
              height={stageDimensions.height}
              ref={stageRef}
            >
              <Layer>
                {image && (
                  <KonvaImage
                    image={image}
                    width={stageDimensions.width}
                    height={stageDimensions.height}
                  />
                )}
                {results.detections.map((detection, index) => {
                  const scaleX = stageDimensions.width / 300; // Model trained với 300x300
                  const scaleY = stageDimensions.height / 300;
                  const [x1, y1, x2, y2] = detection.bbox;
                  
                  return (
                    <React.Fragment key={index}>
                      <Rect
                        x={x1 * scaleX}
                        y={y1 * scaleY}
                        width={(x2 - x1) * scaleX}
                        height={(y2 - y1) * scaleY}
                        stroke={getClassColor(detection.class_name)}
                        strokeWidth={3}
                        fill="transparent"
                        onClick={() => handleDetectionClick(detection)}
                        onTap={() => handleDetectionClick(detection)}
                      />
                      <Text
                        x={x1 * scaleX}
                        y={y1 * scaleY - 25}
                        text={`${detection.class_name} (${(detection.confidence * 100).toFixed(1)}%)`}
                        fontSize={14}
                        fontFamily="Inter"
                        fill={getClassColor(detection.class_name)}
                        stroke="white"
                        strokeWidth={0.5}
                      />
                    </React.Fragment>
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-card">
            <h3 className="stats-title">Detection Summary</h3>
            <div className="total-detections">
              <span className="total-number">{results.total_detections}</span>
              <span className="total-label">Total Detections</span>
            </div>
            
            <div className="cell-counts">
              {Object.entries(stats).map(([cellType, count]) => (
                <div key={cellType} className="cell-count-item">
                  <div 
                    className="cell-color-indicator"
                    style={{ backgroundColor: getClassColor(cellType) }}
                  ></div>
                  <span className="cell-type-name">{cellType}</span>
                  <span className="cell-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedDetection && (
            <div className="detection-details">
              <h4 className="details-title">Selected Detection</h4>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedDetection.class_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Confidence:</span>
                <span className="detail-value">
                  {(selectedDetection.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Position:</span>
                <span className="detail-value">
                  ({selectedDetection.bbox[0].toFixed(0)}, {selectedDetection.bbox[1].toFixed(0)})
                </span>
              </div>
            </div>
          )}

          <div className="legend">
            <h4 className="legend-title">Color Legend</h4>
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
      </div>
    </div>
  );
};

export default ResultsDisplay; 