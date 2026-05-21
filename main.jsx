import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("yess-list");
    return saved ? JSON.parse(saved) : [];
  });
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  function smartSplit(sentence) {
    return sentence
      .toLowerCase()
      .replaceAll(" ve ", ",")
      .replaceAll(" bir tane ", " 1 ")
      .replaceAll(" iki kilo ", " 2 kg ")
      .replaceAll(" bir kilo ", " 1 kg ")
      .split(/,|\.| sonra | ayrıca | artı /)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function addItem(name) {
    if (!name.trim()) return;
    setItems(prev => [{ id: Date.now() + Math.random(), name: name.trim(), done: false }, ...prev]);
    setText("");
  }

  function addManual() {
    addItem(text);
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Bu tarayıcı sesli giriş desteklemiyor. Chrome ile deneyin.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      const products = smartSplit(spoken);

      products.forEach(product => addItem(product));
    };

    recognition.start();
  }

  function toggleItem(id) {
    setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  function deleteItem(id) {
    setItems(items.filter(item => item.id !== id));
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1>YESS</h1>
      <p>Yalın • Ece • Sadık</p>

      <button
        onClick={startVoice}
        style={{
          width: "100%",
          padding: 18,
          borderRadius: 14,
          border: "none",
          background: listening ? "#b91c1c" : "black",
          color: "white",
          fontSize: 18,
          marginBottom: 12
        }}
      >
        {listening ? "🎙️ Dinliyorum..." : "🎤 Sesli ekle"}
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ürün yaz: süt, ekmek, brood..."
          style={{ flex: 1, padding: 14, borderRadius: 10, border: "1px solid #ccc", fontSize: 16 }}
        />
        <button onClick={addManual} style={{ padding: 14, borderRadius: 10, border: "none", background: "black", color: "white" }}>
          Ekle
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#666" }}>
        Örnek söyle: “domates, süt, iki kilo patates ve Jumbo’dan brood”
      </p>

      <div style={{ marginTop: 20 }}>
        {items.length === 0 ? (
          <p>Liste boş.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", padding: 12, borderRadius: 12, marginBottom: 10 }}>
              <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
              <span style={{ flex: 1, textDecoration: item.done ? "line-through" : "none" }}>
                {item.name}
              </span>
              <button onClick={() => deleteItem(item.id)} style={{ border: "none", background: "#eee", borderRadius: 8, padding: 8 }}>
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
