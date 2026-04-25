import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

export type BarDatum = { label: string; value: number };

export function BarChart({
  data,
  height = 180,
  formatValue,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const c = useColors();
  const chartHeight = height;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerH = chartHeight - padding.top - padding.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));

  const barCount = data.length;
  const gap = 10;

  return (
    <View style={{ height: chartHeight }}>
      <Svg width="100%" height={chartHeight}>
        <Line
          x1={0}
          x2="100%"
          y1={chartHeight - padding.bottom}
          y2={chartHeight - padding.bottom}
          stroke={c.border}
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const ratio = d.value / max;
          const barH = Math.max(2, ratio * innerH);
          const widthPct = 100 / barCount;
          const xPct = i * widthPct;
          return (
            <React.Fragment key={`${d.label}-${i}`}>
              <Rect
                x={`${xPct + (gap / 4) / barCount}%`}
                width={`${widthPct - (gap * 2) / barCount}%`}
                y={chartHeight - padding.bottom - barH}
                height={barH}
                fill={c.primary}
                rx={6}
              />
              <SvgText
                x={`${xPct + widthPct / 2}%`}
                y={chartHeight - padding.bottom + 16}
                fontSize={10}
                fill={c.mutedForeground}
                textAnchor="middle"
                fontFamily="Inter_500Medium"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      {formatValue && data.length > 0 && (
        <Text style={[styles.peak, { color: c.mutedForeground }]}>
          peak {formatValue(max)}
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
