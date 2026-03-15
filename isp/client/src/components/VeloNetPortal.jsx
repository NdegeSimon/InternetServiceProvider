import { useState, useCallback } from "react";

// ─── CONFIG — swap these for your real values ───────────────────────────────
const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : "/api";

const ENDPOINTS = {
  stkPush:   `${API_BASE}/mpesa/stk-push`,   // POST  { phone, amount, package, packageId }
  stkStatus: `${API_BASE}/mpesa/stk-status`, // GET   ?checkoutRequestId=xxx
  reconnect: `${API_BASE}/reconnect`,         // POST  { mpesa_code }
};
// ─────────────────────────────────────────────────────────────────────────────

const PACKAGES = [
  { id: "1h",  label: "1 Hour",   category: "Quick",      amount: 10,  popular: false, span: 1 },
  { id: "2h",  label: "2 Hours",  category: "Quick",      amount: 15,  popular: false, span: 1 },
  { id: "6h",  label: "6 Hours",  category: "Half Day",   amount: 30,  popular: false, span: 1 },
  { id: "24h", label: "24 Hours", category: "Full Day",   amount: 60,  popular: true,  span: 1 },
  { id: "2d",  label: "2 Days",   category: "Weekend",    amount: 100, popular: false, span: 1 },
  { id: "7d",  label: "Weekly",   category: "Best Value", amount: 300, popular: false, span: 1 },
  { id: "30d", label: "Monthly",  category: "Unlimited",  amount: 900, popular: false, span: 2 },
];

// ─── API helpers ──────────────────────────────────────────────────────────────
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Poll STK status every 3 s, max 90 s */
async function pollStkStatus(checkoutRequestId, onTick) {
  const MAX = 30;
  for (let i = 0; i < MAX; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const data = await getJSON(
        `${ENDPOINTS.stkStatus}?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`
      );
      if (data.status === "success") return { success: true,  message: data.message };
      if (data.status === "failed")  return { success: false, message: data.message ?? "Payment cancelled." };
      onTick(i + 1);
    } catch { /* keep polling on network hiccup */ }
  }
  return { success: false, message: "Timed out. Use Reconnect below if you were charged." };
}

function formatPhone(raw) {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0"))   return "254" + cleaned.slice(1);
  return "254" + cleaned;
}
function validatePhone(raw) {
  return /^(07|01)\d{8}$/.test(raw.replace(/\s/g, ""));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="w-8 h-8 rounded-full border-[3px] border-indigo-900 border-t-indigo-400 animate-spin mx-auto mb-3" />
  );
}

function StkBanner({ phase, message, sub }) {
  if (phase === "idle") return null;
  const isPending = phase === "pending" || phase === "polling";
  const wrap = isPending
    ? "bg-indigo-950/50 border-indigo-500/25"
    : phase === "success"
    ? "bg-emerald-950/50 border-emerald-500/25"
    : "bg-rose-950/50 border-rose-500/25";
  const textColor = isPending ? "text-indigo-300" : phase === "success" ? "text-emerald-300" : "text-rose-300";

  return (
    <div className={`mt-4 rounded-xl border p-4 text-center ${wrap}`}>
      {isPending ? <Spinner /> : (
        <p className="text-3xl mb-2">{phase === "success" ? "✅" : "❌"}</p>
      )}
      <p className={`font-semibold text-sm tracking-wide ${textColor}`}>{message}</p>
      {sub && <p className="text-xs mt-1 text-gray-500">{sub}</p>}
    </div>
  );
}

function Card({ title, children, animDelay = "0s" }) {
  return (
    <div
      className="relative rounded-2xl border border-indigo-500/10 bg-[#16161E] p-6 mb-4 overflow-hidden opacity-0"
      style={{ animation: `fadeUp 0.55s cubic-bezier(.22,1,.36,1) ${animDelay} forwards` }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="flex items-center gap-3 mb-5">
        <p className="text-[10px] font-bold tracking-[3px] uppercase text-indigo-400">{title}</p>
        <div className="flex-1 h-px bg-indigo-500/10" />
      </div>
      {children}
    </div>
  );
}

function PhoneInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">🇰🇪</span>
      <input
        type="tel"
        maxLength={10}
        placeholder="0712 345 678"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1E1E2A] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-[#F1F0FF] text-sm font-mono outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 placeholder-[#333] transition-all"
      />
    </div>
  );
}

function CodeInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono pointer-events-none select-none tracking-widest">ID</span>
      <input
        type="text"
        maxLength={12}
        placeholder="QAH9QWWZRR"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-full bg-[#1E1E2A] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-[#F1F0FF] text-sm font-mono tracking-widest uppercase outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 placeholder-[#333] transition-all"
      />
    </div>
  );
}

function PkgCard({ pkg, selected, onSelect }) {
  const isSelected = selected === pkg.id;
  return (
    <div
      onClick={() => onSelect(pkg.id)}
      className={[
        "relative rounded-2xl border-[1.5px] p-4 cursor-pointer select-none transition-all duration-200",
        pkg.span === 2 ? "col-span-2" : "",
        isSelected
          ? pkg.popular
            ? "border-amber-400 bg-amber-500/5 shadow-[0_0_0_1px_#F59E0B]"
            : "border-indigo-500 bg-indigo-500/8 shadow-[0_0_0_1px_#6366F1]"
          : "border-indigo-500/15 bg-[#16161E] hover:border-indigo-500/40 hover:-translate-y-0.5 hover:bg-indigo-500/5",
      ].join(" ")}
    >
      {pkg.popular && (
        <span className="absolute top-0 right-0 bg-amber-400 text-black text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-tr-2xl rounded-bl-xl">
          Popular
        </span>
      )}
      <p className={`text-[9px] tracking-[1.5px] uppercase mb-1 font-medium ${
        pkg.popular ? "text-amber-400/70" : isSelected ? "text-indigo-400" : "text-gray-500"
      }`}>
        {pkg.category}
      </p>
      <p className="font-bold text-[17px] text-[#F1F0FF] leading-none mb-1.5" style={{ fontFamily: "'Syne',sans-serif" }}>
        {pkg.label}
      </p>
      <p className={`font-mono text-xl font-medium ${pkg.popular ? "text-amber-400" : "text-indigo-300"}`}>
        KES {pkg.amount}
        <sup className="text-xs font-normal text-gray-500 ml-0.5">/-</sup>
      </p>
      <div className={`absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all duration-200 ${
        isSelected
          ? `opacity-100 scale-100 ${pkg.popular ? "bg-amber-400 text-black" : "bg-indigo-500 text-white"}`
          : "opacity-0 scale-50"
      }`}>✓</div>
    </div>
  );
}

