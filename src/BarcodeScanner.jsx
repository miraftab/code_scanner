import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScanner = ({ onScan, onError, videoConstraints = { width: 640, height: 480 } }) => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const codeReader = useRef(null);
  const controls = useRef(null);

  // Initialize code reader and list available devices
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    
    const listVideoInputDevices = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          setDevices(videoInputDevices);
          setSelectedDeviceId(videoInputDevices[0].deviceId);
        } else {
          setError("No video input devices found.");
        }
      } catch (err) {
        console.error("Error listing video devices:", err);
        setError(`Failed to access camera: ${err.message}`);
      }
    };

    // Properly handle the async operation
    (async () => {
      await listVideoInputDevices();
    })();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    console.log('startScanning');
    try {
      if (!selectedDeviceId || !videoRef.current) {
        throw new Error("No video device selected or video element not available");
      }

      // Clear any previous errors
      setError("");
      
      // Request camera permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId,
          ...videoConstraints
        }
      });
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      setIsScanning(true);
      
      codeReader.current
        .decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            const resultText = result.getText();
            if (onScan) {
              onScan(resultText);
            }
          }

          if (err) {
            // Skip NotFoundException (code 8) which is thrown when no barcode is found
            if (err.name === 'NotFoundException' || err.code === 8) {
              return; // This is a normal case when no barcode is found
            }
            
            console.error("Scan error:", err);
            setError(`Scan error: ${err.message || 'Unknown error occurred'}`);
            if (onError) {
              onError(err);
            }
          }
        })
        .then(ctrl => {
          controls.current = ctrl;
        })
        .catch(err => {
          console.error("Failed to start scanning:", err);
          setError(`Failed to start scanning: ${err.message}`);
          setIsScanning(false);
          if (onError) {
            onError(err);
          }
        });
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(`Camera access error: ${err.message || 'Please check camera permissions'}`);
      setIsScanning(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const stopScanning = () => {
    if (controls.current) {
      controls.current.stop();
      controls.current = null;
    }
    // Release the video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleDeviceChange = (event) => {
    const deviceId = event.target.value;
    setSelectedDeviceId(deviceId);
    
    // Restart scanning with the new device
    if (isScanning) {
      stopScanning();
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Barcode Scanner</h2>
      
      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          borderLeft: '4px solid #f44336',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Error:</span>
          <span>{error}</span>
          {error.includes('permission') && (
            <span style={{ marginLeft: 'auto', fontSize: '0.9em' }}>
              Please check your browser's camera permissions and try again.
            </span>
          )}
        </div>
      )}

      {/* Camera Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '300px',
        marginBottom: '20px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5'
      }}>
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            border: '2px solid #ddd',
            borderRadius: '8px',
            display: isScanning ? 'block' : 'none'
          }}
          playsInline
        />
        {!isScanning && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            color: '#666',
            textAlign: 'center',
            padding: '20px'
          }}>
            Camera feed will appear here when scanning starts
          </div>
        )}
      </div>

      <div style={{ margin: '20px 0' }}>
        {devices.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="camera-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Select Camera:
            </label>
            <select
              id="camera-select"
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              disabled={isScanning}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: isScanning ? '#f5f5f5' : 'white',
                cursor: isScanning ? 'not-allowed' : 'pointer'
              }}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 10)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={!selectedDeviceId}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                ':hover': {
                  backgroundColor: '#45a049'
                },
                ':disabled': {
                  backgroundColor: '#cccccc',
                  cursor: 'not-allowed'
                }
              }}
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              style={{
                flex: 1,
                padding: '12px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                ':hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default BarcodeScanner;