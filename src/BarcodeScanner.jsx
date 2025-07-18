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

    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setVideoInputDevices(devices);
        if (devices.length > 0) {
          setSelectedDeviceId(devices[0].deviceId);
        }
      })
      .catch((err) => console.error(err));

    return () => {
      codeReader.reset();
    };
  }, []);

  const startScanning = () => {
    if (!selectedDeviceId) return;

    codeReaderRef.current.decodeFromVideoDevice(
      selectedDeviceId,
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