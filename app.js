/* ===================== Configuração ===================== */

const STORAGE_KEY = "gestaoLojas3D_v1";

const STORE_META = [
  { key: "shopee", label: "Shopee", color: "#EE4D2D" },
  { key: "ml", label: "Mercado Livre", color: "#FFC400" },
  { key: "tiktok", label: "TikTok Shop", color: "#111111" },
];

const PRINTERS = ["A1", "A1 mini"];
const TIPOS = ["Impressão 3D", "Revenda"];

/* ===================== Estado ===================== */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultState() {
  const fil1 = uid(), fil2 = uid(), fil3 = uid();
  const exampleProduct = (impressora, filamentoId, data) => ({
    id: uid(),
    example: true,
    produto: "(exemplo) Vaso Geométrico P",
    data,
    tipo: "Impressão 3D",
    impressora,
    filamentoId,
    precoVenda: 45.0,
    recebido: 38.7,
    taxaME: false,
    peso: 120,
    tempo: 3.5,
    embalagem: 2.0,
    gastoLevar: 1.0,
  });

  return {
    filaments: [
      { id: fil1, nome: "PLA Preto Genérico", preco: 79.9, obs: "exemplo — edite ou apague" },
      { id: fil2, nome: "PLA Branco Voolt", preco: 94.9, obs: "exemplo — edite ou apague" },
      { id: fil3, nome: "PETG Preto Bambu Lab", preco: 129.9, obs: "exemplo — edite ou apague" },
    ],
    params: {
      potA1: 120,
      potA1Mini: 70,
      tarifa: 0.7894,
    },
    profile: {
      nome: "Gestão de Lojas",
      icone: null,
    },
    stores: {
      shopee: [exampleProduct("A1", fil1, "2026-06-15")],
      ml: [exampleProduct("A1 mini", fil2, "2026-07-10")],
      tiktok: [exampleProduct("A1", fil3, "2026-08-05")],
    },
  };
}

// state começa com um placeholder; só é usado de verdade depois que init() carrega
// os dados reais do banco (IndexedDB) — ver seção "Banco de dados local" mais abaixo.
let state = defaultState();

function normalizeState(parsed) {
  STORE_META.forEach(s => { if (!parsed.stores[s.key]) parsed.stores[s.key] = []; });
  if (!parsed.profile) parsed.profile = { nome: "Gestão de Lojas", icone: null };
  return parsed;
}

// junta os produtos de todas as lojas num só array, marcando de qual loja cada um veio
function allRows() {
  const out = [];
  STORE_META.forEach(meta => {
    state.stores[meta.key].forEach(row => out.push(Object.assign({ _storeKey: meta.key, _storeLabel: meta.label, _storeColor: meta.color }, row)));
  });
  return out;
}

function saveState() {
  dbSaveState(state).catch(e => {
    console.error("Falha ao salvar no banco de dados local.", e);
    showToast("⚠ Não foi possível salvar. Exporte um backup para não perder dados.");
  });
}

/* ===================== Banco de dados local (IndexedDB) =====================
   Antes os dados ficavam só numa string no localStorage. Agora usamos o IndexedDB,
   que é um banco de dados de verdade dentro do navegador: transacional, com muito
   mais espaço de armazenamento e mais confiável para guardar tudo isso a longo prazo.
   Continua 100% local (sem servidor) e continua funcionando no GitHub Pages.
   Essa camada foi isolada de propósito: quando virarmos isso num app instalável,
   é aqui (e só aqui) que trocaríamos IndexedDB por SQLite, sem mexer no resto do código. */

const DB_NAME = "gestaoLojas3D";
const DB_VERSION = 1;
const DB_STORE = "state";
const DB_KEY = "app";

let dbPromise = null;

function openDatabase() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB não suportado neste navegador."));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Migra dados antigos salvos em localStorage (versões anteriores do site) para o
// IndexedDB, na primeira vez que o app abrir com o banco novo. Não apaga o backup
// antigo do localStorage — ele só deixa de ser usado.
function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (e) {
    console.error("Não foi possível ler dados antigos do localStorage.", e);
    return null;
  }
}

