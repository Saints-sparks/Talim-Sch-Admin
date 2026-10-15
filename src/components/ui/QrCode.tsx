"use client";

import React, { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * The dark modules of a QR code for `text`, as one SVG path (a 1×1 square per
 * module), and the code's size in modules. Error correction `M` (15%), the
 * smallest version that fits.
 *
 * @param text - What the code encodes (a URL).
 * @returns The path and the module count.
 */
export function qrPath(text: string): { d: string; size: number } {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let d = "";
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { d, size };
}

/** Props for {@link QrCode}. */
export interface QrCodeProps {
  /** What the code encodes. */
  value: string;
  /** Rendered width and height in pixels. */
  size?: number;
  /** The image's accessible name. */
  label: string;
}

/**
 * A QR code drawn as an SVG (`qrcode-generator`), black on white with the
 * standard four-module quiet zone, so it scans on screen and in print.
 *
 * @param props - See {@link QrCodeProps}.
 * @param props.value - The encoded text.
 * @param props.size - Pixel size.
 * @param props.label - Accessible name.
 * @returns The image.
 */
export function QrCode({ value, size = 120, label }: QrCodeProps) {
  const { d, size: modules } = useMemo(() => qrPath(value), [value]);
  const quiet = 4;
  const box = modules + quiet * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      shapeRendering="crispEdges"
      className="shrink-0 rounded-md bg-white"
    >
      <rect x={-quiet} y={-quiet} width={box} height={box} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

export default QrCode;
