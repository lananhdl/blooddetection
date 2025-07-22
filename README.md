# Đồ Án Ứng Dụng SSD- 🩸AI-Powered Medical Analysis

Đồ án này là của Nhóm 10 trong khuôn khổ đồ án môn Học máy ứng dụng - Phát hiện tế bào máu sử dụng mô hình SSD (Single Shot Detector) với khả năng phân tích **cả ảnh và video YouTube**. Ứng dụng có thể phát hiện và phân loại các loại tế bào máu: Tiểu cầu (Platelets), Hồng cầu (RBC), và Bạch cầu (WBC) với **bounding boxes trực quan** và **thống kê chi tiết**.

## 🌟 Tính năng nổi bật

### 📷 **Phân tích ảnh tĩnh**
- **Phát hiện tự động**: Sử dụng mô hình SSD đã được train chuyên biệt
- **Bounding boxes màu sắc**: Phân biệt rõ ràng từng loại tế bào
- **Thống kê chi tiết**: Đếm chính xác số lượng từng loại tế bào
- **Tải xuống kết quả**: Export ảnh đã phân tích
- **Real-time processing**: Xử lý ảnh ngay lập tức

### 🎥 **Phân tích video YouTube** 
- **YouTube Video support**: Phân tích video YouTube thông thường (tối đa 5 phút)
- **YouTube Shorts support**: Hỗ trợ đặc biệt cho YouTube Shorts (tối đa 3 phút)
- **Frame-by-frame analysis**: Xem từng frame với detection realtime
- **Interactive timeline**: Click để jump đến frame cụ thể
- **Toggle view**: Chuyển đổi giữa ảnh gốc ↔ ảnh có bounding boxes
- **Video statistics**: Thống kê tổng quan cho toàn bộ video

### 🖼️ **Frame Viewer trực quan**
- **Visual bounding boxes**: Hiển thị detection trực tiếp trên frame
- **Color-coded detection**: Màu sắc riêng cho từng loại tế bào
- **Confidence scores**: Hiển thị độ tin cậy của mỗi detection
- **Coordinate display**: Vị trí chính xác của tế bào
- **Timestamp tracking**: Thời gian frame trong video

## 🎯 Demo tính năng

### Các loại tế bào được phát hiện:
- 🔴 **Red Blood Cells (RBC)** - Hồng cầu
- ⚪ **White Blood Cells (WBC)** - Bạch cầu  
- 🟡 **Platelets** - Tiểu cầu

### Giao diện tabs:
- **📷 Upload Ảnh**: Phân tích ảnh tĩnh với bounding boxes
- **🎥 YouTube Video**: Phân tích video/shorts với frame viewer

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework  
- **torchvision** - Computer vision library
- **OpenCV** - Image processing
- **PIL/Pillow** - Python Imaging Library với ImageDraw
- **yt-dlp** - YouTube video downloader
- **moviepy** - Video processing

### Frontend
- **React** - JavaScript UI framework
- **React Konva** - 2D canvas library for visualization
- **Axios** - HTTP client
- **React Dropzone** - File upload component
- **React Loader Spinner** - Loading animations

### AI Model
- **SSD300_VGG16** - Single Shot MultiBox Detector
- **Transfer Learning** - Fine-tuned cho tế bào máu
- **Custom Classification Head** - 4 classes (background + 3 cell types)
- **Trained Model**: `SSD_custom.pth` - Custom weights cho tế bào máu detection

## 📦 Cài đặt và Chạy

### 🖥️ Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu |
|------------|-------------------|
| Python | 3.8+ |
| Node.js | 16+ |
| npm | 8+ |
| RAM | 4GB+ |
| Storage | 2GB+ |

### 📋 Clone Repository

```bash
git clone https://github.com/lananhdl/blooddetection.git
cd SSD_Detection
```

---

## 🚀 Hướng dẫn chạy theo từng hệ điều hành

### 🍎 **macOS**

#### Setup Backend
```bash
# Tạo virtual environment
cd backend
python3 -m venv .venv
source .venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy backend
python app.py
```

#### Setup Frontend
```bash
# Mở terminal mới
cd frontend
npm install
npm start
```

### 🪟 **Windows**

#### Setup Backend (PowerShell/CMD)
```cmd
# Tạo virtual environment
cd backend
python -m venv .venv
.venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy backend
python app.py
```

#### Setup Frontend (PowerShell/CMD)
```cmd
# Mở CMD/PowerShell mới
cd frontend
npm install
npm start
```

### 🐧 **Linux (Ubuntu/Debian)**

#### Cài đặt dependencies hệ thống
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm python3-venv
```

#### Setup Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

#### Setup Frontend
```bash
# Terminal mới
cd frontend
npm install
npm start
```

### 📱 **Truy cập ứng dụng**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 🐳 Chạy với Docker

### Backend Container
```bash
cd backend
docker build -t blood-cell-backend .
docker run -p 8000:8000 -v $(pwd)/../SSD_custom.pth:/app/SSD_custom.pth blood-cell-backend
```

### Frontend Container  
```bash
cd frontend
docker build -t blood-cell-frontend .
docker run -p 3000:3000 blood-cell-frontend
```

### Docker Compose (Khuyến nghị)
```bash
# Chạy toàn bộ stack
docker-compose up --build

