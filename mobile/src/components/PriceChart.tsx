// mobile/src/components/PriceChart.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, PanResponder, Dimensions,
} from 'react-native';
import Svg, {
  Path, Defs, LinearGradient, Stop, Line, Circle,
} from 'react-native-svg';
import { ChartPoint } from '../services/priceService';
import { COLORS } from '../constants/theme';
import { Skeleton } from './Skeleton';

interface PriceChartProps {
  data: ChartPoint[];
  loading: boolean;
  isPositive: boolean;
  onSelectPoint?: (point: ChartPoint | null) => void;
}

const CHART_WIDTH = Dimensions.get('window').width - 40;
const CHART_HEIGHT = 200;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 16;

export function PriceChart({
  data,
  loading,
  isPositive,
  onSelectPoint,
}: PriceChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const lineColor = isPositive ? COLORS.success : COLORS.error;

  const { linePath, areaPath, coords } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: '', areaPath: '', coords: [] as { x: number; y: number }[] };
    }

    let minP = data[0].price;
    let maxP = data[0].price;
    for (const p of data) {
      if (p.price < minP) minP = p.price;
      if (p.price > maxP) maxP = p.price;
    }
    const range = maxP - minP || 1;
    const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const pts = data.map((p, i) => {
      const x = (i / (data.length - 1)) * CHART_WIDTH;
      const y = PADDING_TOP + usableHeight - ((p.price - minP) / range) * usableHeight;
      return { x, y };
    });

    // Smooth cubic bezier path
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const area = `${d} L ${pts[pts.length - 1].x} ${CHART_HEIGHT} L ${pts[0].x} ${CHART_HEIGHT} Z`;
    return { linePath: d, areaPath: area, coords: pts };
  }, [data]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
        onPanResponderRelease: () => {
          setActiveIndex(null);
          onSelectPoint?.(null);
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
          onSelectPoint?.(null);
        },
      }),
    [data],
  );

  const handleTouch = (x: number) => {
    if (!data || data.length < 2) return;
    const clampedX = Math.max(0, Math.min(x, CHART_WIDTH));
    const idx = Math.round((clampedX / CHART_WIDTH) * (data.length - 1));
    setActiveIndex(idx);
    onSelectPoint?.(data[idx] ?? null);
  };

  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <Skeleton width="100%" height={CHART_HEIGHT} borderRadius={12} />
      </View>
    );
  }

  if (!data || data.length < 2) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Chart data unavailable</Text>
      </View>
    );
  }

  const activeCoord = activeIndex !== null ? coords[activeIndex] : null;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        <Path d={areaPath} fill="url(#chartGrad)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" />

        {activeCoord && (
          <>
            <Line
              x1={activeCoord.x}
              y1={0}
              x2={activeCoord.x}
              y2={CHART_HEIGHT}
              stroke={COLORS.textSecondary}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <Circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r={6}
              fill={lineColor}
              stroke={COLORS.background}
              strokeWidth={2}
            />
          </>
        )}
      </Svg>
      <Text style={styles.hint}>Touch & drag chart to inspect price</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  skeletonWrap: {
    marginVertical: 8,
  },
  emptyWrap: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  hint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
});
