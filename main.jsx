import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("yess-list");
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  function makeSmartList(sentence) {
    return sentence
      .toLowerCase()
      .replaceAll(" ve ", ",")
      .replaceAll(" ayrıca ", ",")
      .replaceAll(" sonra ", ",")
      .replaceAll(" bir kilo ", " 1 kg ")
      .replaceAll(" iki kilo ", " 2 kg ")
      .replaceAll(" üç kilo ", " 3 kg ")
      .replaceAll(" bir paket ", " 1 paket ")
      .replaceAll(" iki paket ", " 2 paket ")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function addItem(name) {
    if (!name.trim()) return;

    setItems((prev) => [
      {
        id: Date.now() + Math.random(),
        name: name.trim(),
        done: false,
      },
      ...prev,
    ]);
  }

  function addManual() {
    addItem(text);
    setText("");
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Bu tarayıcı mikrofonla yazıya çevirme desteklemiyor. iPhone Safari’de çalışmayabilir. Chrome ile dene."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }

      setSpokenText(transcript.trim());
    };

    recognition.onerror = () => {
      setListening(false);
      alert("Mikrofon çalışmadı. Tarayıcıdan mikrofon iznini kontrol et.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);
  }

  function convertVoiceToList() {
    if (!spokenText.trim()) return;

    const products = makeSmartList(spokenText);
    products.forEach((product) => addItem(product));
    setSpokenText("");
  }

  function toggleItem(id) {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }

  function deleteItem(id) {
    setItems(items.filter((item) => item.id !== id));
  }

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
        onClick={listening ? stopListening : startListening}
        style={{
          width: "100%",
          padding: 18,
          borderRadius: 14,
          border: "none",
          background: listening ? "#b91c1c" : "black",
          color: "white",
          fontSize: 18,
          marginBottom: 10,
        }}
      >
        {listening ? "⏹️ Durdur" : "🎤 Mikrofonu başlat"}
      </button>

      <div
        style={{
          background: "white",
          padding: 14,
          borderRadius: 12,
          marginBottom: 10,
          minHeight: 60,
        }}
      >
        <strong>Algılanan konuşma:</strong>
        <p>{spokenText || "Henüz konuşma algılanmadı."}</p>
      </div>

      <button
        onClick={convertVoiceToList}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 12,
          border: "none",
          background: "#166534",
          color: "white",
          fontSize: 16,
          marginBottom: 15,
        }}
      >
        🧠 Konuşmayı listeye çevir
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ürün yaz..."
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
        <button
          onClick={addManual}
          style={{
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: "black",
            color: "white",
          }}
        >
          Ekle
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#666" }}>
        Örnek: “domates, süt, iki kilo patates, Jumbo’dan brood”
      </p>

      <div style={{ marginTop: 20 }}>
        {items.length === 0 ? (
          <p>Liste boş.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "white",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
              />

              <span
                style={{
                  flex: 1,
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.name}
              </span>

              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  border: "none",
                  background: "#eee",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
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
