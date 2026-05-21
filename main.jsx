import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("yess-list");
    return saved ? JSON.parse(saved) : [];
  });
  const [text, setText] = useState("");

  useEffect(() => {
    localStorage.setItem("yess-list", JSON.stringify(items));
  }, [items]);

  function addItem() {
    if (!text.trim()) return;

    setItems([
      { id: Date.now(), name: text.trim(), done: false },
      ...items,
    ]);

    setText("");
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
    <div style={{ fontFamily: "Arial", padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1>YESS</h1>
      <p>Yalın • Ece • Sadık</p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ürün yaz: süt, ekmek, brood..."
          style={{ flex: 1, padding: 14, borderRadius: 10, border: "1px solid #ccc", fontSize: 16 }}
        />
        <button onClick={addItem} style={{ padding: 14, borderRadius: 10, border: "none", background: "black", color: "white" }}>
          Ekle
        </button>
      </div>

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
