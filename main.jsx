import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const translate = {
  melk: "süt",
  brood: "ekmek",
  eieren: "yumurta",
  kaas: "peynir",
  tomaat: "domates",
  aardappel: "patates",
  banaan: "muz",
  appel: "elma",
  kip: "tavuk",
  gehakt: "kıyma",
  yoghurt: "yoğurt",
  rijst: "pirinç",
  pasta: "makarna",
  wasmiddel: "deterjan",
};

const products = [
  "süt", "ekmek", "yumurta", "peynir", "domates", "patates", "limon",
  "tuz", "şeker", "un", "pirinç", "makarna", "tavuk", "kıyma", "et",
  "salatalık", "muz", "elma", "yoğurt", "deterjan", "peçete",
  "tuvalet kağıdı", "zeytin", "sucuk", "ayran", "bulgur", "nohut",
  "çay", "kahve", "kaşar", "tereyağı", "ıslak mendil"
];

const quick = ["süt", "ekmek", "yumurta", "domates", "muz", "peynir", "tavuk", "yoğurt"];

function marketOf(text) {
  const t = text.toLowerCase();
  if (t.includes("jumbo")) return "Jumbo";
  if (t.includes("albert") || t.includes(" ah ")) return "Albert Heijn";
  if (t.includes("plus")) return "PLUS";
  if (t.includes("nettorama")) return "Nettorama";
  if (t.includes("türk") || t.includes("turk") || t.includes("sucuk") || t.includes("ayran")) return "Türk marketi";
  return "Fark etmez";
}

function marketColor(market) {
  if (market === "Jumbo") return "#facc15";
  if (market === "Albert Heijn") return "#0ea5e9";
  if (market === "PLUS") return "#dc2626";
  if (market === "Nettorama") return "#f97316";
  if (market === "Türk marketi") return "#16a34a";
  return "#64748b";
}

function categoryOf(name) {
  if (/domates|patates|limon|salatalık|muz|elma/.test(name)) return "Sebze/Meyve";
  if (/süt|yumurta|peynir|yoğurt|kaşar|tereyağı/.test(name)) return "Kahvaltı";
  if (/tavuk|kıyma|et|sucuk/.test(name)) return "Et";
  if (/deterjan|peçete|tuvalet|mendil/.test(name)) return "Temizlik";
  if (/pirinç|makarna|bulgur|nohut|un|şeker|tuz/.test(name)) return "Kuru gıda";
  return "Genel";
}

function iconOf(name) {
  if (/süt|yoğurt|peynir|yumurta|kaşar/.test(name)) return "🥛";
  if (/ekmek/.test(name)) return "🍞";
  if (/domates|salatalık|patates|limon/.test(name)) return "🥗";
  if (/muz|elma/.test(name)) return "🍌";
  if (/tavuk|et|kıyma|sucuk/.test(name)) return "🥩";
  if (/deterjan|peçete|tuvalet|mendil/.test(name)) return "🧼";
  return "🛒";
}

function parseSpeech(text) {
  let t = text.toLowerCase();

  Object.keys(translate).forEach((k) => {
    t = t.replaceAll(k, translate[k]);
  });

  t = t
    .replaceAll("jumbo'dan", "")
    .replaceAll("jumbodan", "")
    .replaceAll("albert heijn'den", "")
    .replaceAll("ah'den", "")
    .replaceAll("türk marketten", "")
    .replaceAll("turk marketten", "")
    .replaceAll(" ve ", ",")
    .replaceAll(" ayrıca ", ",")
    .replaceAll(" sonra ", ",")
    .replaceAll(" bir kilo ", " 1 kg ")
    .replaceAll(" iki kilo ", " 2 kg ")
    .replaceAll(" üç kilo ", " 3 kg ")
    .replaceAll(" bir paket ", " 1 paket ")
    .replaceAll(" iki paket ", " 2 paket ");

  const found = [];

  products.forEach((p) => {
    if (t.includes(p)) found.push(p);
  });

  if (found.length) return [...new Set(found)];

  return t.split(",").map((x) => x.trim()).filter(Boolean);
}

