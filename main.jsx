import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const translate = {
  melk: "süt", brood: "ekmek", eieren: "yumurta", kaas: "peynir",
  tomaat: "domates", aardappel: "patates", banaan: "muz", appel: "elma",
  kip: "tavuk", gehakt: "kıyma", yoghurt: "yoğurt", rijst: "pirinç",
  pasta: "makarna", wasmiddel: "deterjan"
};

const products = [
  "süt","ekmek","yumurta","peynir","domates","patates","limon","tuz","şeker",
  "un","pirinç","makarna","tavuk","kıyma","et","salatalık","muz","elma",
  "yoğurt","deterjan","peçete","tuvalet kağıdı","zeytin","sucuk","ayran",
  "bulgur","nohut","çay","kahve","kaşar","tereyağı","ıslak mendil"
];

function marketOf(text) {
  const t = text.toLowerCase();
  if (t.includes("jumbo")) return "Jumbo";
  if (t.includes("albert") || t.includes(" ah ")) return "Albert Heijn";
  if (t.includes("plus")) return "PLUS";
  if (t.includes("nettorama")) return "Nettorama";
  if (t.includes("türk") || t.includes("turk") || t.includes("sucuk") || t.includes("ayran")) return "Türk marketi";
  return "Fark etmez";
}

function categoryOf(name) {
  if (/domates|patates|limon|salatalık|muz|elma/.test(name)) return "Sebze/Meyve";
  if (/süt|yumurta|peynir|yoğurt|kaşar|tereyağı/.test(name)) return "Kahvaltı";
  if (/tavuk|kıyma|et|sucuk/.test(name)) return "Et";
  if (/deterjan|peçete|tuvalet|mendil/.test(name)) return "Temizlik";
  if (/pirinç|makarna|bulgur|nohut|un|şeker|tuz/.test(name)) return "Kuru gıda";
  return "Genel";
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

  return t.split(",").map(x => x.trim()).filter(Boolean);
}

function App() {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("yess-list") || "[]"));
  const [text, setText] = useState("");
  const [spoken, setSpoken] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  function addProduct(name, sourceText = name) {
    setItems(prev => [{
      id: Date.now() + Math.random(),
      name,
      market: marketOf(sourceText),
      category: categoryOf(name),
      done: false
    }, ...prev]);
  }

  function addFromText(value) {
    parseSpeech(value).forEach(p => addProduct(p, value));
    setText("");
    setSpoken("");
  }

  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Bu telefonda tarayıcı mikrofon algılamayı desteklemiyor.");

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
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function remove(id) {
    setItems(items.filter(i => i.id !== id));
  }

  const quick = ["süt", "ekmek", "yumurta", "domates", "muz", "peynir", "tavuk", "yoğurt"];

  return (
    <div style={{ fontFamily: "Arial", padding: 18, background: "#f4f4f5", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 0 }}>YESS</h1>
      <p style={{ marginTop: 4 }}>Yalın • Ece • Sadık</p>

      <button onClick={listening ? stopMic : startMic}
        style={{ width:"100%", padding:18, borderRadius:18, border:0, background:listening?"#b91c1c":"#111", color:"white", fontSize:20 }}>
        {listening ? "⏹️ Durdur" : "🎤 Mikrofonu başlat"}
      </button>

      <div style={{ background:"white", borderRadius:16, padding:14, marginTop:12 }}>
        <b>Konuşman:</b>
        <p>{spoken || "Henüz algılanmadı."}</p>
        <button onClick={() => addFromText(spoken)}
          style={{ width:"100%", padding:14, borderRadius:14, border:0, background:"#166534", color:"white", fontSize:17 }}>
          🧠 Ürün ürün listeye ekle
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:14 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Örn: Jumbo’dan süt ekmek patates"
          style={{ flex:1, padding:14, borderRadius:14, border:"1px solid #ccc", fontSize:16 }} />
        <button onClick={() => addFromText(text)}
          style={{ padding:14, borderRadius:14, border:0, background:"#111", color:"white" }}>
          Ekle
        </button>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
        {quick.map(q => (
          <button key={q} onClick={() => addProduct(q)}
            style={{ padding:"10px 13px", borderRadius:20, border:0, background:"white" }}>
            + {q}
          </button>
        ))}
      </div>

      <button onClick={() => setItems(items.filter(i => !i.done))}
        style={{ marginTop:14, width:"100%", padding:12, borderRadius:14, border:0, background:"#e5e7eb" }}>
        Alınanları temizle
      </button>

      <div style={{ marginTop:18 }}>
        {items.length === 0 ? <p>Liste boş.</p> : items.map(item => (
          <div key={item.id} style={{ display:"flex", gap:10, alignItems:"center", background:"white", padding:14, borderRadius:16, marginBottom:10 }}>
            <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:19, textDecoration:item.done?"line-through":"none" }}>{item.name}</div>
              <small>{item.market} • {item.category}</small>
            </div>
            <button onClick={() => remove(item.id)} style={{ border:0, borderRadius:10, padding:9 }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
