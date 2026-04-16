import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackPoint } from '@minga/types';
import { summarizeTrack } from '@minga/logic';

export type TrackerStatus = 'idle' | 'recording' | 'paused' | 'ended';

// A platform-agnostic live-tracking engine.
// Apps inject a `startLocationStream` adapter:
//   - web: navigator.geolocation.watchPosition
//   - native: expo-location watchPositionAsync
// That way the session logic (pause/resume/elapsed/summary) lives once in shared code.

export interface LocationStreamHandle {
  stop(): void;
}

export type StartLocationStream = (
  onPoint: (p: TrackPoint) => void,
  onError?: (err: Error) => void,
) => Promise<LocationStreamHandle> | LocationStreamHandle;

export function useTracker(startLocationStream: StartLocationStream) {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [error, setError] = useState<string | null>(null);

  const handleRef = useRef<LocationStreamHandle | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0); // seconds from previous pause segments

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startTick = () => {
    startedAtRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const segMs = Date.now() - startedAtRef.current;
      setElapsed(Math.round(accumulatedRef.current + segMs / 1000));
    }, 1000);
  };

  const start = useCallback(async () => {
    setError(null);
    try {
      const handle = await startLocationStream(
        (p) => setPoints((prev) => [...prev, p]),
        (err) => setError(err.message),
      );
      handleRef.current = handle;
      accumulatedRef.current = 0;
      setElapsed(0);
      setPoints([]);
      setStatus('recording');
      startTick();
    } catch (e: any) {
      setError(e?.message ?? 'Location unavailable');
    }
  }, [startLocationStream]);

  const pause = useCallback(() => {
    if (status !== 'recording') return;
    clearTick();
    const segMs = Date.now() - startedAtRef.current;
    accumulatedRef.current += segMs / 1000;
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setStatus('recording');
    startTick();
  }, [status]);

  const stop = useCallback(() => {
    if (status === 'recording') {
      const segMs = Date.now() - startedAtRef.current;
      accumulatedRef.current += segMs / 1000;
      setElapsed(Math.round(accumulatedRef.current));
    }
    clearTick();
    handleRef.current?.stop();
    handleRef.current = null;
    setStatus('ended');
  }, [status]);

  const reset = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    clearTick();
    accumulatedRef.current = 0;
    setPoints([]);
    setElapsed(0);
    setStatus('idle');
    setError(null);
  }, []);

  useEffect(() => () => {
    handleRef.current?.stop();
    clearTick();
  }, []);

  const summary = summarizeTrack(points);
  // elapsed is our source of truth for duration because it respects pauses.
  summary.durationSeconds = elapsed;
  summary.avgSpeedKmh = elapsed > 0 ? summary.distanceKm / (elapsed / 3600) : 0;

  return { status, points, elapsed, error, summary, start, pause, resume, stop, reset };
}
