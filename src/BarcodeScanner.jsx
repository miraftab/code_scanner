import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

const BarcodeScanner = () => {
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [resultText, setResultText] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    console.log("ZXing code reader initialized");

    // Function to check for environment-facing (back) camera
    const findBackCamera = async (devices) => {
      // First, try to find a device with 'environment' facing mode
      for (const device of devices) {
        if (device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment') ||
            device.label.toLowerCase().includes('rear')) {
          return device.deviceId;
        }
      }
      
      // If no obvious back camera found, try to get environment-facing camera using constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        // Get the active track to find the device ID
        const tracks = stream.getVideoTracks();
        const deviceId = tracks[0]?.getSettings().deviceId;
        // Stop the stream since we just needed the device ID
        tracks.forEach(track => track.stop());
        return deviceId;
      } catch (error) {
        console.log('Could not access environment-facing camera:', error);
        return null;
      }
    };

    const setupCameras = async () => {
      try {
        // First, get all video input devices
        const devices = await codeReader.listVideoInputDevices();
        setVideoInputDevices(devices);

        if (devices.length === 0) {
          console.log('No video input devices found');
          return;
        }

        // Try to find a back camera
        const backCameraId = await findBackCamera(devices);
        
        if (backCameraId) {
          console.log('Found back camera with ID:', backCameraId);
          setSelectedDeviceId(backCameraId);
        } else {
          // Fallback to the first available device
          console.log('No back camera found, using default camera');
          setSelectedDeviceId(devices[0].deviceId);
        }
      } catch (error) {
        console.error('Error setting up cameras:', error);
      }
    };

    setupCameras();

    return () => {
      codeReader.reset();
    };
  }, []);

  const startScanning = () => {
    if (!selectedDeviceId) return;

    // Add environment-facing constraint when starting the camera
    const constraints = {
      video: {
        deviceId: { exact: selectedDeviceId },
        facingMode: 'environment',  // Prefer environment-facing camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    codeReaderRef.current.decodeFromConstraints(
      constraints,
      videoRef.current,
      (result, err) => {
        if (result) {
          console.log(result);
          setResultText(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
          setResultText(err.toString());
        }
      }
    );

    console.log(`Started continuous decode from camera with id ${selectedDeviceId}`);
  };

  const resetScanner = () => {
    codeReaderRef.current.reset();
    setResultText("");
    console.log("Reset.");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Barcode Scanner</h2>

      {videoInputDevices.length > 0 && (
        <div id="sourceSelectPanel" className="mb-4">
          <label className="block mb-2">Select Camera:</label>
          <select
            id="sourceSelect"
            className="p-2 border rounded"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {videoInputDevices.map((device, index) => (
              <option key={index} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <button
          id="startButton"
          onClick={startScanning}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Start
        </button>
        <button
          id="resetButton"
          onClick={resetScanner}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>

      <video
        ref={videoRef}
        id="video"
        className="w-full max-w-md rounded-xl shadow-lg mb-4"
      />

      <p id="result" className="text-lg font-mono text-gray-800">
        {resultText}
      </p>
    </div>
  );
};

export default BarcodeScanner;