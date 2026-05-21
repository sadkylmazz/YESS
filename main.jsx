import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const PRODUCTS = [
  { tr: "süt", nl: "melk", emoji: "🥛", category: "Kahvaltı" },
  { tr: "ekmek", nl: "brood", emoji: "🍞", category: "Ekmek/Fırın" },
  { tr: "yumurta", nl: "eieren", emoji: "🥚", category: "Kahvaltı" },
  { tr: "peynir", nl: "kaas", emoji: "🧀", category: "Kahvaltı" },
  { tr: "yoğurt", nl: "yoghurt", emoji: "🥣", category: "Kahvaltı" },

  { tr: "elma", nl: "appel", emoji: "🍎", category: "Sebze/Meyve" },
  { tr: "muz", nl: "banaan", emoji: "🍌", category: "Sebze/Meyve" },
  { tr: "domates", nl: "tomaat", emoji: "🍅", category: "Sebze/Meyve" },
  { tr: "patates", nl: "aardappel", emoji: "🥔", category: "Sebze/Meyve" },
  { tr: "salatalık", nl: "komkommer", emoji: "🥒", category: "Sebze/Meyve" },
  { tr: "limon", nl: "citroen", emoji: "🍋", category: "Sebze/Meyve" },
  { tr: "brokoli", nl: "broccoli", emoji: "🥦", category: "Sebze/Meyve", aliases: ["brocoli", "broccoli"] },

  { tr: "tavuk", nl: "kip", emoji: "🍗", category: "Et" },
  { tr: "kıyma", nl: "gehakt", emoji: "🥩", category: "Et" },
  { tr: "et", nl: "vlees", emoji: "🥩", category: "Et" },
  { tr: "sucuk", nl: "Turkse worst", emoji: "🌭", category: "Türk market" },

  { tr: "un", nl: "bloem", emoji: "🌾", category: "Kuru gıda" },
  { tr: "pirinç", nl: "rijst", emoji: "🍚", category: "Kuru gıda" },
  { tr: "makarna", nl: "pasta", emoji: "🍝", category: "Kuru gıda" },
  { tr: "bulgur", nl: "bulgur", emoji: "🌾", category: "Kuru gıda" },
  { tr: "nohut", nl: "kikkererwten", emoji: "🫘", category: "Kuru gıda" },
  { tr: "tuz", nl: "zout", emoji: "🧂", category: "Kuru gıda" },
  { tr: "şeker", nl: "suiker", emoji: "🧂", category: "Kuru gıda" },

  { tr: "deterjan", nl: "wasmiddel", emoji: "🧼", category: "Temizlik" },
  { tr: "tuvalet kağıdı", nl: "wc papier", emoji: "🧻", category: "Temizlik" },
  { tr: "ıslak mendil", nl: "natte doekjes", emoji: "🧴", category: "Yalın için" },
];

const MARKETS = ["Tümü", "Fark etmez", "Albert Heijn", "Jumbo", "PLUS", "Nettorama", "Türk marketi"];

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

function findProduct(word) {
  const n = normalize(word);
  return PRODUCTS.find((p) => {
    const names = [p.tr, p.nl, ...(p.aliases || [])].map(normalize);
    return names.includes(n);
  });
}

function marketFromText(text) {
  const t = normalize(text);
  if (t.includes("jumbo")) return "Jumbo";
  if (t.includes("albert") || t.includes(" ah ")) return "Albert Heijn";
  if (t.includes("plus")) return "PLUS";
  if (t.includes("nettorama")) return "Nettorama";
  if (t.includes("turk market") || t.includes("turkse winkel")) return "Türk marketi";
  return "Fark etmez";
}

function parseInput(text) {
  let t = normalize(text)
    .replaceAll("jumbo'dan", "")
    .replaceAll("jumbodan", "")
    .replaceAll("albert heijn'den", "")
    .replaceAll("ah'den", "")
    .replaceAll("turk marketten", "")
    .replaceAll(" ve ", ",")
    .replaceAll(" ayrica ", ",")
    .replaceAll(" sonra ", ",")
    .replaceAll(".", ",");

  const found = [];

  PRODUCTS.forEach((p) => {
    const allNames = [p.tr, p.nl, ...(p.aliases || [])];
    allNames.forEach((name) => {
      if (t.includes(normalize(name))) found.push(p);
    });
  });

  if (found.length > 0) {
    return [...new Map(found.map((p) => [p.tr, p])).values()];
  }

  return t
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => ({
      tr: x,
      nl: "",
      emoji: "🛒",
      category: "Genel",
    }));
}