function App() {
  const [items, setItems] = useState(() =>
    JSON.parse(localStorage.getItem("yess-list") || "[]")
  );
  const [text, setText] = useState("");
  const [spoken, setSpoken] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const doneCount = items.filter((i) => i.done).length;
  const remainingCount = items.length - doneCount;

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  function addProduct(name, sourceText = name) {
    if (!name.trim()) return;

    setItems((prev) => [
      {
        id: Date.now() + Math.random(),
        name,
        market: marketOf(sourceText),
        category: categoryOf(name),
        done: false,
      },
      ...prev,
    ]);
  }

  function addFromText(value) {
    if (!value.trim()) return;
    parseSpeech(value).forEach((p) => addProduct(p, value));
    setText("");
    setSpoken("");
  }

  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Bu telefonda tarayıcı mikrofon algılamayı desteklemiyor.");
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

  function toggle(id) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id) {
    setItems(items.filter((i) => i.id !== id));
  }

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
          <b>{remainingCount}</b>
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
        {listening ? "⏹️ Durdur" : "🎤 Mikrofonu başlat"}
      </button>

      <div style={styles.voiceBox}>
        <b>Konuşman</b>
        <p style={styles.spokenText}>{spoken || "Henüz algılanmadı."}</p>
        <button onClick={() => addFromText(spoken)} style={styles.aiButton}>
          🧠 Ürün ürün listeye ekle
        </button>
      </div>

      <div style={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örn: Jumbo’dan süt ekmek patates"
          style={styles.input}
        />
        <button onClick={() => addFromText(text)} style={styles.addButton}>
          Ekle
        </button>
      </div>

      <div style={styles.quickBox}>
        {quick.map((q) => (
          <button key={q} onClick={() => addProduct(q)} style={styles.quickButton}>
            + {q}
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <button
          onClick={() => setItems(items.filter((i) => !i.done))}
          style={styles.clearButton}
        >
          Alınanları temizle
        </button>
      )}

      <div style={styles.list}>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 42 }}>🛍️</div>
            <b>Liste boş</b>
            <p>Sesle veya elle ürün ekleyebilirsin.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} style={styles.itemCard}>
              <button
                onClick={() => toggle(item.id)}
                style={{
                  ...styles.check,
                  background: item.done ? "#16a34a" : "white",
                  color: item.done ? "white" : "#111827",
                }}
              >
                {item.done ? "✓" : ""}
              </button>

              <div style={styles.itemIcon}>{iconOf(item.name)}</div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    ...styles.itemName,
                    textDecoration: item.done ? "line-through" : "none",
                    color: item.done ? "#94a3b8" : "#111827",
                  }}
                >
                  {item.name}
                </div>

                <div style={styles.tags}>
                  <span
                    style={{
                      ...styles.marketTag,
                      background: marketColor(item.market),
                      color: item.market === "Jumbo" ? "#111827" : "white",
                    }}
                  >
                    {item.market}
                  </span>
                  <span style={styles.categoryTag}>{item.category}</span>
                </div>
              </div>

              <button onClick={() => remove(item.id)} style={styles.deleteButton}>
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    padding: 18,
    background: "linear-gradient(180deg, #ecfeff 0%, #f8fafc 45%, #f1f5f9 100%)",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#111827",
    color: "white",
    padding: 20,
    borderRadius: 26,
    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
  },
  title: {
    margin: 0,
    fontSize: 34,
    letterSpacing: 1,
  },
  subtitle: {
    margin: "5px 0 0",
    color: "#cbd5e1",
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 20,
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    background: "white",
    borderRadius: 20,
    padding: 14,
    textAlign: "center",
    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
  },
  micButton: {
    width: "100%",
    padding: 19,
    borderRadius: 24,
    border: 0,
    color: "white",
    fontSize: 20,
    fontWeight: 700,
    marginTop: 16,
    boxShadow: "0 12px 25px rgba(15,23,42,0.18)",
  },
  voiceBox: {
    background: "white",
    borderRadius: 24,
    padding: 16,
    marginTop: 14,
    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
  },
  spokenText: {
    color: "#475569",
    minHeight: 30,
  },
  aiButton: {
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: 0,
    background: "#15803d",
    color: "white",
    fontSize: 17,
    fontWeight: 700,
  },
  inputRow: {
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
    background: "white",
  },
  addButton: {
    padding: "0 18px",
    borderRadius: 18,
    border: 0,
    background: "#111827",
    color: "white",
    fontWeight: 700,
  },
  quickBox: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 14,
  },
  quickButton: {
    padding: "11px 14px",
    borderRadius: 999,
    border: 0,
    background: "white",
    boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
    fontWeight: 600,
  },
  clearButton: {
    width: "100%",
    padding: 13,
    borderRadius: 18,
    border: 0,
    marginTop: 14,
    background: "#e2e8f0",
    fontWeight: 700,
  },
  list: {
    marginTop: 18,
    paddingBottom: 30,
  },
  empty: {
    background: "white",
    borderRadius: 24,
    padding: 28,
    textAlign: "center",
    color: "#475569",
    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
  },
  itemCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "white",
    padding: 14,
    borderRadius: 22,
    marginBottom: 11,
    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    border: "2px solid #16a34a",
    fontWeight: 900,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 23,
  },
  itemName: {
    fontSize: 19,
    fontWeight: 800,
    marginBottom: 6,
  },
  tags: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  marketTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
  },
  deleteButton: {
    border: 0,
    borderRadius: 14,
    padding: "9px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 700,
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