async function dbSaveState(value) {
  try {
    const db = await openDatabase();
    await idbPut(db, DB_KEY, value);
  } catch (e) {
    // navegador sem suporte a IndexedDB (ou bloqueado) — usa localStorage como plano B
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}

// Carrega o estado salvo: tenta o IndexedDB primeiro; se não houver nada lá,
// tenta migrar do localStorage antigo; se não houver suporte a IndexedDB
// (navegador muito antigo/restrito), cai de volta para o localStorage puro.
async function dbLoadState() {
  try {
    const db = await openDatabase();
    const saved = await idbGet(db, DB_KEY);
    if (saved) return normalizeState(saved);

    const migrated = migrateFromLocalStorage();
    if (migrated) {
      await idbPut(db, DB_KEY, migrated);
      return migrated;
    }
    return defaultState();
  } catch (e) {
    console.error("IndexedDB indisponível, usando localStorage como alternativa.", e);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  }
}

/* ===================== Utilitários numéricos ===================== */

function n(v) {
  const num = parseFloat(v);
  return isNaN(num) ? 0 : num;
}

function hasVal(v) {
  return v !== "" && v !== null && v !== undefined && !isNaN(parseFloat(v));
}

function fmtCurrency(v) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPercent(v) {
  return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

/* ===================== Cálculos ===================== */

function getFilamentPrice(filamentoId) {
  const f = state.filaments.find(f => f.id === filamentoId);
  return f ? n(f.preco) : 0;
}

function getPrinterPower(impressora) {
  if (impressora === "A1") return n(state.params.potA1);
  if (impressora === "A1 mini") return n(state.params.potA1Mini);
  return 0;
}

function calcRow(row) {
  const precoVenda = hasVal(row.precoVenda) ? n(row.precoVenda) : null;
  const recebido = hasVal(row.recebido) ? n(row.recebido) : null;

  const taxaRS = precoVenda !== null && recebido !== null ? precoVenda - recebido : null;
  const taxaPct = taxaRS !== null && precoVenda ? taxaRS / precoVenda : null;

  const custoFilamento = n(row.peso) / 1000 * getFilamentPrice(row.filamentoId);
  const custoEnergia = n(row.tempo) * (getPrinterPower(row.impressora) / 1000) * n(state.params.tarifa);
  const embalagem = n(row.embalagem);
  const gastoLevar = n(row.gastoLevar);
  // taxa opcional de 4% (ME) sobre o preço de venda — usada nas lojas em que você vende como ME
  const custoTaxaME = row.taxaME ? n(row.precoVenda) * 0.04 : 0;

  const custoTotal = custoFilamento + custoEnergia + embalagem + gastoLevar + custoTaxaME;
  const lucro = recebido !== null ? recebido - custoTotal : null;
  const margem = lucro !== null && precoVenda ? lucro / precoVenda : null;

  return { taxaRS, taxaPct, custoFilamento, custoEnergia, custoTaxaME, custoTotal, lucro, margem };
}

/* ===================== Navegação ===================== */

let activeTab = "filamentos";

function renderNav() {
  const nav = document.getElementById("nav");
  const items = [];

  items.push(navGroupLabel("Produção"));
  items.push(navItem("filamentos", "Filamentos", "◆"));
  items.push(navItem("parametros", "Parâmetros", "⚙"));

  items.push(navGroupLabel("Lojas"));
  STORE_META.forEach(s => items.push(navItem(s.key, s.label, null, s.color)));

  items.push(navGroupLabel("Visão Geral"));
  items.push(navItem("resumo", "Resumo", "▤"));
  items.push(navItem("kpis", "KPIs", "▲"));

  items.push(navGroupLabel("Conta"));
  items.push(navItem("perfil", "Perfil", "◐"));

  nav.innerHTML = items.join("");

  nav.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderNav();
      renderContent();
    });
  });
}

function navGroupLabel(text) {
  return `<div class="nav-group-label">${text}</div>`;
}

function navItem(key, label, icon, color) {
  const active = key === activeTab ? "active" : "";
  const marker = color
    ? `<span class="nav-dot" style="background:${color}"></span>`
    : `<span style="width:16px;text-align:center;color:#8F98A1;">${icon}</span>`;
  return `<button class="nav-item ${active}" data-tab="${key}" title="${label}">${marker}<span class="nav-label">${label}</span></button>`;
}

/* ===================== Render: conteúdo principal ===================== */

function renderContent() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  if (activeTab === "filamentos") content.appendChild(renderFilamentsPanel());
  else if (activeTab === "parametros") content.appendChild(renderParamsPanel());
  else if (activeTab === "resumo") content.appendChild(renderResumoPanel());
  else if (activeTab === "kpis") content.appendChild(renderKpisPanel());
  else if (activeTab === "perfil") content.appendChild(renderPerfilPanel());
  else content.appendChild(renderStorePanel(activeTab));
}

/* ---------- Filamentos ---------- */

function renderFilamentsPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Filamentos</h1>
        <p class="panel-sub">Cadastre cada filamento que você compra com o preço por kg. Eles aparecem no seletor de cada produto.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" id="fil-add">+ Novo filamento</button>
      </div>
    </header>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Filamento (material + cor)</th>
            <th class="num">Preço por Kg (R$)</th>
            <th>Observações</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="fil-body"></tbody>
      </table>
    </div>
  `;

  const tbody = panel.querySelector("#fil-body");
  if (state.filaments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">Nenhum filamento cadastrado ainda.</div></td></tr>`;
  } else {
    state.filaments.forEach(f => tbody.appendChild(filamentRow(f)));
  }

  panel.querySelector("#fil-add").addEventListener("click", () => {
    state.filaments.push({ id: uid(), nome: "", preco: 0, obs: "" });
    saveState();
    renderContent();
  });

  return panel;
}

