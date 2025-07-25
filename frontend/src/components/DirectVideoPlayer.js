import React, { useState } from "react";
import axios from "axios";

function DirectVideoPlayer() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    setLoading(true);
    setVideoUrl(null);
    try {
      const response = await axios.post(
        "http://localhost:8000/process-youtube-video",
        { url: youtubeUrl },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "video/mp4" });
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert("Lỗi xử lý video!");
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        type="text"
        value={youtubeUrl}
        onChange={e => setYoutubeUrl(e.target.value)}
        placeholder="Nhập link YouTube"
        style={{ width: "400px" }}
      />
      <button onClick={handleProcess} disabled={loading || !youtubeUrl}>
        {loading ? "Đang xử lý..." : "Phát video detect"}
      </button>
      {videoUrl && (
        <video controls width="600" src={videoUrl} style={{ marginTop: 20 }} />
      )}
    </div>
  );
}

export default DirectVideoPlayer;
