import { useState } from "react";
import "./App.css";
import BarcodeScanner from "./BarcodeScanner.jsx";

function App() {
  const handleScan = (code) => {
    console.log("Scanned code:", code);
    alert(`Scanned: ${code}`);
  };

  const handleError = (err) => {
    console.error("Scanner error:", err);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Barcode Scanner</h1>
      <BarcodeScanner onScan={handleScan} onError={handleError} />
    </div>
  );
}

export default App;
