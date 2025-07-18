import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

const BarcodeScanner = () => {
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [resultText, setResultText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Function to start the camera
  const startScanning = async (deviceId) => {
    if (!deviceId) return;

    try {
      setIsScanning(true);
      setError(null);
      
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          facingMode: "environment",
          width: {
            ideal: 400,
            max: 600
          },
          height: {
            ideal: 300,
            max: 400
          }
        }
      };

      // Start decoding
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("Scan result:", result);
            setResultText(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scan error:", err);
            setError(`Error: ${err.message}`);
          }
        }
      );

      console.log(`Started continuous decode from camera with id ${deviceId}`);
    } catch (error) {
      console.error('Error starting camera:', error);
      setError(`Error: ${error.message}`);
      setIsScanning(false);
    }
  };

  // Function to stop the camera
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      setIsScanning(false);
    }
  };

  // Function to check for environment-facing (back) camera
  const findBackCamera = async (devices) => {
    // First, try to find a device with 'environment' facing mode
    for (const device of devices) {
      if (device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment") ||
          device.label.toLowerCase().includes("rear")) {
        return device.deviceId;
      }
    }
    
    // If no obvious back camera found, try to get environment-facing camera using constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      // Get the active track to find the device ID
      const tracks = stream.getVideoTracks();
      const deviceId = tracks[0]?.getSettings().deviceId;
      // Stop the stream since we just needed the device ID
      tracks.forEach(track => track.stop());
      return deviceId;
    } catch (error) {
      console.log("Could not access environment-facing camera:", error);
      return null;
    }
  };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const setupCameras = async () => {
      try {
        // First, get all video input devices
        const devices = await codeReader.listVideoInputDevices();
        setVideoInputDevices(devices);

        if (devices.length === 0) {
          throw new Error("No video input devices found");
        }

        // Try to find a back camera
        const backCameraId = await findBackCamera(devices);
        const deviceIdToUse = backCameraId || devices[0].deviceId;
        
        console.log(backCameraId ? "Found back camera" : "Using default camera");
        setSelectedDeviceId(deviceIdToUse);
        
        // Automatically start scanning with the selected camera
        await startScanning(deviceIdToUse);
        
      } catch (error) {
        console.error("Error setting up cameras:", error);
        setError(`Camera error: ${error.message}`);
      }
    };

    setupCameras();

    // Cleanup function
    return () => {
      stopScanning();
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Handle camera device change
  const handleDeviceChange = (event) => {
    const newDeviceId = event.target.value;
    setSelectedDeviceId(newDeviceId);
    stopScanning();
    startScanning(newDeviceId);
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {videoInputDevices.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select Camera:</label>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            disabled={!isScanning}
            style={{ padding: '5px' }}
          >
            {videoInputDevices.map((device, index) => (
              <option key={index} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            display: isScanning ? 'block' : 'none',
            border: '1px solid #ccc'
          }}
        />
        {!isScanning && !error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            border: '1px dashed #ccc',
            color: '#666'
          }}>
            Initializing camera...
          </div>
        )}
      </div>

      {resultText && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          wordBreak: 'break-all'
        }}>
          <strong>Scanned:</strong> {resultText}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;