import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const knownProducts = [
  "süt", "sut", "melk", "ekmek", "brood", "yumurta", "eieren", "peynir", "kaas",
  "domates", "tomaat", "patates", "aardappel", "limon", "tuz", "şeker", "suiker",
  "un", "bloem", "pirinç", "rijst", "makarna", "pasta", "tavuk", "kip",
  "kıyma", "gehakt", "et", "vlees", "salatalık", "komkommer", "muz", "banaan",
  "elma", "appel", "yoğurt", "yoghurt", "deterjan", "wasmiddel", "peçete",
  "wc papier", "tuvalet kağıdı", "zeytin", "sucuk", "ayran", "bulgur", "nohut"
];

const markets = ["jumbo", "albert heijn", "ah", "plus", "nettorama", "türk market", "turk market"];

function normalizeWord(word) {
  const map = {
    sut: "süt",
    melk: "süt",
    brood: "ekmek",
    tomaat: "domates",
    aardappel: "patates",
    banaan: "muz",
    appel: "elma",
    yoghurt: "yoğurt",
    kaas: "peynir",
    kip: "tavuk",
    gehakt: "kıyma",
    wasmiddel: "deterjan",
    suiker: "şeker",
    bloem: "un",
    rijst: "pirinç",
    pasta: "makarna"
  };

  return map[word.toLowerCase()] || word;
}

function detectMarket(text) {
  const lower = text.toLowerCase();

  if (lower.includes("jumbo")) return "Jumbo";
  if (lower.includes("albert heijn") || lower.includes(" ah ")) return "Albert Heijn";
  if (lower.includes("plus")) return "PLUS";
  if (lower.includes("nettorama")) return "Nettorama";
  if (lower.includes("türk market") || lower.includes("turk market")) return "Türk marketi";

  return "Fark etmez";
}

function smartParse(text) {
  let cleaned = text.toLowerCase();

  markets.forEach((m) => {
    cleaned = cleaned.replaceAll(m, "");
  });

  cleaned = cleaned
    .replaceAll("jumbo'dan", "")
    .replaceAll("jumbodan", "")
    .replaceAll("ah'den", "")
    .replaceAll("albert heijn'den", "")
    .replaceAll("türk marketten", "")
    .replaceAll("turk marketten", "")
    .replaceAll(" ve ", " , ")
    .replaceAll(" ayrıca ", " , ")
    .replaceAll(" sonra ", " , ")
    .replaceAll(" falan filan", "")
    .replaceAll(" falan", "")
    .replaceAll(".", ",")
    .replaceAll(";", ",");

  const words = cleaned.split(/\s+/).filter(Boolean);
  const found = [];

  for (let i = 0; i < words.length; i++) {
    let word = words[i].replace(/[,.]/g, "");
    let twoWords = `${word} ${words[i + 1] || ""}`.trim();

    if (knownProducts.includes(twoWords)) {
      found.push(normalizeWord(twoWords));
      i++;
    } else if (knownProducts.includes(word)) {
      found.push(normalizeWord(word));
    }
  }

  if (found.length > 0) {
    return [...new Set(found)];
  }

  return cleaned
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

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

  function addItem(name, market = "Fark etmez") {
    if (!name.trim()) return;

    setItems((prev) => [
      {
        id: Date.now() + Math.random(),
        name: name.trim(),
        market,
        done: false
      },
      ...prev
    ]);
  }

  function addManual() {
    const market = detectMarket(text);
    const products = smartParse(text);
    products.forEach((p) => addItem(p, market));
    setText("");
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Bu tarayıcı mikrofon algılamayı desteklemiyor. Chrome ile dene.");
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
      alert("Mikrofon çalışmadı. Mikrofon iznini kontrol et.");
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function convertVoiceToList() {
    const market = detectMarket(spokenText);
    const products = smartParse(spokenText);

    products.forEach((p) => addItem(p, market));
    setSpokenText("");
  }

  function toggleItem(id) {
    setItems(items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  }

  function deleteItem(id) {
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1>YESS</h1>
      <p>Yalın • Ece • Sadık</p>

      <button onClick={listening ? stopListening : startListening}
        style={{ width: "100%", padding: 18, borderRadius: 18, border: "none", background: listening ? "#b91c1c" : "black", color: "white", fontSize: 22 }}>
        {listening ? "⏹️ Durdur" : "🎤 Mikrofonu başlat"}
      </button>

      <div style={{ background: "white", padding: 16, borderRadius: 18, marginTop: 14 }}>
        <b>Algılanan konuşma:</b>
        <p>{spokenText || "Henüz konuşma algılanmadı."}</p>
      </div>

      <button onClick={convertVoiceToList}
        style={{ width: "100%", padding: 16, borderRadius: 18, border: "none", background: "#166534", color: "white", fontSize: 20, marginTop: 14 }}>
        🧠 Ürün ürün listeye çevir
      </button>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Örn: Jumbo’dan süt ekmek patates"
          style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid #ccc", fontSize: 18 }} />
        <button onClick={addManual} style={{ padding: 14, borderRadius: 14, border: "none", background: "black", color: "white" }}>
          Ekle
        </button>
      </div>

      <div style={{ marginTop: 22 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", padding: 14, borderRadius: 16, marginBottom: 10 }}>
            <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, textDecoration: item.done ? "line-through" : "none" }}>{item.name}</div>
              <small>{item.market}</small>
            </div>
            <button onClick={() => deleteItem(item.id)} style={{ border: "none", background: "#eee", borderRadius: 10, padding: 10 }}>
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
