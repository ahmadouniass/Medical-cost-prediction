const $ = (id) => document.getElementById(id);

// Configuration
const API_BASE_URL = "https://medical-cost-prediction-gh3u.onrender.com";
let currentResults = [];

// Utilities
const fmtUSD = (x) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
  } catch {
    return `${Number(x).toFixed(2)}`;
  }
};

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  const apiKey = $("apiKey").value;
  if (apiKey && apiKey.trim().length > 0) {
    headers["X-API-Key"] = apiKey.trim();
  }
  return headers;
}

function setStatus(state, text) {
  const el = $("apiStatus");
  const dot = el.querySelector(".dot");
  dot.classList.remove("dot-muted", "dot-ok", "dot-bad");
  dot.classList.add(state === "ok" ? "dot-ok" : state === "bad" ? "dot-bad" : "dot-muted");
  el.querySelector("span:last-child").textContent = text;
}

function setFormMsg(msg, isError = false) {
  const el = $("formMsg");
  el.textContent = msg || "";
  el.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function setLoading(btnId, isLoading) {
  const btn = $(btnId);
  if (isLoading) btn.classList.add("loading");
  else btn.classList.remove("loading");
  btn.disabled = isLoading;
}

async function checkHealth() {
  setStatus("muted", "Vérification…");
  try {
    const r = await fetch(`${API_BASE_URL}/health`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    setStatus("ok", j.status === "ok" ? "OK" : "Réponse reçue");
  } catch (e) {
    setStatus("bad", "Injoignable");
  }
}

// Validation functions
function validateAge(age) {
  const n = Number(age);
  if (isNaN(n) || n < 0 || n > 120) {
    return { valid: false, error: "Âge doit être entre 0 et 120" };
  }
  return { valid: true, value: n };
}

function validateBMI(bmi) {
  const n = Number(bmi);
  if (isNaN(n) || n < 10 || n > 60) {
    return { valid: false, error: "BMI doit être entre 10 et 60" };
  }
  return { valid: true, value: n };
}

function validateChildren(children) {
  const n = Number(children);
  if (isNaN(n) || n < 0 || n > 20) {
    return { valid: false, error: "Enfants doit être entre 0 et 20" };
  }
  return { valid: true, value: Math.floor(n) };
}

function validateSex(sex) {
  if (!["male", "female"].includes(sex)) {
    return { valid: false, error: "Sexe doit être 'male' ou 'female'" };
  }
  return { valid: true, value: sex };
}

function validateSmoker(smoker) {
  if (!["yes", "no"].includes(smoker)) {
    return { valid: false, error: "Fumeur doit être 'yes' ou 'no'" };
  }
  return { valid: true, value: smoker };
}

function validateRegion(region) {
  const validRegions = ["northwest", "northeast", "southwest", "southeast"];
  if (!validRegions.includes(region)) {
    return { valid: false, error: "Région invalide" };
  }
  return { valid: true, value: region };
}

function validatePayload(data) {
  const errors = [];
  
  const ageCheck = validateAge(data.age);
  if (!ageCheck.valid) errors.push(ageCheck.error);
  
  const bmiCheck = validateBMI(data.bmi);
  if (!bmiCheck.valid) errors.push(bmiCheck.error);
  
  const childrenCheck = validateChildren(data.children);
  if (!childrenCheck.valid) errors.push(childrenCheck.error);
  
  const sexCheck = validateSex(data.sex);
  if (!sexCheck.valid) errors.push(sexCheck.error);
  
  const smokerCheck = validateSmoker(data.smoker);
  if (!smokerCheck.valid) errors.push(smokerCheck.error);
  
  const regionCheck = validateRegion(data.region);
  if (!regionCheck.valid) errors.push(regionCheck.error);
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    payload: {
      age: ageCheck.value,
      bmi: bmiCheck.value,
      children: childrenCheck.value,
      sex: sexCheck.value,
      smoker: smokerCheck.value,
      region: regionCheck.value
    }
  };
}

// Tab management
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      
      tab.classList.add("active");
      document.getElementById(`tab-${targetId}`).classList.add("active");
      
      // Reset displays
      $("singleResult").style.display = "block";
      $("multipleResults").style.display = "none";
    });
  });
}

