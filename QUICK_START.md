# 🚀 Quick Start Guide - Blood Cell Detection Website

## 🎯 Mục đích
Website phát hiện tế bào máu sử dụng AI với mô hình SSD (Single Shot MultiBox Detector).

## ⚡ Chạy nhanh với Docker (Khuyến nghị)

### Yêu cầu
- Docker và Docker Compose đã cài đặt
- File `SSD_custom.pth` có trong thư mục gốc

### Bước thực hiện
```bash
# 1. Chạy script tự động
./start.sh

# Hoặc chạy thủ công
docker-compose up --build
```

🎉 **Thành công!**
- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🛠️ Chạy Development Mode

### Yêu cầu  
- Python 3.8+
- Node.js 16+
- npm

### Bước thực hiện
```bash
# Chạy script tự động
./start-dev.sh

# Hoặc thủ công:
# 1. Backend
cd backend
pip install -r requirements.txt  
python app.py &

# 2. Frontend
cd frontend
npm install
npm start
```

## 🧪 Test Setup

```bash
# Test backend setup
python3 test-setup.py

# Test model loading
cd backend
python -c "import torch; print('PyTorch:', torch.__version__)"
```

## 📱 Cách sử dụng

1. **Upload ảnh**: Kéo thả ảnh tế bào máu vào website
2. **Đợi phân tích**: AI sẽ phát hiện tế bào (~ 3-5 giây)  
3. **Xem kết quả**: 
   - Bounding boxes màu sắc cho từng loại tế bào
   - Thống kê số lượng chi tiết
4. **Tải xuống**: Lưu ảnh đã phân tích

## 🎨 Loại tế bào được phát hiện

- 🔴 **RBC (Red Blood Cells)** - Hồng cầu
- ⚪ **WBC (White Blood Cells)** - Bạch cầu  
- 🟡 **Platelets** - Tiểu cầu

## 🔧 Troubleshooting

### Lỗi Model không tìm thấy
```bash
# Đảm bảo file SSD_custom.pth ở đúng vị trí
ls -la SSD_custom.pth
```

### Lỗi Dependencies
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend  
cd frontend && npm install
```

### Port đã sử dụng
```bash
# Thay đổi port trong docker-compose.yml
# hoặc kill process đang dùng port
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

## 📞 Hỗ trợ

- 📖 Xem [README.md](README.md) để biết chi tiết
- 🐛 Báo lỗi qua Issues
- 💡 Đóng góp ý tưởng qua Pull Requests

---
*Được xây dựng với ❤️ sử dụng FastAPI, React và PyTorch* 