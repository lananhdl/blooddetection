import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import YouTubeUploader from './components/YouTubeUploader';
import ResultsDisplay from './components/ResultsDisplay';
import VideoResultsDisplay from './components/VideoResultsDisplay';
import Header from './components/Header';

function App() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'video'
  const [detectionResults, setDetectionResults] = useState(null);
  const [videoResults, setVideoResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);

  const handleDetectionComplete = (results, imageData) => {
    setDetectionResults(results);
    setOriginalImage(imageData);
    setVideoResults(null); // Clear video results
  };

  const handleVideoProcessed = (results) => {
    setVideoResults(results);
    setDetectionResults(null); // Clear image results
    setOriginalImage(null);
  };

  const handleReset = () => {
    setDetectionResults(null);
    setVideoResults(null);
    setOriginalImage(null);
  };

  const hasResults = detectionResults || videoResults;

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="container">
          {!hasResults ? (
            <>
              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                  onClick={() => setActiveTab('image')}
                  disabled={loading}
                >
                  📷 Upload Ảnh
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveTab('video')}
                  disabled={loading}
                >
                  🎥 YouTube Video
                </button>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'image' ? (
                <ImageUploader 
                  onDetectionComplete={handleDetectionComplete}
                  loading={loading}
                  setLoading={setLoading}
                />
              ) : (
                <YouTubeUploader 
                  onVideoProcessed={handleVideoProcessed}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
            </>
          ) : (
            <>
              {/* Display results based on type */}
              {detectionResults ? (
                <ResultsDisplay 
                  results={detectionResults}
                  originalImage={originalImage}
                  onReset={handleReset}
                />
              ) : (
                <VideoResultsDisplay 
                  results={videoResults}
                  onReset={handleReset}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 