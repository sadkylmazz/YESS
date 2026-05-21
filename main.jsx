import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const dictionary = [
  { tr: "elma", nl: "appel", emoji: "🍎", category: "Sebze/Meyve" },
  { tr: "muz", nl: "banaan", emoji: "🍌", category: "Sebze/Meyve" },
  { tr: "domates", nl: "tomaat", emoji: "🍅", category: "Sebze/Meyve" },
  { tr: "patates", nl: "aardappel", emoji: "🥔", category: "Sebze/Meyve" },
  { tr: "salatalık", nl: "komkommer", emoji: "🥒", category: "Sebze/Meyve" },

  { tr: "süt", nl: "melk", emoji: "🥛", category: "Kahvaltı" },
  { tr: "yoğurt", nl: "yoghurt", emoji: "🥛", category: "Kahvaltı" },
  { tr: "yumurta", nl: "eieren", emoji: "🥚", category: "Kahvaltı" },
  { tr: "peynir", nl: "kaas", emoji: "🧀", category: "Kahvaltı" },
  { tr: "ekmek", nl: "brood", emoji: "🍞", category: "Kahvaltı" },

  { tr: "tavuk", nl: "kip", emoji: "🍗", category: "Et" },
  { tr: "kıyma", nl: "gehakt", emoji: "🥩", category: "Et" },
  { tr: "et", nl: "vlees", emoji: "🥩", category: "Et" },

  { tr: "deterjan", nl: "wasmiddel", emoji: "🧼", category: "Temizlik" },
  { tr: "tuvalet kağıdı", nl: "wc papier", emoji: "🧻", category: "Temizlik" },
  { tr: "ıslak mendil", nl: "natte doekjes", emoji: "🧴", category: "Temizlik" },
];

function App() {
  const [items, setItems] = useState(() =>
    JSON.parse(localStorage.getItem("yess-list") || "[]")
  );

  const [text, setText] = useState("");
  const [spoken, setSpoken] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  const suggestions = useMemo(() => {
    if (!text.trim()) return [];

    return dictionary.filter((item) =>
      item.tr.toLowerCase().includes(text.toLowerCase()) ||
      item.nl.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5);
  }, [text]);

  function addProduct(product) {
    setItems((prev) => [
      {
        id: Date.now() + Math.random(),
        ...product,
        done: false,
      },
      ...prev,
    ]);

    setText("");
  }

  function addManual() {
    if (!text.trim()) return;

    const found = dictionary.find(
      (d) =>
        d.tr.toLowerCase() === text.toLowerCase() ||
        d.nl.toLowerCase() === text.toLowerCase()
    );

    if (found) {
      addProduct(found);
    } else {
      addProduct({
        tr: text,
        nl: "",
        emoji: "🛒",
        category: "Genel",
      });
    }
  }

  function toggle(id) {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i
      )
    );
  }

  function remove(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  function startMic() {
    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SR) {
      alert("Bu cihaz mikrofon desteklemiyor.");
      return;
    }

    const rec = new SR();

    rec.lang = "tr-TR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      let all = "";

      for (let i = 0; i < e.results.length; i++) {
        all += e.results[i][0].transcript + " ";
      }

      setSpoken(all.trim());
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopMic() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function convertVoice() {
    if (!spoken.trim()) return;

    const lower = spoken.toLowerCase();

    dictionary.forEach((p) => {
      if (
        lower.includes(p.tr.toLowerCase()) ||
        lower.includes(p.nl.toLowerCase())
      ) {
        addProduct(p);
      }
    });

    setSpoken("");
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>YESS</h1>
          <p style={styles.subtitle}>Yalın • Ece • Sadık</p>
        </div>

        <div style={styles.logo}>🛒</div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <b>{items.length}</b>
          <span>Toplam</span>
        </div>

        <div style={styles.statCard}>
          <b>{items.length - doneCount}</b>
          <span>Alınacak</span>
        </div>

        <div style={styles.statCard}>
          <b>{doneCount}</b>
          <span>Alındı</span>
        </div>
      </div>

      <button
        onClick={listening ? stopMic : startMic}
        style={{
          ...styles.micButton,
          background: listening ? "#dc2626" : "#111827",
        }}
      >
        {listening ? "⏹️ Durdur" : "🎤 Mikrofon"}
      </button>

      <div style={styles.voiceCard}>
        <b>Konuşman</b>

        <p style={{ color: "#475569" }}>
          {spoken || "Henüz konuşma algılanmadı."}
        </p>

        <button style={styles.aiButton} onClick={convertVoice}>
          🧠 Yapay zekayla listeye ekle
        </button>
      </div>

      <div style={styles.inputBox}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ürün yaz..."
          style={styles.input}
        />

        <button style={styles.addButton} onClick={addManual}>
          Ekle
        </button>
      </div>

      {suggestions.length > 0 && (
        <div style={styles.suggestions}>
          {suggestions.map((s) => (
            <button
              key={s.tr}
              onClick={() => addProduct(s)}
              style={styles.suggestion}
            >
              <span>{s.emoji}</span>
              <div>
                <div>{s.tr}</div>
                <small>{s.nl}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <button
              onClick={() => toggle(item.id)}
              style={{
                ...styles.check,
                background: item.done ? "#16a34a" : "white",
              }}
            >
              {item.done ? "✓" : ""}
            </button>

            <div style={styles.emoji}>
              {item.emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  textDecoration: item.done
                    ? "line-through"
                    : "none",
                }}
              >
                {item.tr}
              </div>

              <div style={{ color: "#64748b" }}>
                {item.nl}
              </div>

              <small>{item.category}</small>
            </div>

            <button
              onClick={() => remove(item.id)}
              style={styles.delete}
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    fontFamily: "Arial",
    background:
      "linear-gradient(180deg,#dbeafe 0%,#eff6ff 40%,#f8fafc 100%)",
  },

  header: {
    background: "#111827",
    borderRadius: 28,
    padding: 22,
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: 36,
  },

  subtitle: {
    marginTop: 4,
    color: "#cbd5e1",
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 20,
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    background: "white",
    borderRadius: 20,
    padding: 14,
    textAlign: "center",
  },

  micButton: {
    width: "100%",
    padding: 18,
    borderRadius: 24,
    border: 0,
    color: "white",
    fontSize: 20,
    fontWeight: 700,
    marginTop: 16,
  },

  voiceCard: {
    background: "white",
    borderRadius: 24,
    padding: 16,
    marginTop: 14,
  },

  aiButton: {
    width: "100%",
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    border: 0,
    background: "#15803d",
    color: "white",
    fontWeight: 700,
    fontSize: 16,
  },

  inputBox: {
    display: "flex",
    gap: 8,
    marginTop: 14,
  },

  input: {
    flex: 1,
    padding: 15,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    fontSize: 16,
  },

  addButton: {
    padding: "0 18px",
    borderRadius: 18,
    border: 0,
    background: "#111827",
    color: "white",
    fontWeight: 700,
  },

  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
  },

  suggestion: {
    background: "white",
    border: 0,
    borderRadius: 18,
    padding: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
    textAlign: "left",
  },

  card: {
    background: "white",
    borderRadius: 24,
    padding: 14,
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    border: "2px solid #16a34a",
    color: "white",
    fontWeight: 900,
  },

  emoji: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },

  delete: {
    border: 0,
    borderRadius: 14,
    padding: "10px 12px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 700,
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
