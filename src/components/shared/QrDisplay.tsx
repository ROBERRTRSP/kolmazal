"use client";

import QRCode from "react-qr-code";

export function QrDisplay({
  value,
  label,
  size = 200,
}: {
  value: string;
  label?: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-gray-100">
      {label && <p className="text-sm font-medium text-gray-600">{label}</p>}
      <QRCode value={value} size={size} />
    </div>
  );
}