// Single Prediction
function resetSingleForm() {
  $("age").value = 45;
  $("bmi").value = 27.3;
  $("children").value = 2;
  $("sex").value = "female";
  $("smoker").value = "no";
  $("region").value = "northwest";
  $("resultValue").textContent = "—";
  $("resultHint").textContent = "Lance une prédiction pour afficher le montant.";
  $("payloadPreview").textContent = "{}";
  $("responsePreview").textContent = "{}";
  setFormMsg("");
}

async function handleSinglePrediction(e) {
  e.preventDefault();
  
  const payload = {
    age: $("age").value,
    sex: $("sex").value,
    bmi: $("bmi").value,
    children: $("children").value,
    smoker: $("smoker").value,
    region: $("region").value
  };
  
  const validation = validatePayload(payload);
  if (!validation.valid) {
    setFormMsg(`Erreurs de validation: ${validation.errors.join(", ")}`, true);
    return;
  }
  
  $("payloadPreview").textContent = JSON.stringify(validation.payload, null, 2);
  setFormMsg("");
  
  setLoading("predictSingleBtn", true);
  
  try {
    const r = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(validation.payload),
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
    setFormMsg("OK – prédiction effectuée.");
    setStatus("ok", "OK");
  } catch (err) {
    setFormMsg("Impossible de contacter l'API. Vérifie l'URL ou le CORS.", true);
    setStatus("bad", "Injoignable");
  } finally {
    setLoading("predictSingleBtn", false);
  }
}

// Multiple Predictions
let personCounter = 0;

function createPersonEntry() {
  personCounter++;
  const id = `person-${personCounter}`;
  
  const html = `
    <div class="person-entry" id="${id}">
      <div class="person-header">
        <div class="person-title">Personne #${personCounter}</div>
        <button type="button" class="btn-remove-person" onclick="removePersonEntry('${id}')">Supprimer</button>
      </div>
      
      <div class="grid-3">
        <div class="field">
          <label>Âge</label>
          <input type="number" name="age" min="0" max="120" value="45" required />
        </div>
        <div class="field">
          <label>BMI</label>
          <input type="number" name="bmi" step="0.1" min="10" max="60" value="27.3" required />
        </div>
        <div class="field">
          <label>Enfants</label>
          <input type="number" name="children" min="0" max="20" value="2" required />
        </div>
      </div>
      
      <div class="grid-3">
        <div class="field">
          <label>Sexe</label>
          <select name="sex" required>
            <option value="female" selected>female</option>
            <option value="male">male</option>
          </select>
        </div>
        <div class="field">
          <label>Fumeur</label>
          <select name="smoker" required>
            <option value="no" selected>no</option>
            <option value="yes">yes</option>
          </select>
        </div>
        <div class="field">
          <label>Région</label>
          <select name="region" required>
            <option value="northwest" selected>northwest</option>
            <option value="northeast">northeast</option>
            <option value="southwest">southwest</option>
            <option value="southeast">southeast</option>
          </select>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

function addPersonEntry() {
  const container = $("personEntries");
  const html = createPersonEntry();
  container.insertAdjacentHTML("beforeend", html);
}

function removePersonEntry(id) {
  const entry = $(id);
  if (entry) {
    entry.remove();
  }
}

function resetMultipleForm() {
  $("personEntries").innerHTML = "";
  personCounter = 0;
  addPersonEntry();
}

function getMultiplePayloads() {
  const entries = document.querySelectorAll(".person-entry");
  const payloads = [];
  const errors = [];
  
  entries.forEach((entry, index) => {
    const data = {
      age: entry.querySelector('[name="age"]').value,
      sex: entry.querySelector('[name="sex"]').value,
      bmi: entry.querySelector('[name="bmi"]').value,
      children: entry.querySelector('[name="children"]').value,
      smoker: entry.querySelector('[name="smoker"]').value,
      region: entry.querySelector('[name="region"]').value
    };
    
    const validation = validatePayload(data);
    if (!validation.valid) {
      errors.push(`Personne #${index + 1}: ${validation.errors.join(", ")}`);
    } else {
      payloads.push(validation.payload);
    }
  });
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true, payloads };
}