function marketColor(market) {
  if (market === "Albert Heijn") return "#009fe3";
  if (market === "Jumbo") return "#ffd400";
  if (market === "PLUS") return "#e30613";
  if (market === "Nettorama") return "#f97316";
  if (market === "Türk marketi") return "#16a34a";
  return "#64748b";
}

function App() {
  const [items, setItems] = useState(() =>
    JSON.parse(localStorage.getItem("yess-list-v2") || "[]")
  );
  const [input, setInput] = useState("");
  const [spoken, setSpoken] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("yess-list-v2", JSON.stringify(items));
  }, [items]);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = normalize(input);
    return PRODUCTS.filter((p) =>
      [p.tr, p.nl, ...(p.aliases || [])].some((name) => normalize(name).includes(q))
    ).slice(0, 6);
  }, [input]);

  const filteredItems = filter === "Tümü" ? items : items.filter((i) => i.market === filter);

  const done = items.filter((i) => i.done).length;
  const remaining = items.length - done;

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

  function addFromText(value) {
    if (!value.trim()) return;
    const list = parseInput(value);
    list.forEach((p) => addProduct(p, value));
    setInput("");
    setSpoken("");
  }

  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Bu tarayıcı mikrofon algılamayı desteklemiyor.");

    const rec = new SR();
    rec.lang = "tr-TR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      let all = "";
      for (let i = 0; i < e.results.length; i++) all += e.results[i][0].transcript + " ";
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
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.badge}>Aile market asistanı</div>
          <h1 style={styles.title}>YESS</h1>
          <p style={styles.subtitle}>Yalın • Ece • Sadık</p>
        </div>
        <div style={styles.heroIcon}>🛒</div>
      </section>

      <section style={styles.stats}>
        <div style={styles.stat}><b>{items.length}</b><span>Toplam</span></div>
        <div style={styles.stat}><b>{remaining}</b><span>Alınacak</span></div>
        <div style={styles.stat}><b>{done}</b><span>Alındı</span></div>
      </section>

      <button
        onClick={listening ? stopMic : startMic}
        style={{ ...styles.mic, background: listening ? "#ef4444" : "#111827" }}
      >
        {listening ? "⏹️ Dinlemeyi durdur" : "🎤 Sesli ekle"}
      </button>

      <section style={styles.card}>
        <div style={styles.cardTitle}>Algılanan konuşma</div>
        <p style={styles.spoken}>{spoken || "Örn: Jumbo’dan süt, ekmek, brokoli"}</p>
        <button onClick={() => addFromText(spoken)} style={styles.greenButton}>
          🧠 Listeye dönüştür
        </button>
      </section>

      <section style={styles.inputWrap}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ürün yaz: el, melk, brocoli..."
          style={styles.input}
        />
        <button onClick={() => addFromText(input)} style={styles.add}>Ekle</button>
      </section>

      {suggestions.length > 0 && (
        <section style={styles.suggestions}>
          {suggestions.map((s) => (
            <button key={s.tr} style={styles.suggestion} onClick={() => addProduct(s, input)}>
              <span style={styles.sEmoji}>{s.emoji}</span>
              <span>
                <b>{s.tr}</b>
                <small>{s.nl}</small>
              </span>
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
              background: filter === m ? "#111827" : "white",
              color: filter === m ? "white" : "#334155",
            }}
          >
            {m}
          </button>
        ))}
      </section>

      {items.length > 0 && (
        <button style={styles.clear} onClick={() => setItems(items.filter((i) => !i.done))}>
          Alınanları temizle
        </button>
      )}

      <section style={styles.list}>
        {filteredItems.length === 0 ? (
          <div style={styles.empty}>🛍️<b>Liste boş</b><p>Sesle veya yazarak ürün ekle.</p></div>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} style={styles.item}>
              <button
                onClick={() => toggle(item.id)}
                style={{
                  ...styles.check,
                  background: item.done ? "#22c55e" : "white",
                  color: item.done ? "white" : "transparent",
                }}
              >
                ✓
              </button>

              <div style={styles.emoji}>{item.emoji}</div>

              <div style={{ flex: 1 }}>
                <div style={{ ...styles.name, textDecoration: item.done ? "line-through" : "none" }}>
                  {item.tr}
                </div>
                <div style={styles.nl}>{item.nl}</div>
                <div style={styles.tags}>
                  <span
                    style={{
                      ...styles.market,
                      background: marketColor(item.market),
                      color: item.market === "Jumbo" ? "#111827" : "white",
                    }}
                  >
                    {item.market}
                  </span>
                  <span style={styles.category}>{item.category}</span>
                </div>
              </div>

              <button style={styles.delete} onClick={() => remove(item.id)}>Sil</button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    paddingBottom: 40,
    fontFamily: "-apple-system, BlinkMacSystemFont, Arial, sans-serif",
    background: "linear-gradient(180deg,#e0f2fe 0%,#f8fafc 45%,#eef2ff 100%)",
    color: "#0f172a",
  },
  hero: {
    borderRadius: 32,
    padding: 22,
    color: "white",
    background: "linear-gradient(135deg,#111827,#0f766e)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 18px 38px rgba(15,23,42,.25)",
  },
  badge: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.14)",
    fontSize: 12,
    fontWeight: 700,
  },
  title: { margin: "12px 0 0", fontSize: 42, letterSpacing: 1 },
  subtitle: { margin: "4px 0 0", color: "#cbd5e1", fontSize: 16 },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    background: "rgba(255,255,255,.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 },
  stat: {
    background: "rgba(255,255,255,.82)",
    borderRadius: 22,
    padding: 14,
    textAlign: "center",
    boxShadow: "0 10px 24px rgba(15,23,42,.08)",
  },
  mic: {
    width: "100%",
    border: 0,
    borderRadius: 26,
    color: "white",
    padding: 18,
    fontSize: 20,
    fontWeight: 800,
    marginTop: 16,
    boxShadow: "0 14px 28px rgba(15,23,42,.18)",
  },
  card: {
    background: "rgba(255,255,255,.9)",
    borderRadius: 26,
    padding: 16,
    marginTop: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,.08)",
  },
  cardTitle: { fontWeight: 800, fontSize: 15 },
  spoken: { color: "#64748b", minHeight: 28 },
  greenButton: {
    width: "100%",
    border: 0,
    borderRadius: 20,
    padding: 14,
    background: "#16a34a",
    color: "white",
    fontSize: 16,
    fontWeight: 800,
  },
  inputWrap: { display: "flex", gap: 8, marginTop: 14 },
  input: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    background: "white",
  },
  add: {
    border: 0,
    borderRadius: 20,
    padding: "0 18px",
    background: "#111827",
    color: "white",
    fontWeight: 800,
  },
  suggestions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 },
  suggestion: {
    border: 0,
    borderRadius: 22,
    background: "white",
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    boxShadow: "0 8px 18px rgba(15,23,42,.07)",
  },
  sEmoji: { fontSize: 24 },
  filters: { display: "flex", gap: 8, overflowX: "auto", marginTop: 14, paddingBottom: 4 },
  filter: {
    border: 0,
    borderRadius: 999,
    padding: "10px 13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 18px rgba(15,23,42,.07)",
  },
  clear: {
    width: "100%",
    border: 0,
    borderRadius: 20,
    padding: 13,
    marginTop: 12,
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 800,
  },
  list: { marginTop: 16 },
  empty: {
    background: "white",
    borderRadius: 28,
    padding: 30,
    textAlign: "center",
    display: "grid",
    gap: 8,
    color: "#64748b",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,.92)",
    borderRadius: 28,
    padding: 14,
    marginBottom: 12,
    boxShadow: "0 12px 28px rgba(15,23,42,.09)",
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 12,
    border: "2px solid #22c55e",
    fontWeight: 900,
  },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 18,
    background: "#f1f5f9",
    display: "grid",
    placeItems: "center",
    fontSize: 25,
  },
  name: { fontSize: 21, fontWeight: 900 },
  nl: { color: "#64748b", fontSize: 14, marginTop: 1 },
  tags: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 },
  market: { borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900 },
  category: {
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    fontWeight: 900,
    background: "#e2e8f0",
    color: "#334155",
  },
  delete: {
    border: 0,
    borderRadius: 16,
    padding: "10px 12px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 900,
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
