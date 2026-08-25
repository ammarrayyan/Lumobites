'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import QRCode from 'qrcode';
import { QrCode, X, Download } from 'lucide-react';

export default function FloatingQRCode() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // The full URL based on the current page
  const fullUrl = typeof window !== 'undefined' ? `https://lumobites.net${pathname === '/' ? '' : pathname}` : '';

  useEffect(() => {
    if (isOpen && canvasRef.current && fullUrl) {
      const generateQR = async () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          // Generate QR code onto canvas
          await QRCode.toCanvas(canvas, fullUrl, {
            errorCorrectionLevel: 'H',
            width: 256,
            margin: 2,
            color: {
              dark: '#191919',
              light: '#ffffff'
            }
          });

          // Draw logo in center
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const logo = new Image();
            logo.src = '/Logo.png';
            logo.onload = () => {
              const logoSize = 64; // Size of logo in center
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;
              
              // Draw a white background for the logo to stand out
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
              
              // Draw the logo
              ctx.drawImage(logo, x, y, logoSize, logoSize);
            };
          }
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      };
      
      generateQR();
    }
  }, [isOpen, fullUrl]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `LumoBites-QR${pathname.replace(/\//g, '-') || '-home'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      {/* Floating Button (Desktop / Tablet only) */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed md:bottom-8 md:right-8 z-[90] bg-[#3B2410] hover:bg-[#5a391c] text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105 items-center justify-center floating-qr-btn"
        aria-label="Show QR Code"
      >
        <QrCode size={26} />
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl animate-fade-in">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <h3 className="text-xl font-bold text-[#191919] mb-6">Scan to share this page</h3>
              
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-center w-full">
                <canvas ref={canvasRef} className="max-w-full h-auto rounded-xl" />
              </div>
              
              <p className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-3 rounded-xl mb-6 truncate w-full border border-gray-100">
                {fullUrl}
              </p>
              
              <button
                onClick={handleDownload}
                className="w-full bg-[#f0c14b] text-[#111] border border-[#a88734] py-3 rounded-xl font-bold text-sm hover:bg-[#ddb347] transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