async function handleMultiplePredictions(e) {
  e.preventDefault();
  
  const result = getMultiplePayloads();
  if (!result.valid) {
    setFormMsg(`Erreurs: ${result.errors.join(" | ")}`, true);
    return;
  }
  
  $("payloadPreview").textContent = JSON.stringify(result.payloads, null, 2);
  setFormMsg("");
  
  setLoading("predictMultipleBtn", true);
  currentResults = [];
  
  try {
    const promises = result.payloads.map(payload => 
      fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      }).then(r => r.json())
    );
    
    const responses = await Promise.all(promises);
    
    $("responsePreview").textContent = JSON.stringify(responses, null, 2);
    
    // Display results in table
    currentResults = result.payloads.map((payload, i) => ({
      ...payload,
      predicted_cost: responses[i].predicted_cost
    }));
    
    displayResultsTable(currentResults);
    
    $("singleResult").style.display = "none";
    $("multipleResults").style.display = "block";
    
    setFormMsg(`${currentResults.length} prédictions effectuées avec succès.`);
    setStatus("ok", "OK");
  } catch (err) {
    setFormMsg("Erreur lors des prédictions multiples.", true);
    setStatus("bad", "Erreur");
  } finally {
    setLoading("predictMultipleBtn", false);
  }
}

function displayResultsTable(results) {
  const tbody = $("resultsTableBody");
  tbody.innerHTML = "";
  
  results.forEach((result, i) => {
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${result.age}</td>
        <td>${result.sex}</td>
        <td>${result.bmi}</td>
        <td>${result.children}</td>
        <td>${result.smoker}</td>
        <td>${result.region}</td>
        <td><strong>${fmtUSD(result.predicted_cost)}</strong></td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

function clearResults() {
  currentResults = [];
  $("multipleResults").style.display = "none";
  $("singleResult").style.display = "block";
  $("resultValue").textContent = "—";
  $("resultHint").textContent = "Lance une prédiction pour afficher le montant.";
}

function exportToCSV() {
  if (currentResults.length === 0) return;
  
  const headers = ["age", "sex", "bmi", "children", "smoker", "region", "predicted_cost"];
  const rows = currentResults.map(r => 
    headers.map(h => r[h]).join(",")
  );
  
  const csv = [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `predictions_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// File Upload
let uploadedFileData = null;
let fileColumns = [];

function initFileUpload() {
  const fileInput = $("csvFile");
  const fileUpload = $("fileUpload");
  
  fileInput.addEventListener("change", handleFileSelect);
  
  // Drag and drop
  fileUpload.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileUpload.classList.add("dragover");
  });
  
  fileUpload.addEventListener("dragleave", () => {
    fileUpload.classList.remove("dragover");
  });
  
  fileUpload.addEventListener("drop", (e) => {
    e.preventDefault();
    fileUpload.classList.remove("dragover");
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect();
    }
  });
}

async function handleFileSelect() {
  const fileInput = $("csvFile");
  const file = fileInput.files[0];
  
  if (!file) return;
  
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["csv", "xlsx", "json"].includes(ext)) {
    setFormMsg("Format non supporté. Utilise CSV, XLSX ou JSON.", true);
    return;
  }
  
  $("fileName").textContent = file.name;
  $("fileSize").textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
  $("fileInfo").style.display = "block";
  
  try {
    if (ext === "csv") {
      await parseCSVFile(file);
    } else if (ext === "xlsx") {
      await parseExcelFile(file);
    } else if (ext === "json") {
      await parseJSONFile(file);
    }
  } catch (err) {
    setFormMsg(`Erreur de lecture: ${err.message}`, true);
  }
}

async function parseCSVFile(file) {
  const text = await file.text();
  const lines = text.trim().split("\n");
  
  if (lines.length < 2) {
    throw new Error("Le fichier doit contenir au moins une ligne d'en-têtes et une ligne de données.");
  }
  
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < Math.min(lines.length, 101); i++) {
    const values = lines[i].split(",").map(v => v.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, j) => {
        row[h] = values[j];
      });
      rows.push(row);
    }
  }
  
  uploadedFileData = { headers, rows, totalRows: lines.length - 1 };
  fileColumns = headers;
  
  showColumnMapping();
  displayDataPreview(headers, rows.slice(0, 5));
}

async function parseExcelFile(file) {
  setFormMsg("Chargement du fichier Excel...");
  
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  
  if (jsonData.length === 0) {
    throw new Error("Le fichier Excel est vide.");
  }
  
  const headers = Object.keys(jsonData[0]);
  const rows = jsonData.slice(0, 100);
  
  uploadedFileData = { headers, rows, totalRows: jsonData.length, fullData: jsonData };
  fileColumns = headers;
  
  showColumnMapping();
  displayDataPreview(headers, rows.slice(0, 5));
  setFormMsg("");
}

async function parseJSONFile(file) {
  const text = await file.text();
  const jsonData = JSON.parse(text);
  
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error("Le JSON doit être un tableau d'objets.");
  }
  
  const headers = Object.keys(jsonData[0]);
  const rows = jsonData.slice(0, 100);
  
  uploadedFileData = { headers, rows, totalRows: jsonData.length, fullData: jsonData };
  fileColumns = headers;
  
  showColumnMapping();
  displayDataPreview(headers, rows.slice(0, 5));
}

function showColumnMapping() {
  $("columnMapping").style.display = "block";
  $("validateDataBtn").style.display = "inline-flex";
  
  // Populate column selects
  const selects = ["col-age", "col-sex", "col-bmi", "col-children", "col-smoker", "col-region"];
  selects.forEach(selectId => {
    const select = $(selectId);
    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    fileColumns.forEach(col => {
      select.innerHTML += `<option value="${col}">${col}</option>`;
    });
  });
  
  // Try auto-mapping
  autoMapColumns();
}

function autoMapColumns() {
  const mapping = {
    "col-age": ["age", "Age", "AGE", "age_years"],
    "col-sex": ["sex", "Sex", "SEX", "gender", "Gender", "sexe"],
    "col-bmi": ["bmi", "BMI", "Bmi", "body_mass_index"],
    "col-children": ["children", "Children", "CHILDREN", "kids", "enfants"],
    "col-smoker": ["smoker", "Smoker", "SMOKER", "smoking", "fumeur"],
    "col-region": ["region", "Region", "REGION", "area", "zone"]
  };
  
  Object.entries(mapping).forEach(([selectId, possibleNames]) => {
    const select = $(selectId);
    for (const name of possibleNames) {
      if (fileColumns.includes(name)) {
        select.value = name;
        break;
      }
    }
  });
  
  setFormMsg("Mapping automatique effectué. Vérifie les correspondances.", false);
}

function displayDataPreview(headers, rows) {
  const thead = $("previewTableHead");
  const tbody = $("previewTableBody");
  
  // Headers
  thead.innerHTML = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
  
  // Rows
  tbody.innerHTML = "";
  rows.forEach(row => {
    const tr = "<tr>" + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>";
    tbody.insertAdjacentHTML("beforeend", tr);
  });
  
  $("previewSubtitle").textContent = `${rows.length} premières lignes (${uploadedFileData.totalRows} total)`;
}

function validateFileData() {
  const columnMap = {
    age: $("col-age").value,
    sex: $("col-sex").value,
    bmi: $("col-bmi").value,
    children: $("col-children").value,
    smoker: $("col-smoker").value,
    region: $("col-region").value
  };
  
  // Check all columns are selected
  const missing = Object.entries(columnMap).filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    setFormMsg(`Colonnes manquantes: ${missing.join(", ")}`, true);
    return;
  }
  
  // Perform data quality check
  const qualityResults = performQualityCheck(columnMap);
  displayQualityResults(qualityResults);
  
  if (qualityResults.errors === 0) {
    $("predictFileBtn").disabled = false;
    setFormMsg(`✓ Validation réussie! ${uploadedFileData.totalRows} lignes prêtes.`, false);
  } else {
    setFormMsg(`⚠ ${qualityResults.errors} erreurs détectées. Corrige-les avant de continuer.`, true);
  }
}

function performQualityCheck(columnMap) {
  const results = {
    checks: [],
    errors: 0,
    warnings: 0
  };
  
  const data = uploadedFileData.fullData || uploadedFileData.rows;
  
  // Check Age
  const ages = data.map(row => Number(row[columnMap.age]));
  const validAges = ages.filter(a => !isNaN(a) && a >= 0 && a <= 120).length;
  results.checks.push({
    field: "Âge",
    status: validAges === ages.length ? "success" : (validAges / ages.length > 0.9 ? "warning" : "error"),
    message: `${validAges}/${ages.length} valides (0-120)`
  });
  if (validAges < ages.length) results.errors++;
  
  // Check BMI
  const bmis = data.map(row => Number(row[columnMap.bmi]));
  const validBmis = bmis.filter(b => !isNaN(b) && b >= 10 && b <= 60).length;
  results.checks.push({
    field: "BMI",
    status: validBmis === bmis.length ? "success" : (validBmis / bmis.length > 0.9 ? "warning" : "error"),
    message: `${validBmis}/${bmis.length} valides (10-60)`
  });
  if (validBmis < bmis.length) results.errors++;
  
  // Check Children
  const children = data.map(row => Number(row[columnMap.children]));
  const validChildren = children.filter(c => !isNaN(c) && c >= 0 && c <= 20).length;
  results.checks.push({
    field: "Enfants",
    status: validChildren === children.length ? "success" : "warning",
    message: `${validChildren}/${children.length} valides (0-20)`
  });
  if (validChildren < children.length) results.warnings++;
  
  // Check Sex
  const sexes = data.map(row => row[columnMap.sex]?.toLowerCase());
  const validSexes = sexes.filter(s => ["male", "female"].includes(s)).length;
  results.checks.push({
    field: "Sexe",
    status: validSexes === sexes.length ? "success" : "error",
    message: `${validSexes}/${sexes.length} valides (male/female)`
  });
  if (validSexes < sexes.length) results.errors++;
  
  // Check Smoker
  const smokers = data.map(row => row[columnMap.smoker]?.toLowerCase());
  const validSmokers = smokers.filter(s => ["yes", "no"].includes(s)).length;
  results.checks.push({
    field: "Fumeur",
    status: validSmokers === smokers.length ? "success" : "error",
    message: `${validSmokers}/${smokers.length} valides (yes/no)`
  });
  if (validSmokers < smokers.length) results.errors++;
  
  // Check Region
  const regions = data.map(row => row[columnMap.region]?.toLowerCase());
  const validRegions = regions.filter(r => ["northwest", "northeast", "southwest", "southeast"].includes(r)).length;
  results.checks.push({
    field: "Région",
    status: validRegions === regions.length ? "success" : "error",
    message: `${validRegions}/${regions.length} valides (4 régions US)`
  });
  if (validRegions < regions.length) results.errors++;
  
  return results;
}

function displayQualityResults(results) {
  const container = $("qualityResults");
  container.innerHTML = "";
  
  results.checks.forEach(check => {
    const html = `
      <div class="quality-item ${check.status}">
        <div>
          <div class="quality-label">${check.field}</div>
          <div class="quality-value">${check.message}</div>
        </div>
        <div class="quality-badge ${check.status}">
          ${check.status === "success" ? "✓" : check.status === "warning" ? "⚠" : "✗"}
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  });
  
  $("dataQualityCheck").style.display = "block";
}

function removeFile() {
  $("csvFile").value = "";
  $("fileInfo").style.display = "none";
  $("columnMapping").style.display = "none";
  $("dataQualityCheck").style.display = "none";
  $("predictFileBtn").disabled = true;
  $("validateDataBtn").style.display = "none";
  uploadedFileData = null;
  fileColumns = [];
}

async function handleFilePrediction(e) {
  e.preventDefault();
  
  const fileInput = $("csvFile");
  const file = fileInput.files[0];
  
  if (!file) {
    setFormMsg("Sélectionne un fichier CSV.", true);
    return;
  }
  
  setLoading("predictFileBtn", true);
  setFormMsg("");
  
  try {
    const text = await file.text();
    const data = parseCSV(text);
    
    // Validate all entries
    const errors = [];
    const validPayloads = [];
    
    data.forEach((entry, i) => {
      const validation = validatePayload(entry);
      if (!validation.valid) {
        errors.push(`Ligne ${i + 2}: ${validation.errors.join(", ")}`);
      } else {
        validPayloads.push(validation.payload);
      }
    });
    
    if (errors.length > 0) {
      setFormMsg(`Erreurs de validation: ${errors.slice(0, 3).join(" | ")}${errors.length > 3 ? "..." : ""}`, true);
      setLoading("predictFileBtn", false);
      return;
    }
    
    $("payloadPreview").textContent = JSON.stringify(validPayloads, null, 2);
    
    // Make predictions
    const promises = validPayloads.map(payload => 
      fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      }).then(r => r.json())
    );
    
    const responses = await Promise.all(promises);
    
    $("responsePreview").textContent = JSON.stringify(responses, null, 2);
    
    currentResults = validPayloads.map((payload, i) => ({
      ...payload,
      predicted_cost: responses[i].predicted_cost
    }));
    
    displayResultsTable(currentResults);
    
    $("singleResult").style.display = "none";
    $("multipleResults").style.display = "block";
    
    setFormMsg(`${currentResults.length} prédictions effectuées depuis le CSV.`);
    setStatus("ok", "OK");
  } catch (err) {
    setFormMsg(`Erreur: ${err.message}`, true);
  } finally {
    setLoading("predictFileBtn", false);
  }
}

// Theme
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  $("themeBtn").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  initFileUpload();
  
  // Set API info
  $("apiBase").value = API_BASE_URL;
  $("apiBasePreview").textContent = API_BASE_URL;
  $("docsLink").href = `${API_BASE_URL}/docs`;
  
  // Check health
  checkHealth();
  
  // Initialize with one person entry for multiple mode
  addPersonEntry();
  
  // Event listeners
  $("checkHealthBtn").addEventListener("click", checkHealth);
  $("singleForm").addEventListener("submit", handleSinglePrediction);
  $("multipleForm").addEventListener("submit", handleMultiplePredictions);
  $("fileForm").addEventListener("submit", handleFilePrediction);
});

function nudgeTabsBar() {
  const el = document.getElementById("tabsBar");
  if (!el) return;

  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) return;

  const start = el.scrollLeft;
  el.scrollLeft = Math.min(start + 60, maxScroll);

  setTimeout(() => {
    el.scrollLeft = start;
  }, 250);
}

document.addEventListener("DOMContentLoaded", () => {
  centerTabsBar();   // optionnel
  nudgeTabsBar();    // optionnel mais très efficace
});
