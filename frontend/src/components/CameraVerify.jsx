import { useEffect, useRef, useState } from 'react';
import { Alert, Modal } from './ui.jsx';

/**
 * Camera + GPS check. Face detection runs in the browser (Shape Detection API: window.FaceDetector,
 * available in Chromium-based browsers). Only { faceCount, lat, lng, accuracy } is sent: no photo leaves the device
 * and the server computes the distance itself.
 */
export default function CameraVerify({ title, onVerified, onClose }) {
  const video = useRef(null);
  const [faces, setFaces] = useState(0);
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState(null);
  const supported = typeof window !== 'undefined' && 'FaceDetector' in window;

  useEffect(() => {
    let stream, timer, stopped = false;
    if (!supported) return undefined;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (stopped) return;
        video.current.srcObject = stream; await video.current.play();
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
        timer = setInterval(async () => { try { setFaces((await detector.detect(video.current)).length); } catch { /* frame not ready */ } }, 600);
      } catch { setErr('Camera access was blocked. Allow camera permission for this site and try again.'); }
    })();
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => setErr((e) => e || 'Location access was blocked. Allow location permission and try again.'),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [supported]);

  const ready = supported && faces === 1 && pos;
  return (
    <Modal title={title} onClose={onClose}>
      {!supported ? <Alert kind="warn">This browser cannot detect faces (no FaceDetector support). Use a recent Chrome or Edge, or ask HR for another way to record attendance.</Alert> : (
        <>
          <video ref={video} muted playsInline className="cam" aria-label="Camera preview" />
          <p aria-live="polite">{faces === 1 ? 'One face detected.' : faces === 0 ? 'No face detected. Look at the camera.' : `${faces} faces detected. Only you should be in view.`}</p>
          <p aria-live="polite">{pos ? `Location found (accuracy ±${Math.round(pos.accuracy)} m${pos.accuracy > 100 ? ', too low: move to open sky or near a window' : ''}).` : 'Finding your location…'}</p>
        </>
      )}
      <Alert>{err}</Alert>
      <div className="row"><button disabled={!ready} onClick={() => onVerified({ faceCount: faces, ...pos })}>Confirm</button><button className="ghost" onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}
