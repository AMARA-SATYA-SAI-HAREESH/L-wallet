// mobile/src/components/CoinIcon.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface Props {
  symbol: string;
  size?: number;
}

export function CoinIcon({ symbol, size = 38 }: Props) {
  const sym = (symbol || '').toUpperCase();

  if (sym === 'BNB' || sym === 'TBNB' || sym === 'WBNB') {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#F3BA2F' }]}>
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 128 128">
          <G fill="#FFFFFF">
            {/* Center diamond */}
            <Path d="M64 45.4L82.6 64L64 82.6L45.4 64L64 45.4Z" />
            {/* Top diamond */}
            <Path d="M64 12L77.9 25.9L64 39.8L50.1 25.9L64 12Z" />
            {/* Bottom diamond */}
            <Path d="M64 88.2L77.9 102.1L64 116L50.1 102.1L64 88.2Z" />
            {/* Left diamond */}
            <Path d="M25.9 50.1L39.8 64L25.9 77.9L12 64L25.9 50.1Z" />
            {/* Right diamond */}
            <Path d="M102.1 50.1L116 64L102.1 77.9L88.2 64L102.1 50.1Z" />
          </G>
        </Svg>
      </View>
    );
  }

  if (sym === 'USDT') {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#26A17B' }]}>
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 128 128">
          <G fill="#FFFFFF">
            {/* Tether T bar */}
            <Rect x="28" y="26" width="72" height="15" rx="3" />
            {/* Tether vertical trunk */}
            <Rect x="56" y="26" width="16" height="76" rx="3" />
            {/* Tether ring ellipse top */}
            <Path
              d="M64 54C43.5 54 26 59.2 26 65.5C26 71.8 43.5 77 64 77C84.5 77 102 71.8 102 65.5C102 59.2 84.5 54 64 54ZM64 71.5C48 71.5 35 68 35 65.5C35 63 48 59.5 64 59.5C80 59.5 93 63 93 65.5C93 68 80 71.5 64 71.5Z"
            />
          </G>
        </Svg>
      </View>
    );
  }

  if (sym === 'USDC') {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#2775CA' }]}>
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 128 128">
          <G fill="#FFFFFF">
            {/* Center dollar '$' */}
            <Path
              d="M69.5 48.5C69.5 44.5 66 42 61 42C56 42 52.5 44 52.5 47.5C52.5 54 75 52 75 66C75 73.5 68.5 77.5 61 78.5V85H55V78.5C47 77.5 42 72.5 42 65.5H50.5C50.5 70 54.5 72.5 60.5 72.5C66 72.5 69.5 70 69.5 66.5C69.5 59.5 47 62 47 48C47 41.5 53 37 60 36V30H66V36C73 37 77.5 41.5 77.5 48.5H69.5Z"
            />
            {/* Left curved arc */}
            <Path
              d="M32 40C24 53 24 75 32 88L26 92C16 76 16 52 26 36L32 40Z"
            />
            {/* Right curved arc */}
            <Path
              d="M96 40L102 36C112 52 112 76 102 92L96 88C104 75 104 53 96 40Z"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // Fallback for any other token
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#4A5568' }]}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#718096" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