function filamentRow(f) {
  const tr = document.createElement("tr");
  if (f.obs && f.obs.includes("exemplo")) tr.classList.add("example-row");
  tr.innerHTML = `
    <td><input type="text" value="${escapeAttr(f.nome)}" data-field="nome" placeholder="Ex: PLA Vermelho"></td>
    <td class="num"><input type="number" step="0.01" value="${f.preco}" data-field="preco"></td>
    <td><input type="text" value="${escapeAttr(f.obs || "")}" data-field="obs" placeholder="opcional"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  tr.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      f[field] = field === "preco" ? n(input.value) : input.value;
      saveState();
      // recalcula colunas de custo de filamento em todas as lojas, sem redesenhar tudo
      recalcAllStoreTables();
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover o filamento "${f.nome || "(sem nome)"}"? Produtos que usam ele ficarão sem filamento selecionado.`)) return;
    state.filaments = state.filaments.filter(x => x.id !== f.id);
    saveState();
    renderContent();
  });

  return tr;
}

/* ---------- Parâmetros ---------- */

function renderParamsPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Parâmetros</h1>
        <p class="panel-sub">Valem para todas as lojas. Usados para calcular o custo de energia de cada peça impressa.</p>
      </div>
    </header>
    <div class="param-grid">
      <div class="param-card">
        <label>Potência Bambu Lab A1</label>
        <div class="unit-input">
          <input type="number" step="1" id="p-a1" value="${state.params.potA1}">
          <span class="unit">W</span>
        </div>
        <p class="param-note">Consumo médio durante a impressão (não a potência máxima da fonte). Confirme com um wattímetro se possível.</p>
      </div>
      <div class="param-card">
        <label>Potência Bambu Lab A1 mini</label>
        <div class="unit-input">
          <input type="number" step="1" id="p-a1mini" value="${state.params.potA1Mini}">
          <span class="unit">W</span>
        </div>
        <p class="param-note">A A1 mini consome menos que a A1 por ter mesa e volume de impressão menores.</p>
      </div>
      <div class="param-card">
        <label>Tarifa de Energia</label>
        <div class="unit-input">
          <input type="number" step="0.0001" id="p-tarifa" value="${state.params.tarifa}">
          <span class="unit">R$/kWh</span>
        </div>
        <p class="param-note">Tarifa base Enel SP (TUSD+TE), vigente desde 04/07/2026, sem impostos. Sua conta de luz mostra o valor real (geralmente entre R$ 0,90 e R$ 1,05 em SP capital) — recomendamos usar esse valor.</p>
      </div>
    </div>
  `;

  panel.querySelector("#p-a1").addEventListener("input", e => {
    state.params.potA1 = n(e.target.value);
    saveState();
    recalcAllStoreTables();
  });
  panel.querySelector("#p-a1mini").addEventListener("input", e => {
    state.params.potA1Mini = n(e.target.value);
    saveState();
    recalcAllStoreTables();
  });
  panel.querySelector("#p-tarifa").addEventListener("input", e => {
    state.params.tarifa = n(e.target.value);
    saveState();
    recalcAllStoreTables();
  });

  return panel;
}

/* ---------- Lojas ---------- */

function renderStorePanel(storeKey) {
  const meta = STORE_META.find(s => s.key === storeKey);
  const tpl = document.getElementById("tpl-store");
  const node = tpl.content.cloneNode(true);
  const section = node.querySelector(".panel");

  const title = node.querySelector(".store-title");
  title.innerHTML = `<span class="store-dot" style="background:${meta.color}"></span>${meta.label} — Gestão de Produtos`;

  const tbody = node.querySelector("tbody");
  const rows = state.stores[storeKey];

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="21"><div class="empty-state">Nenhum produto cadastrado ainda. Clique em "Novo produto".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(row => tbody.appendChild(storeRow(storeKey, row)));
  }

  node.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    state.stores[storeKey].push({
      id: uid(), example: false, produto: "", data: new Date().toISOString().slice(0, 10), tipo: "Impressão 3D", impressora: "",
      filamentoId: "", precoVenda: "", recebido: "", taxaME: false, peso: "", tempo: "", embalagem: "", gastoLevar: "",
    });
    saveState();
    renderContent();
  });

  node.querySelector('[data-action="export-csv"]').addEventListener("click", () => exportStoreCSV(storeKey));

  return section;
}

function storeRow(storeKey, row) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = row.id;
  if (row.example) tr.classList.add("example-row");

  const filamentOptions = ['<option value="">—</option>']
    .concat(state.filaments.map(f => `<option value="${f.id}" ${f.id === row.filamentoId ? "selected" : ""}>${escapeHtml(f.nome || "(sem nome)")}</option>`))
    .join("");

  const printerOptions = ['<option value="">—</option>']
    .concat(PRINTERS.map(p => `<option value="${p}" ${p === row.impressora ? "selected" : ""}>${p}</option>`))
    .join("");

  const tipoOptions = TIPOS.map(t => `<option value="${t}" ${t === row.tipo ? "selected" : ""}>${t}</option>`).join("");

  tr.innerHTML = `
    <td class="col-produto"><input type="text" value="${escapeAttr(row.produto)}" data-field="produto" placeholder="Nome do produto"></td>
    <td><input type="date" value="${row.data || ""}" data-field="data"></td>
    <td><select data-field="tipo">${tipoOptions}</select></td>
    <td><select data-field="impressora">${printerOptions}</select></td>
    <td><select data-field="filamentoId">${filamentOptions}</select></td>
    <td class="num"><input type="number" step="0.01" value="${row.precoVenda}" data-field="precoVenda"></td>
    <td class="num"><input type="number" step="0.01" value="${row.recebido}" data-field="recebido"></td>
    <td class="num calc-cell" data-out="taxaRS">—</td>
    <td class="num calc-cell" data-out="taxaPct">—</td>
    <td class="center"><input type="checkbox" data-field="taxaME" ${row.taxaME ? "checked" : ""} title="Aplicar 4% sobre o preço de venda (ME)"></td>
    <td class="num calc-cell" data-out="custoTaxaME">—</td>
    <td class="num"><input type="number" step="0.1" value="${row.peso}" data-field="peso"></td>
    <td class="num"><input type="number" step="0.1" value="${row.tempo}" data-field="tempo"></td>
    <td class="num calc-cell" data-out="custoFilamento">—</td>
    <td class="num calc-cell" data-out="custoEnergia">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.embalagem}" data-field="embalagem"></td>
    <td class="num"><input type="number" step="0.01" value="${row.gastoLevar}" data-field="gastoLevar"></td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td class="num calc-cell" data-out="lucro">—</td>
    <td class="num" data-out="margem">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover produto">✕</button></td>
  `;

  tr.querySelectorAll("input, select").forEach(el => {
    const evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt, () => {
      const field = el.dataset.field;
      if (field === "taxaME") {
        row.taxaME = el.checked;
      } else {
        row[field] = el.value;
      }
      saveState();
      updateRowCalcCells(tr, row);
      if (activeTab === "resumo") { /* n/a */ }
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover o produto "${row.produto || "(sem nome)"}"?`)) return;
    state.stores[storeKey] = state.stores[storeKey].filter(r => r.id !== row.id);
    saveState();
    renderContent();
  });

  updateRowCalcCells(tr, row);
  return tr;
}

