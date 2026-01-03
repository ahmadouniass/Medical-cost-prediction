const $ = (id) => document.getElementById(id);

const fmtUSD = (x) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
  } catch {
    return `$${Number(x).toFixed(2)}`;
  }
};

function setStatus(state, text) {
  const el = $("apiStatus");
  const dot = el.querySelector(".dot");
  dot.classList.remove("dot-muted", "dot-ok", "dot-bad");
  dot.classList.add(state === "ok" ? "dot-ok" : state === "bad" ? "dot-bad" : "dot-muted");
  el.querySelector("span:last-child").textContent = text;
}

function normalizeBase(url) {
  return url.replace(/\/+$/, "");
}

function buildHeaders(apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim().length > 0) headers["X-API-Key"] = apiKey.trim();
  return headers;
}

function readPayload() {
  const payload = {
    age: Number($("age").value),
    sex: $("sex").value,
    bmi: Number($("bmi").value),
    children: Number($("children").value),
    smoker: $("smoker").value,
    region: $("region").value
  };
  return payload;
}

function setFormMsg(msg, isError = false) {
  const el = $("formMsg");
  el.textContent = msg || "";
  el.style.color = isError ? "var(--danger)" : "var(--muted)";
}

async function checkHealth(baseUrl) {
  setStatus("muted", "Vérification…");
  try {
    const r = await fetch(`${baseUrl}/health`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    setStatus("ok", j.status === "ok" ? "OK" : "Réponse reçue");
  } catch (e) {
    setStatus("bad", "Injoignable");
  }
}

function setLoading(isLoading) {
  const btn = $("predictBtn");
  if (isLoading) btn.classList.add("loading");
  else btn.classList.remove("loading");
  btn.disabled = isLoading;
}

function setPreview(baseUrl) {
  $("apiBasePreview").textContent = baseUrl || "—";
  $("docsLink").href = baseUrl ? `${baseUrl}/docs` : "#";
}

(function initTheme(){
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  $("themeBtn").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
})();

(function initDefaultApi(){
  // Mets ici ton URL Render par défaut (modifiable par l’utilisateur)
  const defaultBase = "https://medical-cost-prediction-gh3u.onrender.com";
  $("apiBase").value = defaultBase;
  setPreview(defaultBase);
  checkHealth(defaultBase);
})();

$("apiBase").addEventListener("input", (e) => {
  setPreview(e.target.value ? normalizeBase(e.target.value) : "");
});

$("checkHealthBtn").addEventListener("click", () => {
  const base = normalizeBase($("apiBase").value.trim());
  if (!base) return setFormMsg("Renseigne une API Base URL.", true);
  checkHealth(base);
});

$("resetBtn").addEventListener("click", () => {
  $("age").value = 45;
  $("bmi").value = 27.3;
  $("children").value = 2;
  $("sex").value = "female";
  $("smoker").value = "no";
  $("region").value = "northwest";
  $("apiKey").value = "";
  $("resultValue").textContent = "—";
  $("resultHint").textContent = "Lance une prédiction pour afficher le montant.";
  $("payloadPreview").textContent = "{}";
  $("responsePreview").textContent = "{}";
  setFormMsg("");
});

$("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const base = normalizeBase($("apiBase").value.trim());
  if (!base) return setFormMsg("Renseigne une API Base URL valide.", true);

  const apiKey = $("apiKey").value;
  const payload = readPayload();

  $("payloadPreview").textContent = JSON.stringify(payload, null, 2);
  setFormMsg("");

  setLoading(true);
  try {
    const r = await fetch(`${base}/predict`, {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    $("responsePreview").textContent = JSON.stringify(data, null, 2);

    if (!r.ok) {
      const msg = data.detail ? (typeof data.detail === "string" ? data.detail : "Erreur API") : `HTTP ${r.status}`;
      setFormMsg(`Erreur : ${msg}`, true);
      $("resultValue").textContent = "—";
      $("resultHint").textContent = "Corrige le problème puis réessaie.";
      return;
    }

    const y = data.predicted_cost;
    $("resultValue").textContent = fmtUSD(y);
    $("resultHint").textContent = "Prédiction reçue avec succès.";
    setFormMsg("OK — prédiction effectuée.");
    setStatus("ok", "OK");
  } catch (err) {
    setFormMsg("Impossible de contacter l’API. Vérifie l’URL ou le CORS.", true);
    setStatus("bad", "Injoignable");
  } finally {
    setLoading(false);
  }
});
