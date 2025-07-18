import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, NotFoundException } from "@zxing/library";
import { BrowserCodeReader } from "@zxing/browser";

const BarcodeScanner = ({onScan, onError}) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        setScanning(true);
        
        const hints = new Map();
        hints.set(BarcodeFormat.EAN_13, true);
        hints.set(BarcodeFormat.EAN_8, true);

        codeReaderRef.current = new BrowserCodeReader(
          new BrowserMultiFormatReader(hints)
        );

        console.log('Initialized code reader, requesting camera access...');

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment', // Prefer rear camera on mobile
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          stream.getTracks().forEach(track => track.stop());
          
          console.log('Camera access granted, listing devices...');
          
          const videoInputDevices = await BrowserCodeReader.listVideoInputDevices();
          console.log('Available video devices:', videoInputDevices);

          if (!videoInputDevices || videoInputDevices.length === 0) {
            throw new Error('No camera devices found.');
          }

          const firstDeviceId = videoInputDevices[0]?.deviceId;
          console.log('Using camera device:', videoInputDevices[0]?.label || 'Default Camera');

          if (!firstDeviceId) {
            throw new Error('Camera device ID not available.');
          }

          await codeReaderRef.current.decodeFromVideoDevice(
            firstDeviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                console.log('Barcode detected:', result.getText());
                onScan(result.getText());
              }
              if (error && !(error instanceof NotFoundException)) {
                console.error('Barcode scan error:', error);
                onError?.(error);
              }
            }
          );
          
        } catch (error) {
          console.error('Camera access error:', error);
          if (error.name === 'NotAllowedError') {
            throw new Error('Camera permission was denied. Please allow camera access to use the barcode scanner.');
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            throw new Error('No camera found. Please ensure your camera is connected and not in use by another application.');
          } else {
            throw new Error(`Failed to access camera: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('Scanner initialization error:', error);
        setErr(error.message);
        onError?.(error);
      } finally {
        setScanning(false);
      }
    };

    initScanner();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      setScanning(false);
    };
  }, [onScan, onError]);

  return (
    <div className="w-full flex flex-col items-center">
      {err && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{err}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
      <video 
        ref={videoRef} 
        className="w-full max-w-md rounded-xl shadow-lg"
        playsInline
      />
      {scanning ? (
        <p className="mt-4 text-green-600 font-semibold">
          Waiting for camera permission...
        </p>
      ) : null}
    </div>
  );
};

export default BarcodeScanner;