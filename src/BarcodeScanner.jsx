import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, NotFoundException } from "@zxing/library";
import { BrowserCodeReader } from "@zxing/browser";

const BarcodeScanner = ({onScan, onError}) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserCodeReader(new BrowserMultiFormatReader());

    const startScanner = async () => {
      try {
        setScanning(true);
        const hints = new Map();
        hints.set(
          BarcodeFormat.EAN_13,
          true
        );
        hints.set(
          BarcodeFormat.EAN_8,
          true
        );

        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        console.log('Requesting camera devices...');
        let videoInputDevices;
        try {
          videoInputDevices = await BrowserCodeReader.listVideoInputDevices();
          console.log('Available video devices:', videoInputDevices);
        } catch (listError) {
          console.error('Error listing video devices:', listError);
          throw new Error(`Failed to access camera devices: ${listError.message}`);
        }

        if (!videoInputDevices || videoInputDevices.length === 0) {
          const errorMsg = 'No camera devices found. Please ensure your camera is connected and not in use by another application.';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        const firstDeviceId = videoInputDevices[0]?.deviceId;
        console.log('Using camera device:', videoInputDevices[0]?.label || 'Default Camera');

        if (!firstDeviceId) {
          const errorMsg = 'Camera device ID not available. Please check your camera permissions.';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        try {
          await codeReaderRef.current.decodeFromVideoDevice(
            firstDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                console.log('Barcode detected:', result.getText());
                onScan(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                console.error('Barcode scan error:', err);
                onError?.(err);
              }
            }
          );
        } catch (decodeError) {
          console.error('Error starting video stream:', decodeError);
          throw new Error(`Failed to start camera: ${decodeError.message}`);
        }
      } catch (err) {
        console.error('Scanner initialization error:', err);
        onError?.(err);
        setScanning(false);
        throw err; // Re-throw to be caught by the outer catch
      }
    };

    startScanner().catch(error => {
      console.error('Error in startScanner:', error);
      setErr(error.message || 'Failed to access camera');
      setScanning(false);
    });

    return () => {
      setScanning(false);
      codeReaderRef.current?.reset();
    };
  }, [onScan, onError]);

  return (
    <div className="w-full flex flex-col items-center">
      {err && <p style={{color: 'red'}} className="text-red-600 font-semibold">{err}</p>}
      <video ref={videoRef} className="w-full max-w-md rounded-xl shadow-lg"/>
      {scanning ? (
        <p className="mt-4 text-green-600 font-semibold">Scanning...</p>
      ) : (
        <p className="mt-4 text-red-600 font-semibold">Scanner stopped</p>
      )}
    </div>
  );
};

export default BarcodeScanner;