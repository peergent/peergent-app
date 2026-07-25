export function sparkLinePath(values: number[], width: number, height: number, pad = 3): string {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = pad + index * stepX;
      const y = pad + (height - pad * 2) * (1 - (value - min) / range);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function sparkAreaPath(values: number[], width: number, height: number, pad = 4): string {
  const line = sparkLinePath(values, width, height, pad);
  if (!line) return "";
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const lastX = pad + (values.length - 1) * stepX;
  return `${line} L ${lastX.toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
}

export function gaugeStrokeOffset(percent: number, radius = 16): number {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  return circumference * (1 - clamped / 100);
}
