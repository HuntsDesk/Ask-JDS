I use a video service called Gumlet to host my DRM protected course videos. in "lessons" in the database, we created a video_url field, which was a placeholder for how we might reference videos dynamically. 


https://docs.gumlet.com/reference/drm-with-reactjs

# 🔐 DRM-Protected Video Playback Integration (Gumlet)

This guide walks through how to securely embed and stream DRM-protected video content from Gumlet within the React app.

---

## ✅ Requirements

- React 16.8+
- Video asset processed with Gumlet DRM-enabled profile
- Backend JWT generation with your Gumlet DRM Secret

---

## 🛠 Installation

Install Gumlet's DRM-enabled player package:

```bash
npm install @gumlet/react-drm-player



⸻

🎬 Usage in React

Create a VideoPlayer.jsx component:

import ReactDRMPlayer from '@gumlet/react-drm-player';

const VideoPlayer = ({ authToken }) => {
  const onError = (event) => {
    console.error('Playback error:', event.detail);
  };

  return (
    <ReactDRMPlayer
      src="https://video.gumlet.io/6747983e53ef464e4ecd1982/67479d574b7280df4bfa33c7/main.mpd"
      licenseServer="https://drm.gumlet.io/license"
      authToken={authToken}
      onPlayerError={onError}
      width="100%"
      height="auto"
      controls
    />
  );
};

export default VideoPlayer;



⸻

🔑 Backend: Generate JWT Token for DRM

Use your DRM Secret Key to generate a signed token (JWT). Here’s a Node.js example:

const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    video_id: '67479d574b7280df4bfa33c7',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
  },
  process.env.GUMLET_DRM_SECRET,
  { algorithm: 'HS256' }
);

console.log(token);

Pass this token securely to the frontend and inject it as authToken into the ReactDRMPlayer.

⸻

📦 Example Video Metadata
	•	Video Title: Claim Preclusion
	•	Asset ID: 67479d574b7280df4bfa33c7
	•	DASH Playback URL:
https://video.gumlet.io/6747983e53ef464e4ecd1982/67479d574b7280df4bfa33c7/main.mpd
	•	HLS URL (non-DRM fallback, not recommended):
https://video.gumlet.io/6747983e53ef464e4ecd1982/67479d574b7280df4bfa33c7/main.m3u8
	•	Thumbnail Preview:
https://video.gumlet.io/6747983e53ef464e4ecd1982/67479d574b7280df4bfa33c7/thumbnail-1-0.png
	•	Subtitle:
67479d574b7280df4bfa33c7_0_en.vtt

⸻

🧩 Tips
	•	Do not use iframe embeds — they do not support DRM.
	•	Use .mpd (MPEG-DASH) URLs with licenseServer and authToken props for secure playback.
	•	Add dynamic watermarking or signed URLs for extra protection if needed.
	•	Optional: Hide download URLs from users in the frontend.

⸻

🔐 Security Checklist
	•	Use DRM-enabled video profile in Gumlet dashboard
	•	Enable private access + JWT token validation
	•	Deliver DRM tokens server-side only (never hardcode in frontend)
	•	Avoid exposing MP4 or download URLs

⸻

For detailed Gumlet DRM docs:
📘 https://docs.gumlet.com/reference/drm-with-reactjs