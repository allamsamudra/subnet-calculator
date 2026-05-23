import { useState } from "react";

// ── Helper functions ──────────────────────────────────────────

// Turn an IP string like "192.168.1.0" into a 32-bit number
function ipToNumber(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Turn a 32-bit number back into "x.x.x.x" format
function numberToIp(num) {
  return [24, 16, 8, 0].map(shift => (num >>> shift) & 255).join(".");
}

// Check if an IP string is valid
function isValidIp(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = Number(p);
    return p !== "" && !isNaN(n) && n >= 0 && n <= 255;
  });
}

// Main calculation function
function calculate(ip, cidr) {
  const prefix = parseInt(cidr);
  if (!isValidIp(ip) || isNaN(prefix) || prefix < 0 || prefix > 32) return null;

  // Build the subnet mask from the prefix
  const maskNum = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const ipNum = ipToNumber(ip);

  const networkNum  = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0;
  const firstHostNum = prefix === 32 ? networkNum  : networkNum + 1;
  const lastHostNum  = prefix === 32 ? broadcastNum : broadcastNum - 1;
  const totalHosts   = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;

  // IP Class based on first octet
  const firstOctet = parseInt(ip.split(".")[0]);
  const ipClass =
    firstOctet < 128 ? "A" :
    firstOctet < 192 ? "B" :
    firstOctet < 224 ? "C" :
    firstOctet < 240 ? "D (Multicast)" : "E (Reserved)";

  return {
    ipAddress:     ip,
    subnetMask:    numberToIp(maskNum),
    wildcardMask:  numberToIp(~maskNum >>> 0),
    networkAddr:   numberToIp(networkNum),
    broadcastAddr: numberToIp(broadcastNum),
    firstHost:     numberToIp(firstHostNum),
    lastHost:      numberToIp(lastHostNum),
    totalHosts:    totalHosts.toLocaleString(),
    ipClass,
    prefix,
    // Binary representation of subnet mask (grouped by octet)
    maskBinary: numberToIp(maskNum).split(".").map(o =>
      parseInt(o).toString(2).padStart(8, "0")
    ).join("."),
  };
}

// ── Result row component ──────────────────────────────────────
function Row({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid #e8edf2",
    }}>
      <span style={{ color: "#6b7c93", fontSize: 13 }}>{label}</span>
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 14, fontWeight: 600,
        color: accent ? "#2563eb" : "#1a2535",
        background: accent ? "#eff6ff" : "#f4f6f9",
        padding: "3px 10px", borderRadius: 6,
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function SubnetCalculator() {
  const [ip, setIp]       = useState("192.168.1.0");
  const [cidr, setCidr]   = useState("24");
  const [result, setResult] = useState(null);
  const [error, setError]  = useState("");

  const handleCalculate = () => {
    if (!isValidIp(ip)) {
      setError("Invalid IP address. Example: 192.168.1.0");
      setResult(null);
      return;
    }
    const prefix = parseInt(cidr);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      setError("Prefix must be between 0 and 32.");
      setResult(null);
      return;
    }
    setError("");
    setResult(calculate(ip, cidr));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCalculate();
  };

  // Quick preset buttons
  const presets = [
    { label: "/8",  cidr: "8",  ip: "10.0.0.0" },
    { label: "/16", cidr: "16", ip: "172.16.0.0" },
    { label: "/24", cidr: "24", ip: "192.168.1.0" },
    { label: "/30", cidr: "30", ip: "192.168.1.0" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f4f8",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌐</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a2535" }}>
            Subnet Calculator
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7c93", fontSize: 14 }}>
            Enter an IP address and CIDR prefix to get all subnet details.
          </p>
        </div>

        {/* Input card */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 24,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 16,
        }}>

          {/* IP input */}
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7c93", marginBottom: 6, letterSpacing: "0.06em" }}>
            IP ADDRESS
          </label>
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 192.168.1.0"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px", fontSize: 16,
              fontFamily: "'Courier New', monospace",
              border: "1.5px solid #d1dae5", borderRadius: 8,
              outline: "none", marginBottom: 14, color: "#1a2535",
              background: "#f8fafc",
            }}
          />

          {/* CIDR input */}
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7c93", marginBottom: 6, letterSpacing: "0.06em" }}>
            CIDR PREFIX (0 – 32)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 18, color: "#2563eb", fontWeight: 700 }}>/</span>
            <input
              value={cidr}
              onChange={e => setCidr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="24"
              type="number" min="0" max="32"
              style={{
                width: 80, padding: "10px 14px", fontSize: 16,
                fontFamily: "'Courier New', monospace",
                border: "1.5px solid #d1dae5", borderRadius: 8,
                outline: "none", color: "#1a2535", background: "#f8fafc",
              }}
            />
            <input
              type="range" min="0" max="32" value={cidr}
              onChange={e => setCidr(e.target.value)}
              style={{ flex: 1, accentColor: "#2563eb" }}
            />
          </div>

          {/* Presets */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#6b7c93", alignSelf: "center" }}>Quick:</span>
            {presets.map(p => (
              <button key={p.label}
                onClick={() => { setIp(p.ip); setCidr(p.cidr); setResult(null); setError(""); }}
                style={{
                  padding: "4px 12px", fontSize: 12, fontFamily: "monospace",
                  background: "#eff6ff", color: "#2563eb",
                  border: "1px solid #bfdbfe", borderRadius: 20, cursor: "pointer",
                  fontWeight: 600,
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "10px 14px",
              color: "#dc2626", fontSize: 13, marginBottom: 14,
            }}>
               {error}
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            style={{
              width: "100%", padding: "12px", fontSize: 15, fontWeight: 700,
              background: "#2563eb", color: "#fff", border: "none",
              borderRadius: 10, cursor: "pointer", letterSpacing: "0.04em",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.target.style.background = "#1d4ed8"}
            onMouseLeave={e => e.target.style.background = "#2563eb"}
          >
            Calculate
          </button>
        </div>

        {/* Result card */}
        {result && (
          <div style={{
            background: "#fff", borderRadius: 14, padding: 24,
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a2535", letterSpacing: "0.02em" }}>
               Results for {result.ipAddress}/{result.prefix}
            </h2>

            <Row label="IP Class"         value={`Class ${result.ipClass}`}  accent />
            <Row label="Subnet Mask"      value={result.subnetMask} />
            <Row label="Wildcard Mask"    value={result.wildcardMask} />
            <Row label="Network Address"  value={result.networkAddr}  accent />
            <Row label="Broadcast Address" value={result.broadcastAddr} accent />
            <Row label="First Usable Host" value={result.firstHost} />
            <Row label="Last Usable Host"  value={result.lastHost} />
            <Row label="Total Usable Hosts" value={result.totalHosts} />

            {/* Binary mask */}
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#f4f6f9", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#6b7c93", marginBottom: 4, letterSpacing: "0.08em" }}>
                SUBNET MASK IN BINARY
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#1a2535", wordBreak: "break-all", lineHeight: 1.8 }}>
                {result.maskBinary.split(".").map((octet, i) => (
                  <span key={i}>
                    {octet.split("").map((bit, j) => (
                      <span key={j} style={{ color: bit === "1" ? "#2563eb" : "#94a3b8" }}>{bit}</span>
                    ))}
                    {i < 3 && <span style={{ color: "#cbd5e1" }}>.</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 24 }}>
          Built with React · Press Enter or click Calculate
        </p>
      </div>
    </div>
  );
}