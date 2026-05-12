import React, { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { useTheme, radii } from '@minga/theme';

export interface DualRangeSliderProps {
  min: number;
  max: number;
  // Snap step. 0 disables snapping.
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  // Optional: called once the gesture ends. Useful when the parent runs an
  // expensive refetch — keep it on `onChangeEnd` instead of `onChange`.
  onChangeEnd?: (next: [number, number]) => void;
  trackHeight?: number;
  thumbSize?: number;
}

const HIT_SLOP = 16;

export function DualRangeSlider({
  min,
  max,
  step = 0,
  value,
  onChange,
  onChangeEnd,
  trackHeight = 4,
  thumbSize = 22,
}: DualRangeSliderProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const trackRef = useRef<View | null>(null);
  // Mutable refs so the PanResponder (created once via useRef) always reads
  // the latest props/state. Without these, the responder closes over stale
  // `width`/`value` from the first render.
  const trackPageXRef = useRef(0);
  const widthRef = useRef(0);
  const valueRef = useRef<[number, number]>(value);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);
  widthRef.current = width;
  valueRef.current = value;
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  onChangeRef.current = onChange;
  onChangeEndRef.current = onChangeEnd;

  const range = Math.max(1, max - min);

  const updateTrackPageX = () => {
    if (trackRef.current && typeof trackRef.current.measureInWindow === 'function') {
      trackRef.current.measureInWindow((x) => {
        trackPageXRef.current = x;
      });
    }
  };

  const moveTo = (pageX: number, which: 'low' | 'high') => {
    const w = widthRef.current;
    if (w <= 0) return;
    const lo = minRef.current;
    const hi = maxRef.current;
    const localX = pageX - trackPageXRef.current;
    const clamped = Math.min(w, Math.max(0, localX));
    const raw = lo + (clamped / w) * Math.max(1, hi - lo);
    const stepped = stepRef.current ? Math.round(raw / stepRef.current) * stepRef.current : raw;
    const [curLo, curHi] = valueRef.current;
    const next: [number, number] =
      which === 'low'
        ? [Math.min(curHi, Math.max(lo, stepped)), curHi]
        : [curLo, Math.max(curLo, Math.min(hi, stepped))];
    onChangeRef.current(next);
  };

  const lowResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        updateTrackPageX();
        moveTo(e.nativeEvent.pageX, 'low');
      },
      onPanResponderMove: (e) => moveTo(e.nativeEvent.pageX, 'low'),
      onPanResponderRelease: () => onChangeEndRef.current?.(valueRef.current),
      onPanResponderTerminate: () => onChangeEndRef.current?.(valueRef.current),
    }),
  ).current;

  const highResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        updateTrackPageX();
        moveTo(e.nativeEvent.pageX, 'high');
      },
      onPanResponderMove: (e) => moveTo(e.nativeEvent.pageX, 'high'),
      onPanResponderRelease: () => onChangeEndRef.current?.(valueRef.current),
      onPanResponderTerminate: () => onChangeEndRef.current?.(valueRef.current),
    }),
  ).current;

  const lowPx = width > 0 ? ((value[0] - min) / range) * width : 0;
  const highPx = width > 0 ? ((value[1] - min) / range) * width : 0;

  return (
    <View
      style={{
        height: thumbSize + 8,
        justifyContent: 'center',
        paddingHorizontal: thumbSize / 2,
      }}
    >
      <View
        ref={trackRef}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          updateTrackPageX();
        }}
        style={{
          height: trackHeight,
          backgroundColor: theme.surfaceAlt,
          borderRadius: trackHeight,
          position: 'relative',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: lowPx,
            width: Math.max(0, highPx - lowPx),
            height: trackHeight,
            backgroundColor: theme.primary,
            borderRadius: trackHeight,
          }}
        />
        <View
          {...lowResponder.panHandlers}
          hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP, left: HIT_SLOP, right: HIT_SLOP }}
          style={{
            position: 'absolute',
            left: lowPx - thumbSize / 2,
            top: -thumbSize / 2 + trackHeight / 2,
            width: thumbSize,
            height: thumbSize,
            borderRadius: radii.pill,
            backgroundColor: theme.primary,
            borderWidth: 2,
            borderColor: theme.background,
          }}
        />
        <View
          {...highResponder.panHandlers}
          hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP, left: HIT_SLOP, right: HIT_SLOP }}
          style={{
            position: 'absolute',
            left: highPx - thumbSize / 2,
            top: -thumbSize / 2 + trackHeight / 2,
            width: thumbSize,
            height: thumbSize,
            borderRadius: radii.pill,
            backgroundColor: theme.primary,
            borderWidth: 2,
            borderColor: theme.background,
          }}
        />
      </View>
    </View>
  );
}
