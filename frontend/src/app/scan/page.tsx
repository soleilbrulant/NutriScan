'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useRouter } from 'next/navigation';
import { X, Camera, RotateCcw, Flashlight } from 'lucide-react';
import { toast } from 'sonner';

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);

  const isValidProductBarcode = (barcode: string): boolean => {
    // Reject URLs and very short codes
    if (barcode.includes('://') || barcode.length < 6) {
      return false;
    }
    
    // Accept common product barcode formats
    const patterns = [
      /^[0-9]{8}$/,     // EAN-8
      /^[0-9]{12}$/,    // UPC-A
      /^[0-9]{13}$/,    // EAN-13
      /^[0-9]{14}$/,    // ITF-14
      /^[A-Z0-9]{6,}$/, // Code 39/128 alphanumeric
    ];
    
    return patterns.some(pattern => pattern.test(barcode));
  };

  const handleBarcodeDetected = async (barcode: string) => {
    // Stop scanning immediately
    scanningRef.current = false;
    setIsScanning(false);
    
    if (readerRef.current) {
      try {
        // Stop the reader by creating a new instance
        readerRef.current = null;
      } catch (e) {
        console.log('Scanner reset error:', e);
      }
    }
    
    try {
      // Fetch product data from your backend (which uses OpenFoodFacts service) - using public barcode endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barcode/${barcode}?autoFetch=true`);
      
      if (response.ok) {
        const productData = await response.json();
        // Navigate to product page with the barcode
        router.push(`/product/${barcode}`);
      } else {
        // Still navigate to product page to allow manual entry
        router.push(`/product/${barcode}`);
      }
    } catch (error: any) {
      // Navigate anyway to allow manual entry
      router.push(`/product/${barcode}`);
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

        const initializeScanner = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                startScanning();
              });
            }
          };
        }
      } catch (error: any) {
        setHasPermission(false);
      }
    };

    const startScanning = async () => {
      if (!videoRef.current || scanningRef.current) {
        return;
      }

      try {
        // Restrict barcode formats and reduce delay between scans for faster performance
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_8,
          BarcodeFormat.EAN_13,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.ITF,
        ]);

        // timeBetweenScansMillis = 100 (default is 500)
        readerRef.current = new BrowserMultiFormatReader(hints, 100);
        scanningRef.current = true;
        setIsScanning(true);

        // Start continuous scanning
        readerRef.current.decodeFromVideoElement(
          videoRef.current,
          (result, error) => {
            if (result && scanningRef.current) {
              const barcodeText = result.getText();
              setScanAttempts(prev => prev + 1);
              
              // Validate barcode format
              if (isValidProductBarcode(barcodeText)) {
                handleBarcodeDetected(barcodeText);
              }
            }

            // Count scan attempts
            if (error) {
              setScanAttempts(prev => prev + 1);
            }
          }
        );
      } catch (error: any) {
        setIsScanning(false);
      }
    };

    const cleanup = () => {
      scanningRef.current = false;
      setIsScanning(false);
      
      if (readerRef.current) {
        try {
          // Clean up the reader
          readerRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };

    if (navigator.mediaDevices) {
      initializeScanner();
    } else {
      setHasPermission(false);
    }

    return cleanup;
  }, []);

  const handleClose = () => {
    router.push('/');
  };

  const manualScan = async () => {
    if (!videoRef.current || !readerRef.current) {
      return;
    }

    try {
      const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current);
      
      if (result) {
        const barcodeText = result.getText();
        
        if (isValidProductBarcode(barcodeText)) {
          await handleBarcodeDetected(barcodeText);
        }
      }
    } catch (error: any) {
      // Ignore manual scan errors
    }
  };

  const retrySetup = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between">
        <button
          onClick={handleClose}
          className="bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
        >
          <X className="text-white" size={24} />
        </button>

        <div className="flex gap-3">
          <button
            onClick={manualScan}
            disabled={!hasPermission}
            className="bg-emerald-500/90 rounded-full p-4 hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:scale-105"
          >
            <Camera className="text-white" size={28} />
          </button>
          
          <button
            onClick={retrySetup}
            className="bg-blue-500/90 rounded-full p-4 hover:bg-blue-600 transition-all duration-200 shadow-lg hover:scale-105"
          >
            <RotateCcw className="text-white" size={24} />
          </button>
        </div>
      </div>

      {/* Error Panel - Only show when needed */}
      {hasPermission === false && (
        <div className="absolute bottom-4 left-4 z-50 bg-red-500/90 text-white p-3 rounded-lg text-sm max-w-xs">
          <p className="mb-2">Camera access denied</p>
          <button 
            onClick={retrySetup}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-white text-sm transition-colors"
          >
            Retry Camera
          </button>
        </div>
      )}

      {/* Camera Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Scanning Frame */}
      {hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-80 h-48 border-2 border-emerald-400 rounded-lg bg-transparent">
              {/* Corners */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              
              {/* Center Line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-0.5 bg-emerald-400"></div>
              
              {/* Enhanced Scanning Animation */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                {/* Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line"></div>
                
                {/* Corner Glow Animation */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg animate-pulse"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg animate-pulse"></div>
                
                {/* Center Target */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 border-2 border-emerald-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {hasPermission && (
        <div className="absolute bottom-20 left-0 right-0 px-6">
          <div className="bg-black/70 rounded-xl p-4 text-center mx-auto max-w-sm">
            <p className="text-white font-medium">
              📱 Hold barcode in frame
            </p>
            <p className="text-white/70 text-sm mt-1">
              Use camera button for manual scan
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-6 text-center max-w-sm">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-gray-600 text-sm mb-6">
              Please allow camera access to scan barcodes
            </p>
            <button
              onClick={retrySetup}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium"
            >
              Allow Camera Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 