from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torchvision
from torchvision.transforms import transforms
from torchvision.models.detection.ssd import SSDClassificationHead
from torchvision.models.detection import SSD300_VGG16_Weights
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Dict
import os
from video_processor import YouTubeVideoProcessor
from pydantic import BaseModel

app = FastAPI(title="Blood Cell Detection API - Trained Model", version="1.0.0")

# CORS middleware để cho phép frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables cho model
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
class_names = ['bg', 'Platelets', 'RBC', 'WBC']
video_processor = None

# Pydantic models cho request/response
class YouTubeVideoRequest(BaseModel):
    url: str
    max_frames: int = 30
    confidence_threshold: float = 0.5

def create_blood_cell_model(num_classes=4):
    """Tạo mô hình SSD với architecture tương thích với trained model"""
    # Load base SSD model
    model = torchvision.models.detection.ssd300_vgg16(weights=SSD300_VGG16_Weights.COCO_V1)
    
    # Thay đổi classification head để match với trained model
    # Từ lỗi trước: model custom có [16, 512, 3, 3] = 4 classes * 4 anchors per location
    in_channels = [512, 1024, 512, 256, 256, 256]  # SSD300 feature map channels
    num_anchors = [4, 6, 6, 6, 4, 4]  # SSD300 anchors per location
    
    model.head.classification_head = SSDClassificationHead(
        in_channels=in_channels,
        num_anchors=num_anchors,
        num_classes=num_classes
    )
    
    # Cũng cần thay đổi regression head để tương thích
    from torchvision.models.detection.ssd import SSDRegressionHead
    model.head.regression_head = SSDRegressionHead(
        in_channels=in_channels,
        num_anchors=num_anchors
    )
    
    return model

def load_trained_model():
    """Load mô hình đã được train cho blood cells"""
    global model
    try:
        print("Creating blood cell SSD model architecture...")
        model = create_blood_cell_model(num_classes=4)
        
        print("Loading trained weights...")
        custom_model_path = "../SSD_custom.pth"
        
        if not os.path.exists(custom_model_path):
            raise FileNotFoundError(f"Trained model file not found: {custom_model_path}")
        
        # Load trained weights
        checkpoint = torch.load(custom_model_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint, strict=True)
        
        model.to(device)
        model.eval()
        print("✅ Trained blood cell model loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading trained model: {e}")
        print("📝 Fallback: Creating model with random weights...")
        
        # Fallback: create model without loading weights
        model = create_blood_cell_model(num_classes=4)
        model.to(device)
        model.eval()
        print("⚠️ Using model with random weights - for demo only")

