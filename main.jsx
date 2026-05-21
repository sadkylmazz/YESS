import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div
      style={{
        fontFamily: "Arial",
        padding: 20,
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1>YESS</h1>

      <p>Yalın • Ece • Sadık</p>

      <button
        style={{
          padding: 15,
          borderRadius: 12,
          border: "none",
          background: "black",
          color: "white",
          fontSize: 18,
        }}
      >
        🎤 Sesli ürün ekle
      </button>

      <div
        style={{
          marginTop: 20,
          background: "white",
          padding: 15,
          borderRadius: 12,
        }}
      >
        <h3>Örnek liste</h3>

        <p>🥛 süt</p>
        <p>🍞 brood</p>
        <p>🍅 domates</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