# Chạy background
docker-compose up -d --build
```

## 📱 Hướng dẫn sử dụng chi tiết

### 🖼️ **Tab "Upload Ảnh"**

1. **Upload**: Kéo thả hoặc click để chọn ảnh tế bào máu
2. **Xử lý**: AI phân tích ảnh (thường < 5 giây)  
3. **Kết quả**: 
   - Ảnh với bounding boxes màu sắc
   - Thống kê số lượng từng loại tế bào
   - Chi tiết detection khi click
4. **Tải xuống**: Save ảnh kết quả

### 🎥 **Tab "YouTube Video"**

1. **Nhập URL**: Paste URL YouTube (video hoặc shorts)
   ```
   ✅ https://www.youtube.com/watch?v=VIDEO_ID
   ✅ https://youtu.be/VIDEO_ID  
   ✅ https://youtube.com/shorts/SHORTS_ID
   ```

2. **Chọn frames**: Slider từ 10-100 frames (nhiều = chi tiết hơn)

3. **Phân tích**: Click "🔍 Phân tích Video"

4. **Xem kết quả**:
   - **Timeline chart**: Overview detections qua từng frame
   - **Frame browser**: Duyệt từng frame với slider/buttons
   - **Image viewer**: Xem frame với bounding boxes
   - **Toggle switch**: Bật/tắt bounding boxes
   - **Statistics**: Thống kê tổng quan video

5. **Tương tác**:
   - Click timeline để jump đến frame
   - Dùng Previous/Next để duyệt frame
   - Toggle để so sánh ảnh gốc vs detected

## 🎯 API Endpoints

### Image Analysis
- `GET /` - Health check
- `GET /health` - Detailed status  
- `POST /predict` - Phát hiện tế bào trong ảnh
- `GET /classes` - Danh sách cell classes

### Video Analysis 
- `POST /predict-youtube` - Phát hiện tế bào trong video YouTube
- `GET /video-limits` - Giới hạn video processing
- `GET /model-info` - Thông tin model

### Ví dụ API calls:

#### Phân tích ảnh
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@blood_sample.jpg"
```

#### Phân tích video YouTube
```bash
curl -X POST "http://localhost:8000/predict-youtube" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://www.youtube.com/watch?v=VIDEO_ID",
       "max_frames": 30,
       "confidence_threshold": 0.5
     }'
```

## 📊 Cấu trúc dự án

```
SSD_Detection/
├── backend/
│   ├── app.py                    # FastAPI main application
│   ├── video_processor.py        # ⭐ YouTube video processing  
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile               # Docker config for backend
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js         # App header
│   │   │   ├── ImageUploader.js  # Image upload component
│   │   │   ├── YouTubeUploader.js # ⭐ YouTube URL input
│   │   │   ├── ResultsDisplay.js # Image results viewer
│   │   │   ├── VideoResultsDisplay.js # ⭐ Video results viewer
│   │   │   └── *.css            # Component styling
│   │   ├── App.js               # ⭐ Main App with tabs
│   │   └── index.js             # Entry point
│   ├── public/                  # Static files
│   ├── package.json             # Node dependencies  
│   └── Dockerfile              # Docker config for frontend
├── SSD_custom.pth              # ⭐ Trained model file
├── OBJECT_DETECTION.ipynb      # Original training notebook
├── docker-compose.yml          # ⭐ Full stack orchestration
├── start.sh                    # ⭐ Quick start script
├── start-dev.sh               # ⭐ Development start script
└── README.md                  # This documentation
```

## 🔧 Tùy chỉnh nâng cao

### Thay đổi confidence threshold
```python
# backend/app.py - postprocess_predictions()
confidence_threshold=0.5  # Thay đổi 0.1-0.9
```

### Thay đổi video limits
```python  
# backend/app.py - download_youtube_video()
max_duration: int = 300  # seconds (5 phút)
max_allowed = 180       # YouTube Shorts (3 phút)  
```

### Thay đổi colors
```javascript
// frontend/src/components/VideoResultsDisplay.js
const colors = {
  'Platelets': '#FFD700',  // Gold
  'RBC': '#FF6B6B',        // Red  
  'WBC': '#4ECDC4',        // Teal
};
```

## 🚨 Xử lý sự cố

### Backend không start
```bash
# Kiểm tra port
lsof -ti:8000 | xargs kill -9

# Kiểm tra model file
ls -la SSD_custom.pth

# Reinstall dependencies  
pip install -r requirements.txt --force-reinstall
```

### Frontend không build
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Kiểm tra Node version
node --version  # Should be 16+
```

### YouTube video không download được
- Kiểm tra URL hợp lệ
- Thử video khác (một số video bị hạn chế)
- Kiểm tra kết nối internet
- Video có thể quá dài (>5 phút cho video thường, >3 phút cho Shorts)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Tác giả & Liên hệ

Dự án được phát triển sử dụng mô hình SSD cho phát hiện tế bào máu với khả năng phân tích video YouTube.

### 📧 **Liên hệ:**
- **Email 1**: 24C11002@student.edu.vn
- **Email 2**: 24C11039@student.edu.vn

### 🎓 **Thông tin dự án:**
- **Model**: SSD300_VGG16 Transfer Learning
- **Framework**: FastAPI + React
- **Tính năng đặc biệt**: YouTube Video Analysis

## 🌟 **Chúng em xin chân thành cảm ơn thầy Thái và thầy Khoa!**
