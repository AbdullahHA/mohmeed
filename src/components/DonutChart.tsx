import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Segment = { value: number; color: string };

type Props = {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  children?: React.ReactNode;
};

export default function DonutChart({ segments, size = 120, strokeWidth = 14, trackColor, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offsetSoFar = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {total > 0
          ? segments.map((seg, i) => {
              if (seg.value <= 0) return null;
              const fraction = seg.value / total;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const offset = -offsetSoFar;
              offsetSoFar += dash;
              return (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })
          : null}
      </Svg>
      {children}
    </View>
  );
}
