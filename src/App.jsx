import { useState } from "react";
import "./App.css";
import BarcodeScanner from "./BarcodeScanner.jsx";

function App() {
  const [scanResult, setScanResult] = useState("");

  const handleScan = (barcode) => {
    console.log("Scanned barcode:", barcode);
    setScanResult(barcode);
  };

  const handleError = (error) => {
    console.error("Barcode scanner error:", error);
  };

  return (
    <div className="app">
      <h1>Barcode Scanner Demo</h1>
      <BarcodeScanner
        onScan={handleScan}
        onError={handleError}
      />
      {scanResult && (
        <div className="result">
          <h3>Last Scanned:</h3>
          <p>{scanResult}</p>
        </div>
      )}
    </div>
  );
}

export default App;
