import React, { useRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

// A horizontal ScrollView whose content is laid out row-reverse (the app's RTL
// look under forced-LTR). The scroll offset itself is never RTL-aware, so on
// its own the view rests at the LEFT edge on mount — showing the content's
// LAST items and leaving the true first (rightmost, most prominent) item
// scrolled out of view until the user drags right. Scrolling to the end here
// puts the resting view at the right edge instead, where the first item is.
export default function RtlScrollRow({ onContentSizeChange, ...props }: ScrollViewProps) {
  const ref = useRef<React.ElementRef<typeof ScrollView>>(null);
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={(w, h) => {
        ref.current?.scrollToEnd({ animated: false });
        onContentSizeChange?.(w, h);
      }}
      {...props}
    />
  );
}