// ─── Main portal ──────────────────────────────────────────────────────────────
export default function VeloNetPortal() {
  const [selectedId, setSelectedId] = useState(null);
  const [phone,      setPhone]      = useState("");
  const [mpesaCode,  setMpesaCode]  = useState("");

  // STK state: idle | pending | polling | success | error
  const [stkPhase,  setStkPhase]  = useState("idle");
  const [stkMsg,    setStkMsg]    = useState("");
  const [stkSub,    setStkSub]    = useState("");
  const [payBusy,   setPayBusy]   = useState(false);

  // Reconnect state: idle | loading | success | error
  const [reconPhase, setReconPhase] = useState("idle");
  const [reconMsg,   setReconMsg]   = useState("");

  const pkg = PACKAGES.find((p) => p.id === selectedId);

  // ── Pay ─────────────────────────────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    if (!pkg)                         return alert("Please select a package.");
    if (!validatePhone(phone))        return alert("Enter a valid Safaricom number (07xx or 01xx).");

    const formattedPhone = formatPhone(phone.replace(/\s/g, ""));
    setPayBusy(true);
    setStkPhase("pending");
    setStkMsg("Sending STK Push to your phone…");
    setStkSub("");

    try {
      const data = await postJSON(ENDPOINTS.stkPush, {
        phone:     formattedPhone,
        amount:    pkg.amount,
        package:   pkg.label,
        packageId: pkg.id,
      });

      // If backend returns checkoutRequestId, poll Safaricom for result
      const checkoutRequestId = data.checkoutRequestId ?? data.CheckoutRequestID;

      if (checkoutRequestId) {
        setStkPhase("polling");
        setStkMsg("Waiting for PIN confirmation…");
        setStkSub("Enter your M-Pesa PIN on your phone");

        const result = await pollStkStatus(checkoutRequestId, (tick) => {
          setStkSub(`Checking… (${tick * 3}s elapsed)`);
        });

        setStkPhase(result.success ? "success" : "error");
        setStkMsg(result.message);
        setStkSub(result.success ? `${pkg.label} · KES ${pkg.amount}` : "Try again or use Reconnect below.");
      } else {
        // Immediate result (no polling)
        setStkPhase(data.success ? "success" : "error");
        setStkMsg(data.message ?? (data.success ? "Payment confirmed! You're connected." : "Payment failed."));
        setStkSub(data.success ? `${pkg.label} · KES ${pkg.amount}` : "Please try again or contact support.");
      }
    } catch (err) {
      setStkPhase("error");
      setStkMsg(err.message ?? "Something went wrong.");
      setStkSub("Check your connection and try again.");
    } finally {
      setPayBusy(false);
    }
  }, [pkg, phone]);

  // ── Reconnect ───────────────────────────────────────────────────────────────
  const handleReconnect = useCallback(async () => {
    const code = mpesaCode.trim().toUpperCase();
    if (code.length < 8) return alert("Enter a valid M-Pesa transaction code (e.g. QAH9QWWZRR).");

    setReconPhase("loading");
    setReconMsg("");
    try {
      const data = await postJSON(ENDPOINTS.reconnect, { mpesa_code: code });
      setReconPhase(data.success ? "success" : "error");
      setReconMsg(data.message ?? (data.success ? "Session restored! You're back online." : "Code not found. Contact support."));
    } catch (err) {
      setReconPhase("error");
      setReconMsg(err.message ?? "Failed to reconnect. Try again.");
    }
  }, [mpesaCode]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
      `}</style>

      <div className="min-h-screen bg-[#0A0A0F] text-[#F1F0FF] relative overflow-x-hidden"
           style={{ fontFamily: "'DM Mono', monospace" }}>

        {/* Ambient glow top-left */}
        <div className="fixed top-0 left-0 w-[480px] h-[480px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 65%)", transform: "translate(-120px,-120px)" }} />
        {/* Ambient glow bottom-right */}
        <div className="fixed bottom-0 right-0 w-[360px] h-[360px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle,rgba(16,185,129,.05) 0%,transparent 65%)", transform: "translate(80px,80px)" }} />

        {/* ── Banner ── */}
        <div className="w-full bg-indigo-600 text-white/90 text-[11px] tracking-[2px] uppercase font-medium text-center py-2 px-4 relative z-10">
          <span className="font-bold text-white">VeloNet</span> by Petley &amp; Co — Nairobi's Premium Fibre Network
        </div>

        <div className="relative z-10 w-full max-w-[480px] mx-auto px-5 pt-9 pb-20">

          {/* ── Brand header ── */}
          <div className="mb-11 opacity-0" style={{ animation: "fadeUp .65s cubic-bezier(.22,1,.36,1) 0s forwards" }}>
            <div className="flex items-center gap-4 mb-1.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-xl shrink-0 shadow-[0_8px_24px_rgba(99,102,241,.3)]">
                ⚡
              </div>
              <div>
                <h1 className="text-[28px] font-extrabold leading-none tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Syne',sans-serif" }}>
                  VeloNet
                </h1>
                <p className="text-[11px] text-gray-500 tracking-[1.5px] uppercase mt-0.5">
                  by <span className="text-indigo-400">Petley &amp; Co</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,.7)]" />
              <span className="text-xs text-emerald-400 tracking-wider">Network Online · High Speed</span>
            </div>
          </div>

          {/* ── How to Connect ── */}
          <Card title="How to Connect" animDelay="0.05s">
            {[
              "Tap your preferred package below",
              <>Tap <span className="text-white font-semibold">Pay Now</span> — an STK Push will arrive on your phone</>,
              "Enter your M-Pesa phone number",
              "Enter your M-Pesa PIN and wait ~30 seconds",
            ].map((text, i) => (
              <div key={i} className={`flex items-start gap-3.5 py-2.5 ${i > 0 ? "border-t border-white/[.04]" : ""}`}>
                <span className="w-6 h-6 rounded-lg bg-[#1E1E2A] border border-indigo-500/20 flex items-center justify-center text-[11px] text-indigo-300 shrink-0 mt-0.5 font-mono">
                  0{i + 1}
                </span>
                <p className="text-[13.5px] text-[#A5A3C0] leading-snug">{text}</p>
              </div>
            ))}
            <a href="tel:+254700323655"
               className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors">
              📞 Customer Care: +254 700 323 655
            </a>
          </Card>

          {/* ── Packages ── */}
          <p className="text-[10px] font-bold tracking-[3px] uppercase text-gray-500 mb-3 opacity-0"
             style={{ animation: "fadeUp .55s cubic-bezier(.22,1,.36,1) .1s forwards" }}>
            Select Package
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-4 opacity-0"
               style={{ animation: "fadeUp .55s cubic-bezier(.22,1,.36,1) .15s forwards" }}>
            {PACKAGES.map((p) => (
              <PkgCard key={p.id} pkg={p} selected={selectedId} onSelect={setSelectedId} />
            ))}
          </div>

          {/* ── Payment ── */}
          <Card title="Pay via M-Pesa" animDelay="0.2s">
            {/* Summary pill */}
            <div className="flex items-center justify-between bg-[#1E1E2A] rounded-xl px-4 py-3.5 mb-5 min-h-[58px]">
              {pkg ? (
                <>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Selected</p>
                    <p className="font-bold text-[15px] text-white" style={{ fontFamily: "'Syne',sans-serif" }}>
                      {pkg.label}
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-medium text-indigo-300">KES {pkg.amount}</p>
                </>
              ) : (
                <p className="text-[13px] text-gray-600 italic">No package selected yet</p>
              )}
            </div>

            <label className="block text-[10px] tracking-[2px] uppercase text-gray-500 font-medium mb-2">
              M-Pesa Phone Number
            </label>
            <div className="mb-5">
              <PhoneInput value={phone} onChange={setPhone} />
            </div>

            <button
              onClick={handlePay}
              disabled={payBusy || !pkg}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-[2px] uppercase text-white
                         bg-gradient-to-r from-indigo-600 to-indigo-400
                         shadow-[0_8px_24px_rgba(99,102,241,.3)]
                         hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(99,102,241,.45)]
                         active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0
                         transition-all duration-200"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              {payBusy ? "Processing…" : "Pay Now"}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[11px] text-gray-500">Secured by</span>
              <span className="bg-emerald-600 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded">M-PESA</span>
              <span className="text-[11px] text-gray-500">STK Push</span>
            </div>

            <StkBanner phase={stkPhase} message={stkMsg} sub={stkSub} />
          </Card>

          {/* ── Reconnect ── */}
          <Card title="Reconnect Session" animDelay="0.28s">
            <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
              Already paid? Paste your M-Pesa transaction code to restore your session.
            </p>
            <label className="block text-[10px] tracking-[2px] uppercase text-gray-500 font-medium mb-2">
              M-Pesa Transaction Code
            </label>
            <CodeInput value={mpesaCode} onChange={setMpesaCode} />

            <button
              onClick={handleReconnect}
              disabled={reconPhase === "loading"}
              className="w-full mt-3.5 py-3.5 rounded-xl border border-white/10 text-gray-400 text-[13px] font-bold tracking-[1.5px] uppercase
                         hover:border-white/20 hover:text-white
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              {reconPhase === "loading" ? "Checking…" : "Reconnect →"}
            </button>

            {reconPhase !== "idle" && reconPhase !== "loading" && (
              <div className={`mt-3 rounded-xl border p-3 text-center text-sm ${
                reconPhase === "success"
                  ? "bg-emerald-950/50 border-emerald-500/25 text-emerald-300"
                  : "bg-rose-950/50 border-rose-500/25 text-rose-300"
              }`}>
                {reconPhase === "success" ? "✅" : "❌"} {reconMsg}
              </div>
            )}
          </Card>

          {/* ── Footer ── */}
          <div className="mt-12 text-center opacity-0" style={{ animation: "fadeUp .55s cubic-bezier(.22,1,.36,1) .35s forwards" }}>
            <p className="text-[11px] text-gray-600 tracking-wide">
              <span className="text-indigo-400 font-semibold">VeloNet</span> Fibre Internet ·
              A <span className="text-indigo-400 font-semibold">Petley &amp; Co</span> Product
            </p>
            <p className="text-[10px] text-[#2E2E3A] mt-1.5 tracking-wider">
              © {new Date().getFullYear()} Petley &amp; Co Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}