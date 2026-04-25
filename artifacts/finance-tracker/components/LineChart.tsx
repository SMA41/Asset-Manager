import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { useColors } from "@/hooks/useColors";

export type LinePoint = { label: string; value: number };

export function LineChart({
  data,
  height = 180,
  formatValue,
  positiveColor,
  negativeColor,
}: {
  data: LinePoint[];
  height?: number;
  formatValue?: (n: number) => string;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const c = useColors();
  const pos = positiveColor ?? c.primary;
  const neg = negativeColor ?? c.danger;

  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const width = 320;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);

  const total = data.reduce((a, b) => a + b.value, 0);
  const lineColor = total >= 0 ? pos : neg;

  const xAt = (i: number) =>
    padding.left + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
  const yAt = (v: number) => padding.top + innerH - ((v - min) / range) * innerH;
  const yZero = yAt(0);

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), v: d.value }));
  const pathD =
    points.length === 0
      ? ""
      : points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
  const areaD =
    points.length === 0
      ? ""
      : `${pathD} L ${points[points.length - 1].x} ${yZero} L ${points[0].x} ${yZero} Z`;

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Line
          x1={padding.left}
          x2={width - padding.right}
          y1={yZero}
          y2={yZero}
          stroke={c.border}
          strokeDasharray="3,3"
          strokeWidth={1}
        />

        {areaD ? <Path d={areaD} fill="url(#lineFill)" /> : null}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {points.map((p, i) => (
          <Circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={c.background}
            stroke={lineColor}
            strokeWidth={1.5}
          />
        ))}

        {data.map((d, i) => (
          <SvgText
            key={`l-${i}`}
            x={xAt(i)}
            y={height - 8}
            fontSize={10}
            fill={c.mutedForeground}
            textAnchor="middle"
            fontFamily="Inter_500Medium"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
      {formatValue && data.length > 0 && (
        <Text style={[styles.peak, { color: c.mutedForeground }]}>
          {total >= 0 ? "high" : "low"} {formatValue(total >= 0 ? max : min)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  peak: {
    position: "absolute",
    top: 0,
    right: 4,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});
