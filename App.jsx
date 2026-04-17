import { useState } from "react";

function App() {
  const [mode, setMode] = useState(null);
  const [tables, setTables] = useState([]);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);

  // Add table
  const addTable = () => {
    setTables([...tables, { name: "", columns: "" }]);
  };

  // Update table
  const updateTable = (i, field, value) => {
    const updated = [...tables];
    updated[i][field] = value;
    setTables(updated);
  };

  // Move to chatbot
  const studyTables = () => {
    setReady(true);
  };

  // Send query
  const sendQuery = async () => {
    if (!query) return;

    const newMessages = [...messages, { type: "user", text: query }];
    setMessages(newMessages);
    setQuery("");

    // Format tables
    const formattedTables = tables.map((t) => ({
      name: t.name,
      columns: t.columns.split(",").map((c) => c.trim()),
    }));

    try {
      const formData = new FormData();

      formData.append("query", query);
      formData.append("tables", JSON.stringify(formattedTables));

      // Attach files
      files.forEach((file) => {
        formData.append("files", file);
      });

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
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1>Schema-Aware NL2SQL</h1>

      {/* MODE SELECTION */}
      {!mode && (
        <>
          <h3>Select Mode</h3>
          <button onClick={() => setMode("csv")}>Upload Full Data (CSV)</button>
          <button onClick={() => setMode("schema")}>Enter Table Structure</button>
        </>
      )}

      {/* CSV MODE */}
      {mode === "csv" && !ready && (
        <>
          <h3>Upload CSV Files</h3>

          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />

          <br /><br />

          <button onClick={studyTables}>Continue</button>
        </>
      )}

      {/* SCHEMA MODE */}
      {mode === "schema" && !ready && (
        <>
          <h3>Enter Tables</h3>

          {tables.map((t, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <input
                placeholder="Table Name"
                value={t.name}
                onChange={(e) => updateTable(i, "name", e.target.value)}
              />
              <br />
              <input
                placeholder="Columns (comma separated)"
                value={t.columns}
                onChange={(e) => updateTable(i, "columns", e.target.value)}
              />
            </div>
          ))}

          <button onClick={addTable}>Add Table</button>
          <br /><br />
          <button onClick={studyTables}>Study Tables</button>
        </>
      )}

      {/* CHATBOT */}
      {ready && (
        <>
          <h3>Chat with Database</h3>

          <div
            style={{
              border: "1px solid #ccc",
              height: "300px",
              overflowY: "auto",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.type === "user" ? "right" : "left",
                  marginBottom: "10px",
                }}
              >
                <pre>{msg.text}</pre>
              </div>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your query..."
            style={{ width: "70%" }}
          />

          <button onClick={sendQuery}>Send</button>
        </>
      )}
    </div>
  );
}

export default App;