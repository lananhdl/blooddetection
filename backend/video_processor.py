import os
import cv2
import numpy as np
import yt_dlp
from typing import List, Dict, Generator
import tempfile
import threading
import time
from PIL import Image, ImageDraw, ImageFont
import torch
from pathlib import Path
import base64
import io
from moviepy.editor import VideoFileClip

class YouTubeVideoProcessor:
    def __init__(self, model, device, class_names):
        self.model = model
        self.device = device
        self.class_names = class_names
        self.temp_dir = tempfile.mkdtemp()
        
    def download_youtube_video(self, url: str, max_duration: int = 300) -> str:
        """Download video từ YouTube và trả về đường dẫn file"""
        try:
            # Cấu hình yt-dlp với hỗ trợ YouTube Shorts
            ydl_opts = {
                'format': 'best[height<=720][ext=mp4]/best[ext=mp4]/best',  # Hỗ trợ nhiều format hơn
                'outtmpl': os.path.join(self.temp_dir, '%(id)s.%(ext)s'),  # Dùng ID thay vì title
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,  # Đảm bảo extract full info
                'force_json': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Lấy thông tin video trước
                info = ydl.extract_info(url, download=False)
                duration = info.get('duration', 0)
                
                # Kiểm tra độ dài video (cho phép Shorts dài hơn)
                max_allowed = max_duration if duration and duration > 60 else 180  # Shorts có thể dài đến 3 phút
                if duration and duration > max_allowed:
                    raise ValueError(f"Video quá dài ({duration}s). Tối đa {max_allowed}s")
                
                # Download video
                ydl.download([url])
                
                # Tìm file đã download (hỗ trợ nhiều format)
                video_files = list(Path(self.temp_dir).glob('*.*'))
                video_files = [f for f in video_files if f.suffix.lower() in ['.mp4', '.webm', '.mkv', '.avi']]
                
                if not video_files:
                    raise FileNotFoundError("Không thể download video")
                
                return str(video_files[0])
                
        except Exception as e:
            raise Exception(f"Lỗi download video: {str(e)}")
    
    def extract_frames(self, video_path: str, max_frames: int = 100) -> Generator[np.ndarray, None, None]:
        """Extract frames từ video"""
        cap = cv2.VideoCapture(video_path)
        
        try:
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # Tính toán step để lấy đủ frames mà không quá nhiều
            step = max(1, total_frames // max_frames)
            
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % step == 0:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    yield frame_rgb
                
                frame_count += 1
                
        finally:
            cap.release()
    
    def detect_in_frame(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> tuple[List[Dict], Image.Image]:
        """Phát hiện tế bào trong 1 frame và trả về kết quả + ảnh gốc"""
        try:
            pil_image = Image.fromarray(frame)
            original_size = pil_image.size

            # --- ZOOM vào giữa frame ---
            zoom_factor = 1.0  # Có thể chỉnh 1.2, 1.5, 2.0 tùy ý
            new_w, new_h = int(original_size[0] / zoom_factor), int(original_size[1] / zoom_factor)
            left = (original_size[0] - new_w) // 2
            top = (original_size[1] - new_h) // 2
            right = left + new_w
            bottom = top + new_h
            pil_image = pil_image.crop((left, top, right, bottom))
            # --- KẾT THÚC ZOOM ---

            # Resize để inference
            resized_image = pil_image.resize((300, 300))
            
            # Convert to tensor
            from torchvision.transforms import transforms
            transform = transforms.Compose([transforms.ToTensor()])
            image_tensor = transform(resized_image).unsqueeze(0).to(self.device)
            
            # Inference
            with torch.no_grad():
                predictions = self.model(image_tensor)
            
            # Process predictions
            results = []
            if predictions and len(predictions) > 0:
                prediction = predictions[0]
                boxes = prediction['boxes'].cpu().numpy()
                scores = prediction['scores'].cpu().numpy()
                labels = prediction['labels'].cpu().numpy()
                
                # Filter by confidence
                mask = scores > confidence_threshold
                boxes = boxes[mask]
                scores = scores[mask]
                labels = labels[mask]
                
                # Scale boxes về kích thước gốc
                scale_x = original_size[0] / 300
                scale_y = original_size[1] / 300
                
                for box, score, label in zip(boxes, scores, labels):
                    x1, y1, x2, y2 = box
                    
                    # Scale coordinates về original size
                    x1_scaled = x1 * scale_x
                    y1_scaled = y1 * scale_y
                    x2_scaled = x2 * scale_x
                    y2_scaled = y2 * scale_y
                    
                    class_name = self.class_names[label] if label < len(self.class_names) else 'unknown'
                    
                    results.append({
                        'bbox': [float(x1_scaled), float(y1_scaled), float(x2_scaled), float(y2_scaled)],
                        'confidence': float(score),
                        'class_id': int(label),
                        'class_name': class_name
                    })
            
            return results, pil_image
            
        except Exception as e:
            print(f"Error in frame detection: {e}")
            return [], Image.fromarray(frame)

    def draw_bounding_boxes(self, image: Image.Image, detections: List[Dict]) -> Image.Image:
        """Vẽ bounding box lên ảnh"""
        try:
            # Create a copy để không modify original
            img_with_boxes = image.copy()
            draw = ImageDraw.Draw(img_with_boxes)
            
            # Color map cho các loại tế bào
            colors = {
                'Platelets': '#FFD700',  # Gold
                'RBC': '#FF6B6B',        # Red
                'WBC': '#4ECDC4',        # Teal
            }
            
            # Try to load a font, fallback to default
            try:
                # Thử load font system
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
            except:
                try:
                    font = ImageFont.truetype("arial.ttf", 16)
                except:
                    font = ImageFont.load_default()
            
            for detection in detections:
                x1, y1, x2, y2 = detection['bbox']
                class_name = detection['class_name']
                confidence = detection['confidence']
                
                # Lấy màu cho class
                color = colors.get(class_name, '#888888')
                
                # Vẽ bounding box
                draw.rectangle(
                    [(x1, y1), (x2, y2)],
                    outline=color,
                    width=3
                )
                
                # Vẽ label và confidence (HIỂN THỊ PHẦN TRĂM)
                label_text = f"{class_name}: {confidence * 100:.1f}%"
                # Tính toán vị trí text
                try:
                    bbox = draw.textbbox((0, 0), label_text, font=font)
                    text_width = bbox[2] - bbox[0]
                    text_height = bbox[3] - bbox[1]
                except:
                    # Fallback cho older PIL versions
                    text_width, text_height = draw.textsize(label_text, font=font)
                
                # Background cho text
                text_bg_coords = [
                    (x1, y1 - text_height - 4),
                    (x1 + text_width + 8, y1)
                ]
                draw.rectangle(text_bg_coords, fill=color)
                
                # Text
                draw.text(
                    (x1 + 4, y1 - text_height - 2),
                    label_text,
                    fill='white',
                    font=font
                )
            
            return img_with_boxes
            
        except Exception as e:
            print(f"Error drawing bounding boxes: {e}")
            return image

    def frame_to_base64(self, image: Image.Image, quality: int = 85) -> str:
        """Convert PIL Image thành base64 string"""
        try:
            buffer = io.BytesIO()
            # Resize nếu quá lớn để tiết kiệm bandwidth
            max_size = 800
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            image.save(buffer, format='JPEG', quality=quality, optimize=True)
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{img_str}"
        except Exception as e:
            print(f"Error converting image to base64: {e}")
            return ""
    
    def process_video(self, url: str, max_frames: int = 50) -> Dict:
        """Xử lý toàn bộ video từ YouTube"""
        try:
            # Download video
            video_path = self.download_youtube_video(url)
            
            # Thống kê
            frame_results = []
            total_detections = 0
            class_counts = {'Platelets': 0, 'RBC': 0, 'WBC': 0}
            
            # Process từng frame
            for frame_idx, frame in enumerate(self.extract_frames(video_path, max_frames)):
                if frame_idx >= max_frames:
                    break
                
                # Detect và lấy ảnh gốc
                detections, original_frame = self.detect_in_frame(frame)
                
                # Vẽ bounding boxes lên ảnh
                frame_with_boxes = self.draw_bounding_boxes(original_frame, detections)
                
                # Convert thành base64
                frame_base64 = self.frame_to_base64(frame_with_boxes)
                original_frame_base64 = self.frame_to_base64(original_frame)
                
                # Cập nhật thống kê
                for detection in detections:
                    class_name = detection['class_name']
                    if class_name in class_counts:
                        class_counts[class_name] += 1
                        total_detections += 1
                
                frame_results.append({
                    'frame_index': frame_idx,
                    'detections': detections,
                    'detection_count': len(detections),
                    'frame_image': frame_base64,  # Frame với bounding boxes
                    'original_frame': original_frame_base64,  # Frame gốc
                    'timestamp': f"{frame_idx * (1.0 / 30):.2f}s"  # Giả sử 30 FPS
                })
                
                # Progress callback có thể thêm sau
                print(f"Processed frame {frame_idx + 1}/{max_frames}")
            
            # Cleanup
            try:
                os.remove(video_path)
            except:
                pass
            
            return {
                'success': True,
                'total_frames_processed': len(frame_results),
                'total_detections': total_detections,
                'class_statistics': class_counts,
                'frame_results': frame_results,
                'average_detections_per_frame': total_detections / len(frame_results) if frame_results else 0
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup(self):
        """Dọn dẹp thư mục tạm"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
        except:
            pass 

def process_video_with_boxes(self, input_path, output_path):
    def process_frame(frame):
        # Detect + vẽ box trên frame
        pil_image = Image.fromarray(frame)
        # ... detect, vẽ box như các hàm hiện tại ...
        # Trả về numpy array
        return np.array(pil_image_with_boxes)
    clip = VideoFileClip(input_path)
    new_clip = clip.fl_image(process_frame)
    new_clip.write_videofile(output_path, audio=False) 