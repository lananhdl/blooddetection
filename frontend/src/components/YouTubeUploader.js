import React, { useState } from 'react';
import axios from 'axios';
import { RotatingLines } from 'react-loader-spinner';
import './YouTubeUploader.css';

const YouTubeUploader = ({ onVideoProcessed, loading, setLoading }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [maxFrames, setMaxFrames] = useState(30);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const isValidYouTubeUrl = (url) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,  // YouTube Shorts
      /^(https?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/               // Short format
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl.trim()) {
      setError('Vui lòng nhập URL YouTube');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError('URL YouTube không hợp lệ');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress('Đang tải video từ YouTube...');

    try {
      const response = await axios.post('/predict-youtube', {
        url: youtubeUrl,
        max_frames: maxFrames,
        confidence_threshold: 0.5
      });

      if (response.data.success) {
        setProgress('');
        onVideoProcessed(response.data);
      } else {
        setError('Xử lý video thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('YouTube processing error:', err);
      setError(
        err.response?.data?.detail || 
        'Lỗi xử lý video. Vui lòng kiểm tra URL và thử lại.'
      );
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="youtube-uploader-container">
      <div className="youtube-uploader-card">
        <h2 className="youtube-uploader-title">
          🎥 Phát hiện tế bào máu trong Video YouTube
        </h2>
        <p className="youtube-uploader-description">
          Nhập URL video YouTube chứa hình ảnh tế bào máu để AI phân tích
        </p>

        <form onSubmit={handleSubmit} className="youtube-form">
          <div className="form-group">
            <label htmlFor="youtube-url" className="form-label">
              YouTube URL:
            </label>
            <input
              id="youtube-url"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="youtube-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="max-frames" className="form-label">
              Số frames tối đa: {maxFrames}
            </label>
            <input
              id="max-frames"
              type="range"
              min="10"
              max="100"
              value={maxFrames}
              onChange={(e) => setMaxFrames(Number(e.target.value))}
              className="frames-slider"
              disabled={loading}
            />
            <div className="slider-info">
              <span>10 (nhanh)</span>
              <span>100 (chi tiết)</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-content">
              <RotatingLines
                strokeColor="#667eea"
                strokeWidth="5"
                animationDuration="0.75"
                width="60"
                visible={true}
              />
              <p className="loading-text">{progress || 'Đang xử lý video...'}</p>
            </div>
          ) : (
            <button
              type="submit"
              className="process-btn"
              disabled={!youtubeUrl.trim()}
            >
              🔍 Phân tích Video
            </button>
          )}
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="info-section">
          <h3 className="info-title">📋 Lưu ý:</h3>
          <ul className="info-list">
            <li>🕐 Video thường: tối đa 5 phút | YouTube Shorts: tối đa 3 phút</li>
            <li>🎯 Phù hợp với video hiển thị tế bào máu dưới kính hiển vi</li>
            <li>⚡ Số frames càng ít thì xử lý càng nhanh</li>
            <li>🧬 AI sẽ phát hiện: Platelets, RBC, WBC với bounding box trực quan</li>
            <li>🖼️ Xem được từng frame với detection realtime</li>
          </ul>
        </div>

        <div className="examples-section">
          <h3 className="examples-title">💡 Ví dụ URL hợp lệ:</h3>
          <div className="example-urls">
            <code>https://www.youtube.com/watch?v=VIDEO_ID</code>
            <code>https://youtu.be/VIDEO_ID</code>
            <code>https://youtube.com/shorts/SHORTS_ID</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeUploader; 