function updateRowCalcCells(tr, row) {
  const c = calcRow(row);
  setCalc(tr, "taxaRS", c.taxaRS === null ? "—" : fmtCurrency(c.taxaRS));
  setCalc(tr, "taxaPct", c.taxaPct === null ? "—" : fmtPercent(c.taxaPct));
  setCalc(tr, "custoFilamento", fmtCurrency(c.custoFilamento));
  setCalc(tr, "custoEnergia", fmtCurrency(c.custoEnergia));
  setCalc(tr, "custoTaxaME", fmtCurrency(c.custoTaxaME));
  setCalc(tr, "custoTotal", fmtCurrency(c.custoTotal));
  setCalc(tr, "lucro", c.lucro === null ? "—" : fmtCurrency(c.lucro));

  const margemCell = tr.querySelector('[data-out="margem"]');
  if (c.margem === null) {
    margemCell.innerHTML = `<span class="margin-empty">—</span>`;
  } else {
    const cls = c.margem >= 0.4 ? "margin-good" : c.margem >= 0.2 ? "margin-warn" : "margin-bad";
    margemCell.innerHTML = `<span class="margin-badge ${cls}">${fmtPercent(c.margem)}</span>`;
  }
}

function setCalc(tr, key, text) {
  const cell = tr.querySelector(`[data-out="${key}"]`);
  if (cell) cell.textContent = text;
}

function recalcAllStoreTables() {
  // se a aba atual é uma loja, atualiza as linhas visíveis sem redesenhar os inputs (preserva foco)
  if (STORE_META.some(s => s.key === activeTab)) {
    document.querySelectorAll("tbody tr[data-row-id]").forEach(tr => {
      const row = state.stores[activeTab].find(r => r.id === tr.dataset.rowId);
      if (row) updateRowCalcCells(tr, row);
    });
  }
  if (activeTab === "resumo") renderContent();
}

/* ---------- Resumo ---------- */

function renderResumoPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Resumo — Todas as Lojas</h1>
        <p class="panel-sub">Totais calculados automaticamente a partir de cada loja.</p>
      </div>
    </header>
  `;

  const totals = STORE_META.map(meta => {
    const rows = state.stores[meta.key];
    let faturamento = 0, recebido = 0, custoTotal = 0, lucro = 0;
    rows.forEach(row => {
      const c = calcRow(row);
      faturamento += n(row.precoVenda);
      recebido += hasVal(row.recebido) ? n(row.recebido) : 0;
      custoTotal += c.custoTotal;
      lucro += c.lucro !== null ? c.lucro : 0;
    });
    const margem = faturamento ? lucro / faturamento : null;
    return { meta, faturamento, recebido, custoTotal, lucro, margem, count: rows.length };
  });

  const grid = document.createElement("div");
  grid.className = "summary-grid";
  totals.forEach(t => {
    const card = document.createElement("div");
    card.className = "summary-card";
    card.style.borderLeftColor = t.meta.color;
    card.innerHTML = `
      <div class="label">${t.meta.label}</div>
      <div class="value">${fmtCurrency(t.lucro)}</div>
      <div class="sub">lucro líquido · ${t.count} produto(s)</div>
    `;
    grid.appendChild(card);
  });
  panel.appendChild(grid);

  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Loja</th>
        <th class="num">Faturamento (R$)</th>
        <th class="num">Recebido (R$)</th>
        <th class="num">Custo Total (R$)</th>
        <th class="num">Lucro Total (R$)</th>
        <th class="num">Margem Média</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  let totFat = 0, totRec = 0, totCusto = 0, totLucro = 0;
  totals.forEach(t => {
    totFat += t.faturamento; totRec += t.recebido; totCusto += t.custoTotal; totLucro += t.lucro;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.meta.label}</td>
      <td class="num">${fmtCurrency(t.faturamento)}</td>
      <td class="num">${fmtCurrency(t.recebido)}</td>
      <td class="num">${fmtCurrency(t.custoTotal)}</td>
      <td class="num">${fmtCurrency(t.lucro)}</td>
      <td class="num">${t.margem === null ? "—" : fmtPercent(t.margem)}</td>
    `;
    tbody.appendChild(tr);
  });
  const totalMargem = totFat ? totLucro / totFat : null;
  const trTotal = document.createElement("tr");
  trTotal.style.fontWeight = "600";
  trTotal.innerHTML = `
    <td>TOTAL GERAL</td>
    <td class="num">${fmtCurrency(totFat)}</td>
    <td class="num">${fmtCurrency(totRec)}</td>
    <td class="num">${fmtCurrency(totCusto)}</td>
    <td class="num">${fmtCurrency(totLucro)}</td>
    <td class="num">${totalMargem === null ? "—" : fmtPercent(totalMargem)}</td>
  `;
  tbody.appendChild(trTotal);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  panel.appendChild(wrap);

  return panel;
}

/* ---------- KPIs ---------- */

// filtro de período da tela de KPIs — vive só na sessão, não é salvo no banco
let kpiState = { year: "", month: "" };

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthLabel(m) {
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]}/${y}`;
}

function kpiCard(label, value, sub) {
  return `<div class="summary-card"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
}

function renderKpisPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";

  // só entram nos KPIs pedidos reais (sem os produtos de exemplo) com data preenchida
  const kpiRows = allRows().filter(r => !r.example && r.data);
  const years = [...new Set(kpiRows.map(r => r.data.slice(0, 4)))].sort();
  const months = [...new Set(kpiRows.map(r => r.data.slice(0, 7)))].sort();

  if (kpiState.year && !years.includes(kpiState.year)) { kpiState.year = ""; kpiState.month = ""; }
  if (kpiState.month && kpiState.month.slice(0, 4) !== kpiState.year) kpiState.month = "";
  if (kpiState.month && !months.includes(kpiState.month)) kpiState.month = "";

  const monthsInYear = months.filter(m => !kpiState.year || m.slice(0, 4) === kpiState.year);

  const yearOptions = ['<option value="">Todos os anos</option>']
    .concat(years.map(y => `<option value="${y}" ${y === kpiState.year ? "selected" : ""}>${y}</option>`))
    .join("");
  const monthOptions = ['<option value="">Todos os meses</option>']
    .concat(monthsInYear.map(m => `<option value="${m}" ${m === kpiState.month ? "selected" : ""}>${MONTH_NAMES[parseInt(m.slice(5, 7), 10) - 1]}</option>`))
    .join("");

  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">KPIs — Análise de Vendas</h1>
        <p class="panel-sub">Baseado nos pedidos com a coluna "Data" preenchida em cada loja. Produtos de exemplo não entram na conta.</p>
      </div>
      <div class="panel-actions">
        <select id="kpi-year">${yearOptions}</select>
        <select id="kpi-month">${monthOptions}</select>
      </div>
    </header>
  `;

  const bindFilters = () => {
    panel.querySelector("#kpi-year").addEventListener("change", e => {
      kpiState.year = e.target.value;
      kpiState.month = "";
      renderContent();
    });
    panel.querySelector("#kpi-month").addEventListener("change", e => {
      kpiState.month = e.target.value;
      renderContent();
    });
  };

  if (kpiRows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = 'Nenhum pedido com data cadastrada ainda. Preencha a coluna "Data" nos seus produtos para ver os KPIs aqui.';
    panel.appendChild(empty);
    bindFilters();
    return panel;
  }

  const filtered = kpiRows.filter(r => {
    if (kpiState.year && r.data.slice(0, 4) !== kpiState.year) return false;
    if (kpiState.month && r.data.slice(0, 7) !== kpiState.month) return false;
    return true;
  });

  let faturamento = 0, custoTotal = 0, lucro = 0;
  const pedidos = filtered.length;
  filtered.forEach(row => {
    const c = calcRow(row);
    faturamento += n(row.precoVenda);
    custoTotal += c.custoTotal;
    lucro += c.lucro !== null ? c.lucro : 0;
  });
  const margem = faturamento ? lucro / faturamento : null;
  const ticket = pedidos ? faturamento / pedidos : null;

  const grid = document.createElement("div");
  grid.className = "summary-grid";
  grid.innerHTML = [
    kpiCard("Faturamento", fmtCurrency(faturamento), `${pedidos} pedido(s)`),
    kpiCard("Lucro Líquido", fmtCurrency(lucro), margem !== null ? `margem ${fmtPercent(margem)}` : "—"),
    kpiCard("Custo Total", fmtCurrency(custoTotal), "filamento + energia + taxas + embalagem"),
    kpiCard("Ticket Médio", ticket !== null ? fmtCurrency(ticket) : "—", "por pedido"),
  ].join("");
  panel.appendChild(grid);

  panel.appendChild(renderRevenueChart(kpiRows, months));
  panel.appendChild(renderKpiStoreBreakdown(filtered));
  panel.appendChild(renderTopProducts(filtered));

  bindFilters();
  return panel;
}

// Gráfico de faturamento que se adapta ao período escolhido:
// mês específico selecionado -> barras por dia daquele mês
// ano selecionado (sem mês)   -> barras por mês daquele ano
// nada selecionado            -> barras por mês de todo o histórico
function renderRevenueChart(kpiRows, allMonths) {
  const wrap = document.createElement("div");
  wrap.className = "panel-block";

  let title, bars;

  if (kpiState.month) {
    const [y, mo] = kpiState.month.split("-").map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    const monthRows = kpiRows.filter(r => r.data.slice(0, 7) === kpiState.month);
    title = `Faturamento por dia — ${MONTH_NAMES[mo - 1]}/${y}`;
    bars = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${kpiState.month}-${String(d).padStart(2, "0")}`;
      const dayRows = monthRows.filter(r => r.data === dayStr);
      let fat = 0;
      dayRows.forEach(r => { fat += n(r.precoVenda); });
      bars.push({ label: String(d).padStart(2, "0"), fat, count: dayRows.length });
    }
  } else if (kpiState.year) {
    const yearRows = kpiRows.filter(r => r.data.slice(0, 4) === kpiState.year);
    title = `Faturamento por mês — ${kpiState.year}`;
    bars = MONTH_NAMES.map((name, idx) => {
      const mKey = `${kpiState.year}-${String(idx + 1).padStart(2, "0")}`;
      const mRows = yearRows.filter(r => r.data.slice(0, 7) === mKey);
      let fat = 0;
      mRows.forEach(r => { fat += n(r.precoVenda); });
      return { label: name, fat, count: mRows.length };
    });
  } else {
    title = "Faturamento por mês";
    bars = allMonths.map(m => {
      const mRows = kpiRows.filter(r => r.data.slice(0, 7) === m);
      let fat = 0;
      mRows.forEach(r => { fat += n(r.precoVenda); });
      return { label: monthLabel(m), fat, count: mRows.length };
    });
  }

  wrap.innerHTML = `<h2 class="block-title">${title}</h2>`;

  const max = Math.max(1, ...bars.map(x => x.fat));
  const chart = document.createElement("div");
  chart.className = "bar-chart";
  bars.forEach(x => {
    const pct = x.fat > 0 ? Math.max(2, (x.fat / max) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${x.label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
      <span class="bar-value">${fmtCurrency(x.fat)}${x.count ? ` · ${x.count} pedido(s)` : ""}</span>
    `;
    chart.appendChild(row);
  });
  wrap.appendChild(chart);
  return wrap;
}

function renderKpiStoreBreakdown(rows) {
  const wrap = document.createElement("div");
  wrap.className = "panel-block";
  wrap.innerHTML = `<h2 class="block-title">Por loja (período selecionado)</h2>`;

  const byStore = STORE_META.map(meta => {
    const storeRows = rows.filter(r => r._storeKey === meta.key);
    let fat = 0;
    storeRows.forEach(r => { fat += n(r.precoVenda); });
    return { meta, fat, count: storeRows.length };
  });
  const total = byStore.reduce((sum, x) => sum + x.fat, 0);

  const pieWrap = document.createElement("div");
  pieWrap.className = "pie-wrap";

  if (total <= 0) {
    pieWrap.innerHTML = `<div class="empty-state">Sem faturamento nesse período.</div>`;
    wrap.appendChild(pieWrap);
    return wrap;
  }

  let acc = 0;
  const slices = byStore.filter(x => x.fat > 0).map(x => {
    const start = (acc / total) * 360;
    acc += x.fat;
    const end = (acc / total) * 360;
    return `${x.meta.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
  }).join(", ");

  const pie = document.createElement("div");
  pie.className = "pie-chart";
  pie.style.background = `conic-gradient(${slices})`;
  pieWrap.appendChild(pie);

  const legend = document.createElement("div");
  legend.className = "pie-legend";
  legend.innerHTML = byStore.map(x => {
    const pct = total ? (x.fat / total) * 100 : 0;
    return `
      <div class="pie-legend-item">
        <span class="nav-dot" style="background:${x.meta.color}"></span>
        <span class="pie-legend-label">${x.meta.label}</span>
        <span class="pie-legend-value">${fmtCurrency(x.fat)} · ${pct.toFixed(1)}% · ${x.count} pedido(s)</span>
      </div>
    `;
  }).join("");
  pieWrap.appendChild(legend);

  wrap.appendChild(pieWrap);
  return wrap;
}

function renderTopProducts(rows) {
  const wrap = document.createElement("div");
  wrap.className = "panel-block";
  wrap.innerHTML = `<h2 class="block-title">Top produtos por lucro (período selecionado)</h2>`;

  const byProduct = {};
  rows.forEach(r => {
    const key = (r.produto || "(sem nome)").trim() || "(sem nome)";
    const c = calcRow(r);
    if (!byProduct[key]) byProduct[key] = { produto: key, lucro: 0, pedidos: 0, faturamento: 0 };
    byProduct[key].lucro += c.lucro !== null ? c.lucro : 0;
    byProduct[key].faturamento += n(r.precoVenda);
    byProduct[key].pedidos += 1;
  });
  const top = Object.values(byProduct).sort((a, b) => b.lucro - a.lucro).slice(0, 5);

  if (top.length === 0) {
    wrap.innerHTML += `<div class="empty-state">Sem dados para esse período.</div>`;
    return wrap;
  }

  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead><tr><th>Produto</th><th class="num">Pedidos</th><th class="num">Faturamento (R$)</th><th class="num">Lucro (R$)</th></tr></thead>
    <tbody>${top.map(p => `
      <tr>
        <td>${escapeHtml(p.produto)}</td>
        <td class="num">${p.pedidos}</td>
        <td class="num">${fmtCurrency(p.faturamento)}</td>
        <td class="num">${fmtCurrency(p.lucro)}</td>
      </tr>
    `).join("")}</tbody>
  `;
  const tblWrap = document.createElement("div");
  tblWrap.className = "table-wrap";
  tblWrap.appendChild(table);
  wrap.appendChild(tblWrap);
  return wrap;
}

/* ---------- Perfil ---------- */

function resizeImageToDataURL(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderBrand() {
  const nameEl = document.querySelector(".brand-text strong");
  const markEl = document.querySelector(".brand-mark");
  const nome = (state.profile && state.profile.nome) || "Gestão de Lojas";
  if (nameEl) nameEl.textContent = nome;
  if (markEl) {
    markEl.innerHTML = state.profile && state.profile.icone
      ? `<img src="${state.profile.icone}" alt="Ícone" class="brand-icon-img">`
      : "◇";
  }
  document.title = `${nome} — Impressão 3D`;
}

function renderPerfilPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";

  const icone = state.profile.icone;
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Perfil</h1>
        <p class="panel-sub">Personalize o nome e o ícone que aparecem no menu lateral.</p>
      </div>
    </header>
    <div class="param-grid">
      <div class="param-card">
        <label>Ícone da loja</label>
        <div class="profile-icon-preview">${icone ? `<img src="${icone}" alt="Ícone atual">` : "◇"}</div>
        <div class="profile-icon-actions">
          <label class="ghost-btn small" for="profile-icon-input">Escolher imagem</label>
          <input type="file" id="profile-icon-input" accept="image/*" hidden>
          ${icone ? `<button class="ghost-btn small" id="profile-icon-remove">Remover</button>` : ""}
        </div>
        <p class="param-note">A imagem é redimensionada automaticamente. Use PNG ou JPG.</p>
      </div>
      <div class="param-card">
        <label>Nome da loja</label>
        <input type="text" class="text-field" id="profile-nome" value="${escapeAttr(state.profile.nome)}" placeholder="Ex: Minha Loja 3D">
        <p class="param-note">Esse nome aparece no topo do menu lateral.</p>
      </div>
    </div>
  `;

  panel.querySelector("#profile-nome").addEventListener("input", e => {
    state.profile.nome = e.target.value;
    saveState();
    renderBrand();
  });

  panel.querySelector("#profile-icon-input").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataURL(file, 160);
      state.profile.icone = dataUrl;
      saveState();
      renderBrand();
      renderContent();
      showToast("Ícone atualizado.");
    } catch (err) {
      console.error(err);
      alert("Não foi possível carregar essa imagem.");
    }
  });

  const removeBtn = panel.querySelector("#profile-icon-remove");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      state.profile.icone = null;
      saveState();
      renderBrand();
      renderContent();
      showToast("Ícone removido.");
    });
  }

  return panel;
}

