import { useState, useRef, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080b12;
    color: #e2e8f0;
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
  }

  :root {
    --bg-0: #080b12;
    --bg-1: #0d1117;
    --bg-2: #161b27;
    --bg-3: #1e2535;
    --bg-4: #252d3d;
    --accent: #3b82f6;
    --accent-glow: rgba(59,130,246,0.15);
    --accent-dim: #1d4ed8;
    --green: #10b981;
    --green-glow: rgba(16,185,129,0.12);
    --amber: #f59e0b;
    --border: rgba(255,255,255,0.07);
    --border-accent: rgba(59,130,246,0.4);
    --text-1: #f1f5f9;
    --text-2: #94a3b8;
    --text-3: #4b5563;
    --mono: 'JetBrains Mono', monospace;
  }

  .app-wrapper {
    min-height: 100vh;
    background: var(--bg-0);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 16px 60px;
  }

  /* ─── HEADER ─── */
  .header {
    width: 100%;
    max-width: 720px;
    padding: 48px 0 40px;
    text-align: center;
    animation: fadeDown 0.6s ease both;
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-glow);
    border: 1px solid var(--border-accent);
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 11px;
    font-family: var(--mono);
    color: var(--accent);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .header-badge::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .header h1 {
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--text-1);
    line-height: 1.1;
    margin-bottom: 10px;
  }

  .header h1 span {
    background: linear-gradient(135deg, var(--accent), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header p {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.6;
  }

  /* ─── CARD ─── */
  .card {
    width: 100%;
    max-width: 720px;
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    animation: fadeUp 0.5s ease both;
  }

  .card-inner {
    padding: 32px;
  }

  /* ─── MODE SELECTION ─── */
  .mode-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 8px;
  }

  .mode-btn {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    color: var(--text-1);
    position: relative;
    overflow: hidden;
  }

  .mode-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .mode-btn.csv-btn::before { background: radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 60%); }
  .mode-btn.schema-btn::before { background: radial-gradient(circle at top left, rgba(16,185,129,0.12), transparent 60%); }

  .mode-btn:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
  .mode-btn:hover::before { opacity: 1; }

  .mode-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 14px;
  }

  .csv-btn .mode-icon { background: rgba(59,130,246,0.15); }
  .schema-btn .mode-icon { background: rgba(16,185,129,0.15); }

  .mode-btn h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .mode-btn p { font-size: 12px; color: var(--text-2); line-height: 1.5; }

  /* ─── SECTION TITLE ─── */
  .section-title {
    font-size: 11px;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    margin-bottom: 16px;
  }

  /* ─── FILE UPLOAD ─── */
  .upload-zone {
    border: 1.5px dashed var(--border);
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .upload-zone:hover { border-color: var(--accent); background: var(--accent-glow); }

  .upload-zone input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .upload-icon {
    font-size: 32px;
    margin-bottom: 10px;
    display: block;
  }

  .upload-zone p { font-size: 14px; color: var(--text-2); }
  .upload-zone span { font-size: 12px; color: var(--text-3); margin-top: 4px; display: block; }

  .file-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-family: var(--mono);
    color: var(--accent);
    margin: 4px 4px 0 0;
  }

  /* ─── TABLE SCHEMA ─── */
  .table-row {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 10px;
    animation: fadeUp 0.3s ease both;
  }

  .table-row-label {
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  .sql-input {
    width: 100%;
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px;
    font-family: var(--mono);
    color: var(--text-1);
    transition: border-color 0.2s;
    outline: none;
  }

  .sql-input:focus { border-color: var(--border-accent); background: var(--bg-4); }
  .sql-input::placeholder { color: var(--text-3); }

  /* ─── BUTTONS ─── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-family: 'Syne', sans-serif;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .btn-primary:hover { background: var(--accent-dim); transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    background: var(--bg-3);
    color: var(--text-2);
    border: 1px solid var(--border);
  }

  .btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: var(--text-1); }

  .btn-green {
    background: var(--green);
    color: #fff;
  }

  .btn-green:hover { opacity: 0.85; transform: translateY(-1px); }

  .btn-row {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  /* ─── CHAT ─── */
  .chat-area {
    background: var(--bg-0);
    border: 1px solid var(--border);
    border-radius: 12px;
    height: 360px;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }

  .chat-area::-webkit-scrollbar { width: 4px; }
  .chat-area::-webkit-scrollbar-track { background: transparent; }
  .chat-area::-webkit-scrollbar-thumb { background: var(--bg-3); border-radius: 4px; }

  .msg-row {
    display: flex;
    gap: 10px;
    animation: fadeUp 0.3s ease both;
  }

  .msg-row.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  .msg-row.user .msg-avatar { background: var(--accent); }
  .msg-row.bot .msg-avatar { background: var(--bg-3); border: 1px solid var(--border); }

  .msg-bubble {
    max-width: 85%;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.6;
  }

  .msg-row.user .msg-bubble {
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .msg-row.bot .msg-bubble {
    background: var(--bg-2);
    border: 1px solid var(--border);
    color: var(--text-1);
    border-bottom-left-radius: 4px;
  }

  .msg-bubble pre {
    font-family: var(--mono);
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .sql-block {
    background: var(--bg-0);
    border: 1px solid var(--border);
    border-left: 2px solid var(--accent);
    border-radius: 6px;
    padding: 10px 12px;
    margin: 8px 0 4px;
    font-family: var(--mono);
    font-size: 12px;
    color: #93c5fd;
    white-space: pre-wrap;
  }

  .result-block {
    background: var(--bg-0);
    border: 1px solid var(--border);
    border-left: 2px solid var(--green);
    border-radius: 6px;
    padding: 10px 12px;
    margin: 4px 0;
    font-family: var(--mono);
    font-size: 12px;
    color: #6ee7b7;
    white-space: pre-wrap;
  }

  .explanation-text {
    font-size: 12.5px;
    color: var(--text-2);
    margin-top: 8px;
    line-height: 1.6;
  }

  .block-label {
    font-size: 9px;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .block-label.sql { color: var(--accent); }
  .block-label.result { color: var(--green); }
  .block-label.explanation { color: var(--amber); }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    gap: 8px;
    font-size: 13px;
  }

  .empty-icon { font-size: 28px; opacity: 0.4; }

  /* ─── CHAT INPUT ─── */
  .chat-input-row {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    font-family: 'Syne', sans-serif;
    color: var(--text-1);
    outline: none;
    transition: border-color 0.2s;
  }

  .chat-input:focus { border-color: var(--border-accent); }
  .chat-input::placeholder { color: var(--text-3); }

  .send-btn {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: var(--accent);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .send-btn:hover { background: var(--accent-dim); transform: translateY(-1px); }
  .send-btn:active { transform: scale(0.95); }
  .send-btn svg { width: 18px; height: 18px; fill: #fff; }

  /* ─── TYPING INDICATOR ─── */
  .typing {
    display: flex; gap: 4px; align-items: center; padding: 4px 0;
  }

  .typing span {
    width: 6px; height: 6px;
    background: var(--text-3);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }

  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  /* ─── DIVIDER ─── */
  .divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }

  /* ─── STATUS BAR ─── */
  .status-bar {
    width: 100%;
    max-width: 720px;
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    animation: fadeUp 0.6s 0.3s ease both;
    opacity: 0;
    animation-fill-mode: forwards;
  }

  .status-item {
    font-size: 11px;
    font-family: var(--mono);
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .status-dot { width: 5px; height: 5px; border-radius: 50%; }
  .status-dot.green { background: var(--green); }
  .status-dot.blue { background: var(--accent); }

  /* ─── ANIMATIONS ─── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
`;

function BotMessage({ text }) {
  const sql = text.split("SQL:\n")[1]?.split("\n\nResult:")[0]?.trim();
  const result = text.split("Result:\n")[1]?.split("\n\nExplanation:")[0]?.trim();
  const explanation = text.split("Explanation:\n")[1]?.trim();

  if (sql || result || explanation) {
    return (
      <div>
        {sql && (
          <>
            <div className="block-label sql">SQL Query</div>
            <div className="sql-block">{sql}</div>
          </>
        )}
        {result && (
          <>
            <div className="block-label result">Result</div>
            <div className="result-block">{result}</div>
          </>
        )}
        {explanation && (
          <>
            <div className="block-label explanation">Explanation</div>
            <div className="explanation-text">{explanation}</div>
          </>
        )}
      </div>
    );
  }

  return <pre>{text}</pre>;
}

function App() {
  const [mode, setMode] = useState(null);
  const [tables, setTables] = useState([]);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const addTable = () => {
    setTables([...tables, { name: "", columns: "" }]);
  };

  const updateTable = (i, field, value) => {
    const updated = [...tables];
    updated[i][field] = value;
    setTables(updated);
  };

  const studyTables = () => {
    setReady(true);
  };

  const sendQuery = async () => {
    if (!query.trim()) return;

    const newMessages = [...messages, { type: "user", text: query }];
    setMessages(newMessages);
    setQuery("");
    setLoading(true);

    const formattedTables = tables.map((t) => ({
      name: t.name,
      columns: t.columns.split(",").map((c) => c.trim()),
    }));

    try {
      const formData = new FormData();
      formData.append("query", query);
      formData.append("tables", JSON.stringify(formattedTables));
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("https://nl-to-sql-project.onrender.com/query", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const text = data.response;

      const sql = text.split("SQL_START")[1]?.split("SQL_END")[0]?.trim();
      const result = text.split("RESULT_START")[1]?.split("RESULT_END")[0]?.trim();
      const explanation = text.split("EXPLANATION_START")[1]?.split("EXPLANATION_END")[0]?.trim();

      const formatted = `SQL:\n${sql}\n\nResult:\n${result}\n\nExplanation:\n${explanation}`;

      setMessages([...newMessages, { type: "bot", text: formatted }]);
    } catch (err) {
      setMessages([...newMessages, { type: "bot", text: "Error connecting to backend" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-wrapper">

        {/* HEADER */}
        <div className="header">
          <div className="header-badge">NL2SQL Engine</div>
          <h1>Query in <span>Plain English</span></h1>
          <p>Transform natural language into SQL — run queries, see results, understand everything.</p>
        </div>

        {/* MAIN CARD */}
        <div className="card">
          <div className="card-inner">

            {/* MODE SELECTION */}
            {!mode && (
              <>
                <div className="section-title">// Choose input mode</div>
                <div className="mode-grid">
                  <button className="mode-btn csv-btn" onClick={() => setMode("csv")}>
                    <div className="mode-icon">📂</div>
                    <h3>Upload CSV</h3>
                    <p>Upload full data files. The engine reads and queries them directly.</p>
                  </button>
                  <button className="mode-btn schema-btn" onClick={() => setMode("schema")}>
                    <div className="mode-icon">🗂</div>
                    <h3>Define Schema</h3>
                    <p>Enter table names and columns. No data upload needed.</p>
                  </button>
                </div>
              </>
            )}

            {/* CSV MODE */}
            {mode === "csv" && !ready && (
              <>
                <div className="section-title">// Upload your CSV files</div>
                <div className="upload-zone">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles([...e.target.files])}
                  />
                  <span className="upload-icon">⬆</span>
                  <p>Drop files here or click to browse</p>
                  <span>.csv files supported</span>
                </div>
                {files.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    {[...files].map((f, i) => (
                      <span key={i} className="file-chip">⬤ {f.name}</span>
                    ))}
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn btn-ghost" onClick={() => setMode(null)}>← Back</button>
                  <button className="btn btn-primary" onClick={studyTables}>Continue →</button>
                </div>
              </>
            )}

            {/* SCHEMA MODE */}
            {mode === "schema" && !ready && (
              <>
                <div className="section-title">// Define table schema</div>
                {tables.map((t, i) => (
                  <div className="table-row" key={i}>
                    <div className="table-row-label">Table {i + 1}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                      <div>
                        <div className="table-row-label">Name</div>
                        <input
                          className="sql-input"
                          placeholder="e.g. users"
                          value={t.name}
                          onChange={(e) => updateTable(i, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="table-row-label">Columns (comma separated)</div>
                        <input
                          className="sql-input"
                          placeholder="e.g. id, name, email, created_at"
                          value={t.columns}
                          onChange={(e) => updateTable(i, "columns", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="btn-row">
                  <button className="btn btn-ghost" onClick={() => setMode(null)}>← Back</button>
                  <button className="btn btn-ghost" onClick={addTable}>+ Add Table</button>
                  <button className="btn btn-green" onClick={studyTables} style={{ marginLeft: "auto" }}>
                    Start Querying →
                  </button>
                </div>
              </>
            )}

            {/* CHATBOT */}
            {ready && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div className="section-title" style={{ margin: 0 }}>// Natural language interface</div>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => { setReady(false); }}>
                    ← Change input
                  </button>
                </div>

                <div className="chat-area" ref={chatRef}>
                  {messages.length === 0 && (
                    <div className="empty-state">
                      <span className="empty-icon">⬡</span>
                      <span>Ask anything about your data</span>
                      <span style={{ fontSize: 11 }}>e.g. "Show me top 10 users by revenue"</span>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`msg-row ${msg.type}`}>
                      <div className="msg-avatar">
                        {msg.type === "user" ? "U" : "AI"}
                      </div>
                      <div className="msg-bubble">
                        {msg.type === "bot" ? <BotMessage text={msg.text} /> : msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="msg-row bot">
                      <div className="msg-avatar">AI</div>
                      <div className="msg-bubble">
                        <div className="typing">
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input-row">
                  <input
                    className="chat-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your data..."
                  />
                  <button className="send-btn" onClick={sendQuery} disabled={loading}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          <div className="status-item">
            <div className="status-dot green" />
            backend: localhost:5000
          </div>
          <div className="status-item">
            <div className="status-dot blue" />
            nl2sql v1.0
          </div>
        </div>

      </div>
    </>
  );
}

export default App;
