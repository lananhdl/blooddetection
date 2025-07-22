import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { RotatingLines } from 'react-loader-spinner';
import './ImageUploader.css';

const ImageUploader = ({ onDetectionComplete, loading, setLoading }) => {
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onDetectionComplete(response.data, response.data.processed_image);
      } else {
        setError('Detection failed. Please try again.');
      }
    } catch (err) {
      console.error('Detection error:', err);
      setError(
        err.response?.data?.detail || 
        'Error processing image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [onDetectionComplete, setLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.tiff']
    },
    multiple: false,
    disabled: loading
  });

  return (
    <div className="uploader-container">
      <div className="uploader-card">
        <h2 className="uploader-title">Upload Blood Cell Image</h2>
        <p className="uploader-description">
          Upload a microscopic image of blood cells for AI-powered detection and analysis
        </p>

        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${loading ? 'dropzone-disabled' : ''}`}
        >
          <input {...getInputProps()} />
          
          {loading ? (
            <div className="loading-content">
              <RotatingLines
                strokeColor="#667eea"
                strokeWidth="5"
                animationDuration="0.75"
                width="60"
                visible={true}
              />
              <p className="loading-text">Analyzing blood cells...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <h3 className="upload-title">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
              </h3>
              <p className="upload-subtitle">or click to select a file</p>
              <div className="supported-formats">
                <span>Supported formats: JPEG, PNG, BMP, TIFF</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="info-section">
          <h3 className="info-title">What this tool detects:</h3>
          <div className="cell-types">
            <div className="cell-type">
              <span className="cell-icon">🔴</span>
              <span className="cell-name">Red Blood Cells (RBC)</span>
            </div>
            <div className="cell-type">
              <span className="cell-icon">⚪</span>
              <span className="cell-name">White Blood Cells (WBC)</span>
            </div>
            <div className="cell-type">
              <span className="cell-icon">🟡</span>
              <span className="cell-name">Platelets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader; 