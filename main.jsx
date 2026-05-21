import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { PRODUCTS } from "./products.js";

const MARKETS = [
  "Tümü",
  "Fark etmez",
  "Albert Heijn",
  "Jumbo",
  "PLUS",
  "Nettorama",
  "Türk marketi",
];

function normalize(text) {
  return text
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function marketFromText(text) {
  const t = normalize(text);

  if (t.includes("jumbo")) return "Jumbo";
  if (t.includes("albert") || t.includes(" ah ")) return "Albert Heijn";
  if (t.includes("plus")) return "PLUS";
  if (t.includes("nettorama")) return "Nettorama";
  if (t.includes("turk market")) return "Türk marketi";

  return "Fark etmez";
}

function marketColor(market) {
  if (market === "Albert Heijn") return "#00AEEF";
  if (market === "Jumbo") return "#FFD500";
  if (market === "PLUS") return "#E30613";
  if (market === "Nettorama") return "#F97316";
  if (market === "Türk marketi") return "#16A34A";

  return "#64748B";
}

function parseText(text) {
  const t = normalize(text);

  const found = [];

  PRODUCTS.forEach((product) => {
    const allNames = [
      product.tr,
      product.nl,
      ...(product.aliases || []),
    ];

    allNames.forEach((name) => {
      if (t.includes(normalize(name))) {
        found.push(product);
      }
    });
  });

  return [...new Map(found.map((p) => [p.tr, p])).values()];
}

function App() {
  const [items, setItems] = useState(() =>
    JSON.parse(localStorage.getItem("yess-v3") || "[]")
  );

  const [input, setInput] = useState("");
  const [spoken, setSpoken] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("yess-v3", JSON.stringify(items));
  }, [items]);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];

    const q = normalize(input);

    return PRODUCTS.filter((p) =>
      [p.tr, p.nl, ...(p.aliases || [])].some((n) =>
        normalize(n).includes(q)
      )
    ).slice(0, 8);
  }, [input]);

  const filteredItems =
    filter === "Tümü"
      ? items
      : items.filter((i) => i.market === filter);

  const doneCount = items.filter((i) => i.done).length;

  function addProduct(product, source = input) {
    setItems((prev) => [
      {
        id: Date.now() + Math.random(),
        ...product,
        market: marketFromText(source),
        done: false,
      },
      ...prev,
    ]);

    setInput("");
  }

  function addFromInput(value) {
    if (!value.trim()) return;

    const parsed = parseText(value);

    if (parsed.length > 0) {
      parsed.forEach((p) => addProduct(p, value));
    } else {
      addProduct(
        {
          tr: value,
          nl: "",
          emoji: "🛒",
          category: "Genel",
        },
        value
      );
    }

    setInput("");
    setSpoken("");
  }

  function toggleDone(id) {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i
      )
    );
  }

  function removeItem(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  function startListening() {
    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SR) {
      alert("Bu tarayıcı mikrofon desteklemiyor.");
      return;
    }

    const rec = new SR();

    rec.lang = "tr-TR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      let transcript = "";

      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + " ";
      }

      setSpoken(transcript.trim());
    };

    recognitionRef.current = rec;

    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.badge}>YESS AI Market</div>
          <h1 style={styles.title}>YESS</h1>
          <p style={styles.subtitle}>
            Yalın • Ece • Sadık
          </p>
        </div>

        <div style={styles.heroIcon}>🛒</div>
      </section>

      <section style={styles.stats}>
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
      </section>

      <button
        onClick={listening ? stopListening : startListening}
        style={{
          ...styles.micButton,
          background: listening ? "#DC2626" : "#111827",
        }}
      >
        {listening
          ? "⏹️ Dinlemeyi durdur"
          : "🎤 Sesli ürün ekle"}
      </button>

      <section style={styles.voiceCard}>
        <b>Algılanan konuşma</b>

        <p style={styles.voiceText}>
          {spoken ||
            "Örn: Jumbo’dan süt, ekmek, brokoli"}
        </p>

        <button
          style={styles.greenButton}
          onClick={() => addFromInput(spoken)}
        >
          🧠 Yapay zekayla listeye ekle
        </button>
      </section>

      <section style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ürün ara..."
          style={styles.input}
        />

        <button
          onClick={() => addFromInput(input)}
          style={styles.addButton}
        >
          Ekle
        </button>
      </section>

      {suggestions.length > 0 && (
        <section style={styles.suggestions}>
          {suggestions.map((s) => (
            <button
              key={s.tr}
              style={styles.suggestion}
              onClick={() => addProduct(s)}
            >
              <div style={styles.sEmoji}>
                {s.emoji}
              </div>

              <div>
                <div style={{ fontWeight: 800 }}>
                  {s.tr}
                </div>

                <small style={{ color: "#64748B" }}>
                  {s.nl}
                </small>
              </div>
            </button>
          ))}
        </section>
      )}

      <section style={styles.filters}>
        {MARKETS.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            style={{
              ...styles.filter,
              background:
                filter === m ? "#111827" : "white",
              color:
                filter === m ? "white" : "#334155",
            }}
          >
            {m}
          </button>
        ))}
      </section>

      <section style={styles.list}>
        {filteredItems.map((item) => (
          <article
            key={item.id}
            style={styles.itemCard}
          >
            <button
              onClick={() => toggleDone(item.id)}
              style={{
                ...styles.check,
                background: item.done
                  ? "#22C55E"
                  : "white",
                color: item.done
                  ? "white"
                  : "transparent",
              }}
            >
              ✓
            </button>

            <div style={styles.itemEmoji}>
              {item.emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  ...styles.itemName,
                  textDecoration: item.done
                    ? "line-through"
                    : "none",
                }}
              >
                {item.tr}
              </div>

              <div style={styles.nlName}>
                {item.nl}
              </div>

              <div style={styles.tags}>
                <span
                  style={{
                    ...styles.marketTag,
                    background: marketColor(
                      item.market
                    ),
                    color:
                      item.market === "Jumbo"
                        ? "#111827"
                        : "white",
                  }}
                >
                  {item.market}
                </span>

                <span style={styles.categoryTag}>
                  {item.category}
                </span>
              </div>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              style={styles.deleteButton}
            >
              Sil
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    paddingBottom: 50,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Arial",
    background:
      "linear-gradient(180deg,#e0f2fe 0%,#f8fafc 40%,#eef2ff 100%)",
  },

  hero: {
    background:
      "linear-gradient(135deg,#111827,#0f766e)",
    borderRadius: 32,
    padding: 24,
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 20px 40px rgba(15,23,42,.25)",
  },

  badge: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.12)",
    fontSize: 12,
    fontWeight: 700,
  },

  title: {
    margin: "12px 0 0",
    fontSize: 44,
  },

  subtitle: {
    marginTop: 5,
    color: "#CBD5E1",
  },

  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    background: "rgba(255,255,255,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    background: "rgba(255,255,255,.85)",
    borderRadius: 24,
    padding: 14,
    textAlign: "center",
    boxShadow:
      "0 10px 24px rgba(15,23,42,.08)",
  },

  micButton: {
    width: "100%",
    border: 0,
    borderRadius: 26,
    color: "white",
    padding: 18,
    fontSize: 20,
    fontWeight: 800,
    marginTop: 16,
  },

  voiceCard: {
    background: "rgba(255,255,255,.9)",
    borderRadius: 26,
    padding: 16,
    marginTop: 14,
  },

  voiceText: {
    color: "#64748B",
  },

  greenButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    padding: 14,
    background: "#16A34A",
    color: "white",
    fontWeight: 800,
    marginTop: 10,
  },

  inputRow: {
    display: "flex",
    gap: 8,
    marginTop: 14,
  },

  input: {
    flex: 1,
    border: "1px solid #CBD5E1",
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    background: "white",
  },

  addButton: {
    border: 0,
    borderRadius: 20,
    padding: "0 18px",
    background: "#111827",
    color: "white",
    fontWeight: 800,
  },

  suggestions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 12,
  },

  suggestion: {
    border: 0,
    borderRadius: 22,
    background: "white",
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  sEmoji: {
    fontSize: 24,
  },

  filters: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    marginTop: 14,
    paddingBottom: 4,
  },

  filter: {
    border: 0,
    borderRadius: 999,
    padding: "10px 13px",
    whiteSpace: "nowrap",
    fontWeight: 800,
  },

  list: {
    marginTop: 16,
  },

  itemCard: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "rgba(255,255,255,.92)",
    borderRadius: 28,
    padding: 14,
    marginBottom: 12,
  },

  check: {
    width: 32,
    height: 32,
    borderRadius: 12,
    border: "2px solid #22C55E",
    fontWeight: 900,
  },

  itemEmoji: {
    width: 48,
    height: 48,
    borderRadius: 18,
    background: "#F1F5F9",
    display: "grid",
    placeItems: "center",
    fontSize: 25,
  },

  itemName: {
    fontSize: 21,
    fontWeight: 900,
  },

  nlName: {
    color: "#64748B",
    fontSize: 14,
  },

  tags: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 7,
  },

  marketTag: {
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    fontWeight: 900,
  },

  categoryTag: {
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    fontWeight: 900,
    background: "#E2E8F0",
    color: "#334155",
  },

  deleteButton: {
    border: 0,
    borderRadius: 16,
    padding: "10px 12px",
    background: "#FEE2E2",
    color: "#991B1B",
    fontWeight: 900,
  },
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
