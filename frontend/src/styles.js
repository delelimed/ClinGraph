// src/styles.js
export const styles = {
  page: { display: "flex", height: "100vh", background: "#020617", color: "white", fontFamily: "Arial" },
  centerContainer: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "radial-gradient(circle at top, #0f172a, #020617)", color: "white", fontFamily: "Arial", padding: 20 },
  welcomeBox: { background: "rgba(30, 41, 59, 0.4)", padding: 40, borderRadius: 16, border: "1px solid #334155", textAlign: "center", maxWidth: 600 },
  left: { width: "32%", padding: 20, borderRight: "1px solid #1e293b", overflow: "auto", display: "flex", flexDirection: "column" },
  right: { width: "68%", background: "#070a13" },
  input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "white", marginBottom: 12 },
  buttonPrimary: { padding: "12px 24px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,#06b6d4,#6366f1)", color: "white", fontWeight: "bold", cursor: "pointer" },
  buttonSecondary: { padding: "12px 24px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#cbd5e1", fontWeight: "bold", cursor: "pointer" },
  backButton: { background: "none", border: "none", color: "#64748b", cursor: "pointer", alignSelf: "flex-start", padding: 0, fontSize: 14, marginBottom: 10 },
  results: { marginTop: 20 },
  card: { padding: 14, marginBottom: 10, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#f8fafc", margin: "4px 0" },
  badge: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: "bold" },
  dot: { display: "inline-block", width: 10, height: 10, borderRadius: "50%" }
};