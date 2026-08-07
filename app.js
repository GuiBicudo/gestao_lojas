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
  const exampleProduct = (impressora, filamentoId) => ({
    id: uid(),
    example: true,
    produto: "(exemplo) Vaso Geométrico P",
    tipo: "Impressão 3D",
    impressora,
    filamentoId,
    precoVenda: 45.0,
    recebido: 38.7,
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
    stores: {
      shopee: [exampleProduct("A1", fil1)],
      ml: [exampleProduct("A1 mini", fil2)],
      tiktok: [exampleProduct("A1", fil3)],
    },
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // garante que todas as lojas existam mesmo se o storage for antigo
    STORE_META.forEach(s => { if (!parsed.stores[s.key]) parsed.stores[s.key] = []; });
    return parsed;
  } catch (e) {
    console.error("Falha ao carregar dados salvos, usando padrão.", e);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  const custoTotal = custoFilamento + custoEnergia + embalagem + gastoLevar;
  const lucro = recebido !== null ? recebido - custoTotal : null;
  const margem = lucro !== null && precoVenda ? lucro / precoVenda : null;

  return { taxaRS, taxaPct, custoFilamento, custoEnergia, custoTotal, lucro, margem };
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
  return `<button class="nav-item ${active}" data-tab="${key}">${marker}${label}</button>`;
}

/* ===================== Render: conteúdo principal ===================== */

function renderContent() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  if (activeTab === "filamentos") content.appendChild(renderFilamentsPanel());
  else if (activeTab === "parametros") content.appendChild(renderParamsPanel());
  else if (activeTab === "resumo") content.appendChild(renderResumoPanel());
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
    tr.innerHTML = `<td colspan="18"><div class="empty-state">Nenhum produto cadastrado ainda. Clique em "Novo produto".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(row => tbody.appendChild(storeRow(storeKey, row)));
  }

  node.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    state.stores[storeKey].push({
      id: uid(), example: false, produto: "", tipo: "Impressão 3D", impressora: "",
      filamentoId: "", precoVenda: "", recebido: "", peso: "", tempo: "", embalagem: "", gastoLevar: "",
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
    <td><select data-field="tipo">${tipoOptions}</select></td>
    <td><select data-field="impressora">${printerOptions}</select></td>
    <td><select data-field="filamentoId">${filamentOptions}</select></td>
    <td class="num"><input type="number" step="0.01" value="${row.precoVenda}" data-field="precoVenda"></td>
    <td class="num"><input type="number" step="0.01" value="${row.recebido}" data-field="recebido"></td>
    <td class="num calc-cell" data-out="taxaRS">—</td>
    <td class="num calc-cell" data-out="taxaPct">—</td>
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
    el.addEventListener("input", () => {
      const field = el.dataset.field;
      const numericFields = ["precoVenda", "recebido", "peso", "tempo", "embalagem", "gastoLevar"];
      row[field] = numericFields.includes(field) ? el.value : el.value;
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

/* ===================== Export / Import ===================== */

function exportStoreCSV(storeKey) {
  const meta = STORE_META.find(s => s.key === storeKey);
  const headers = ["Produto", "Tipo", "Impressora", "Filamento", "Venda (R$)", "Recebido (R$)",
    "Taxa (R$)", "Taxa (%)", "Peso (g)", "Tempo (h)", "Filamento (R$)", "Energia (R$)",
    "Embalagem (R$)", "Gasto p/ Levar (R$)", "Custo Total (R$)", "Lucro (R$)", "Margem (%)"];

  const lines = [headers.join(";")];
  state.stores[storeKey].forEach(row => {
    const c = calcRow(row);
    const filName = state.filaments.find(f => f.id === row.filamentoId)?.nome || "";
    const cells = [
      row.produto, row.tipo, row.impressora, filName,
      row.precoVenda, row.recebido,
      c.taxaRS ?? "", c.taxaPct !== null ? (c.taxaPct * 100).toFixed(1) : "",
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
      STORE_META.forEach(s => { if (!imported.stores[s.key]) imported.stores[s.key] = []; });
      state = imported;
      saveState();
      activeTab = "filamentos";
      renderNav();
      renderContent();
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

/* ===================== Init ===================== */

renderNav();
renderContent();