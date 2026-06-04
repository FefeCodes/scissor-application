import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QRProps {
  url: string;
}

type QRErrorLevel = "L" | "M" | "Q" | "H";

export default function QRCodeDisplay({ url }: QRProps) {
  const [fgColor, setFgColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [level, setLevel] = useState<QRErrorLevel>("H");
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    if (logoSrc) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = logoSrc;
      img.onload = () => {
        const size = Math.floor(canvas.width * 0.22);
        const pos = (canvas.width - size) / 2;
        ctx?.drawImage(img, pos, pos, size, size);

        const urlData = canvas.toDataURL("image/png");
        triggerDownload(urlData);
      };
    } else {
      triggerDownload(canvas.toDataURL("image/png"));
    }
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = "scissor-qr-code.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-6 w-full max-w-md mt-6 animate-fadeIn">
      <div className="p-4 bg-white rounded-lg shadow-inner" ref={canvasRef}>
        <QRCodeCanvas
          value={url}
          size={200}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          includeMargin={true}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 w-full text-sm">
        <div>
          <label className="block text-gray-400 mb-1 text-xs">
            Foreground Color
          </label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer p-1"
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1 text-xs">
            Background Color
          </label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer p-1"
          />
        </div>
      </div>

      <div className="w-full text-sm">
        <label className="block text-gray-400 mb-1 text-xs">
          Error Correction Level
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as QRErrorLevel)}
          className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-200"
        >
          <option value="L">Level L (7% recovery)</option>
          <option value="M">Level M (15% recovery)</option>
          <option value="Q">Level Q (25% recovery)</option>
          <option value="H">Level H (30% recovery - Best for Logos)</option>
        </select>
      </div>

      <div className="w-full text-sm">
        <label className="block text-gray-400 mb-1 text-xs">Upload Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="w-auto text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-800/30 cursor-pointer"
        />
      </div>

      <button
        onClick={downloadQR}
        className="w-full mt-2 bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md flex justify-center items-center gap-2 cursor-pointer"
      >
        Download QR Code
      </button>
    </div>
  );
}