/* ===================== Export / Import ===================== */

function exportStoreCSV(storeKey) {
  const meta = STORE_META.find(s => s.key === storeKey);
  const headers = ["Produto", "Data", "Tipo", "Impressora", "Filamento", "Venda (R$)", "Recebido (R$)",
    "Taxa (R$)", "Taxa (%)", "ME 4%", "Taxa ME (R$)", "Peso (g)", "Tempo (h)", "Filamento (R$)", "Energia (R$)",
    "Embalagem (R$)", "Gasto p/ Levar (R$)", "Custo Total (R$)", "Lucro (R$)", "Margem (%)"];

  const lines = [headers.join(";")];
  state.stores[storeKey].forEach(row => {
    const c = calcRow(row);
    const filName = state.filaments.find(f => f.id === row.filamentoId)?.nome || "";
    const cells = [
      row.produto, row.data || "", row.tipo, row.impressora, filName,
      row.precoVenda, row.recebido,
      c.taxaRS ?? "", c.taxaPct !== null ? (c.taxaPct * 100).toFixed(1) : "",
      row.taxaME ? "Sim" : "Não", c.custoTaxaME.toFixed(2),
      row.peso, row.tempo,
      c.custoFilamento.toFixed(2), c.custoEnergia.toFixed(2),
      row.embalagem, row.gastoLevar,
      c.custoTotal.toFixed(2), c.lucro !== null ? c.lucro.toFixed(2) : "",
      c.margem !== null ? (c.margem * 100).toFixed(1) : "",
    ].map(v => String(v).replace(".", ",").replace(";", ","));
    lines.push(cells.join(";"));
  });

  downloadFile(`${meta.label.replace(/\s+/g, "_")}.csv`, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("btn-export").addEventListener("click", () => {
  const dataStr = JSON.stringify(state, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`backup-gestao-lojas-${date}.json`, dataStr, "application/json");
  showToast("Backup exportado.");
});

document.getElementById("file-import").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.filaments || !imported.stores || !imported.params) throw new Error("formato inválido");
      if (!confirm("Importar este backup vai substituir todos os dados atuais. Continuar?")) return;
      state = normalizeState(imported);
      saveState();
      activeTab = "filamentos";
      renderNav();
      renderContent();
      renderBrand();
      showToast("Backup importado com sucesso.");
    } catch (err) {
      alert("Não foi possível importar este arquivo. Verifique se é um backup válido gerado por este site.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* ===================== Toast ===================== */

let toastTimer = null;
function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ===================== Helpers ===================== */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

/* ===================== Sidebar recolher/expandir ===================== */

const SIDEBAR_COLLAPSE_KEY = "gestaoLojas3D_sidebarCollapsed";
let sidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";

function applySidebarState() {
  const sidebar = document.getElementById("sidebar");
  const btn = document.getElementById("btn-toggle-sidebar");
  sidebar.classList.toggle("collapsed", sidebarCollapsed);
  if (btn) {
    btn.textContent = sidebarCollapsed ? "›" : "‹";
    btn.title = sidebarCollapsed ? "Expandir menu" : "Recolher menu";
  }
}

document.getElementById("btn-toggle-sidebar").addEventListener("click", () => {
  sidebarCollapsed = !sidebarCollapsed;
  localStorage.setItem(SIDEBAR_COLLAPSE_KEY, sidebarCollapsed ? "1" : "0");
  applySidebarState();
});

/* ===================== Init ===================== */

async function init() {
  try {
    state = await dbLoadState();
  } catch (e) {
    console.error("Falha ao carregar dados salvos, usando padrão.", e);
    state = defaultState();
  }
  renderNav();
  renderContent();
  renderBrand();
  applySidebarState();
}

init();