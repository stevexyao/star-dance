
import React, { useEffect, useRef } from 'react';
import { GestureState, HandPoint } from '../types';

interface HandDetectorProps {
  onStateChange: (state: GestureState) => void;
}

const HandDetector: React.FC<HandDetectorProps> = ({ onStateChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const points: HandPoint[] = [];
        results.multiHandLandmarks.forEach((landmarks: any) => {
          // Track specific points: Index fingertip (8), Middle fingertip (12), Thumb tip (4)
          [4, 8, 12].forEach(index => {
            points.push({
              x: landmarks[index].x,
              y: landmarks[index].y,
              z: landmarks[index].z
            });
          });
        });
        onStateChange({ isDetected: true, points });
      } else {
        onStateChange({ isDetected: false, points: [] });
      }
    });

    // @ts-ignore
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onStateChange]);

  return (
    <video
      ref={videoRef}
      className="fixed bottom-4 right-4 w-48 h-32 rounded-lg border-2 border-indigo-500/50 opacity-20 pointer-events-none transform scale-x-[-1]"
      autoPlay
      playsInline
    />
  );
};

export default HandDetector;