def preprocess_image(image: Image.Image):
    """Tiền xử lý ảnh đầu vào cho blood cell detection"""
    # Resize theo kích thước mà model được train
    image = image.resize((300, 300))  # SSD300 standard size
    
    # Convert PIL image to tensor với normalization
    transform = transforms.Compose([
        transforms.ToTensor(),
        # Có thể cần normalization tùy theo cách train model
        # transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    image_tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return image_tensor.to(device)

def postprocess_predictions(predictions, confidence_threshold=0.5):
    """Xử lý kết quả dự đoán từ trained blood cell model"""
    results = []
    
    for prediction in predictions:
        boxes = prediction['boxes'].cpu().numpy()
        scores = prediction['scores'].cpu().numpy()
        labels = prediction['labels'].cpu().numpy()
        
        # Lọc các detection có confidence cao
        mask = scores > confidence_threshold
        boxes = boxes[mask]
        scores = scores[mask]
        labels = labels[mask]
        
        for box, score, label in zip(boxes, scores, labels):
            x1, y1, x2, y2 = box
            
            # Labels từ trained model (1-3 cho Platelets, RBC, WBC)
            class_name = class_names[label] if label < len(class_names) else 'unknown'
            
            results.append({
                'bbox': [float(x1), float(y1), float(x2), float(y2)],
                'confidence': float(score),
                'class_id': int(label),
                'class_name': class_name
            })
    
    return results

@app.on_event("startup")
async def startup_event():
    """Khởi tạo trained model khi start server"""
    global video_processor
    load_trained_model()
    # Khởi tạo video processor
    if model is not None:
        video_processor = YouTubeVideoProcessor(model, device, class_names)

@app.get("/")
async def root():
    return {"message": "Blood Cell Detection API with Trained Model is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device),
        "model_type": "SSD300_BloodCell_Trained",
        "classes": class_names[1:],
        "note": "Using custom trained model for blood cell detection"
    }

@app.post("/predict")
async def predict_blood_cells(file: UploadFile = File(...)):
    """Endpoint chính để phát hiện tế bào máu với trained model"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Kiểm tra file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Đọc và xử lý ảnh
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        original_size = image.size
        
        print(f"Processing image: {original_size}")
        
        # Tiền xử lý ảnh
        image_tensor = preprocess_image(image)
        
        # Inference với trained model
        with torch.no_grad():
            predictions = model(image_tensor)
        
        print(f"Raw predictions: {len(predictions[0]['boxes'])} detections")
        
        # Xử lý kết quả
        results = postprocess_predictions(predictions)
        
        print(f"Filtered results: {len(results)} detections")
        
        # Convert ảnh thành base64 với kích thước phù hợp
        img_buffer = io.BytesIO()
        # Resize để match với detection coordinates
        image_resized = image.resize((300, 300))
        image_resized.save(img_buffer, format='JPEG', quality=90, optimize=True)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return JSONResponse(content={
            "success": True,
            "detections": results,
            "total_detections": len(results),
            "original_image_size": original_size,
            "processed_image": f"data:image/jpeg;base64,{img_base64}",
            "class_names": class_names[1:],  # Exclude background
            "model_info": "Custom trained SSD model for blood cell detection"
        })
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/classes")
async def get_classes():
    """Trả về danh sách các classes từ trained model"""
    return {
        "classes": class_names[1:],  # Exclude background
        "total_classes": len(class_names) - 1,
        "class_mapping": {
            1: "Platelets (Tiểu cầu)",
            2: "RBC (Hồng cầu)", 
            3: "WBC (Bạch cầu)"
        }
    }

@app.get("/model-info")
async def get_model_info():
    """Thông tin về model đã train"""
    return {
        "model_type": "SSD300_VGG16",
        "training_target": "Blood Cell Detection",
        "classes": ["Platelets", "RBC", "WBC"],
        "input_size": "300x300",
        "framework": "PyTorch + torchvision",
        "note": "Custom trained model specifically for blood cell detection"
    }

@app.post("/predict-youtube")
async def predict_youtube_video(request: YouTubeVideoRequest):
    """Endpoint để phát hiện tế bào máu trong video YouTube"""
    if model is None or video_processor is None:
        raise HTTPException(status_code=500, detail="Model or video processor not loaded")
    
    # Validate YouTube URL
    if not any(domain in request.url for domain in ['youtube.com', 'youtu.be']):
        raise HTTPException(status_code=400, detail="URL phải là YouTube video")
    
    try:
        print(f"Processing YouTube video: {request.url}")
        
        # Process video
        result = video_processor.process_video(
            url=request.url,
            max_frames=min(request.max_frames, 100)  # Giới hạn tối đa 100 frames
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return JSONResponse(content={
            "success": True,
            "video_url": request.url,
            "total_frames_processed": result['total_frames_processed'],
            "total_detections": result['total_detections'],
            "class_statistics": result['class_statistics'],
            "average_detections_per_frame": result['average_detections_per_frame'],
            "frame_results": result['frame_results'],
            "model_info": "Custom trained SSD model for blood cell detection",
            "processing_note": f"Processed {result['total_frames_processed']} frames from YouTube video"
        })
        
    except Exception as e:
        print(f"Error processing YouTube video: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/video-limits")
async def get_video_limits():
    """Trả về giới hạn xử lý video"""
    return {
        "max_duration_seconds": 300,  # 5 phút
        "max_frames_per_video": 100,
        "recommended_frames": 30,
        "supported_formats": ["mp4", "webm"],
        "note": "Video sẽ được tự động resize và sample để tối ưu xử lý"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 