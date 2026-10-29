import React from 'react';

/**
 * Zenith Bank logo — grey Z with red diagonal slash, "ZENITH" text below.
 * Props:
 *   size     — controls overall width (height auto-scales). Default: 48
 *   showText — show "ZENITH" wordmark below the Z. Default: true
 *   textColor — colour of the ZENITH text. Default: '#4a4a4a'
 */
export default function ZenithLogo({ size = 48, showText = true, textColor = '#4a4a4a' }) {
  const w = size;
  const h = showText ? size * 1.35 : size;

  return (
    <svg
      width={w}
      height={h}
      viewBox={showText ? '0 0 100 135' : '0 0 100 100'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zenith Bank"
      role="img"
    >
      {/* ── Grey Z body ── */}
      <polygon
        points="8,8 92,8 92,27 36,73 92,73 92,92 8,92 8,73 64,27 8,27"
        fill="#7a7a7a"
      />

      {/* ── Red diagonal slash ── */}
      <polygon
        points="54,8 92,8 92,27 46,73 8,73 8,54"
        fill="#c0392b"
      />

      {/* ── ZENITH wordmark ── */}
      {showText && (
        <text
          x="50"
          y="122"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="18"
          letterSpacing="4"
          fill={textColor}
        >
          ZENITH
        </text>
      )}
    </svg>
  );
}
