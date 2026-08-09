/* ===================== Configuração ===================== */

const STORE_META = [
  { key: "shopee", label: "Shopee", color: "#EE4D2D" },
  { key: "ml", label: "Mercado Livre", color: "#FFC400" },
  { key: "tiktok", label: "TikTok Shop", color: "#111111" },
];

// sugestões de nome ao cadastrar uma impressora na aba Impressoras — não limita o campo,
// é só um dropdown de apoio (datalist); a pessoa pode digitar qualquer nome
const PRINTER_SUGESTOES = [
  "Bambu Lab A1", "Bambu Lab A1 mini", "Bambu Lab P1S", "Bambu Lab P1P",
  "Bambu Lab X1 Carbon", "Bambu Lab X1E", "Bambu Lab H2D",
  "Creality Ender 3 V3", "Creality Ender 3 V3 SE", "Creality Ender 3 V3 KE",
  "Creality K1", "Creality K1 Max", "Creality K1C", "Creality K2 Plus",
  "Prusa MK4", "Prusa MK4S", "Prusa MINI+", "Prusa XL", "Prusa Core One",
  "Anycubic Kobra 3", "Anycubic Kobra 2 Pro", "Anycubic Photon Mono M5s",
  "Elegoo Neptune 4 Pro", "Elegoo Neptune 4 Max", "Elegoo Saturn 4 Ultra",
  "Qidi Tech X-Max 3", "Qidi Tech Plus4", "Voron 2.4", "Voron 0.2",
  "Sovol SV07", "Flashforge Adventurer 5M Pro", "Snapmaker J1",
  "Ultimaker S5", "Artillery Sidewinder X3",
];
const TIPO_3D = "Impressão 3D";
const TIPO_REVENDA = "Revenda";

const DEVOLUCAO_CATEGORIAS = [
  { key: "defeito", label: "Defeito" },
  { key: "arrependimento", label: "Arrependimento" },
  { key: "nao_encontrado", label: "Não encontrou o cliente" },
];
// dentro de "Defeito" precisa dizer se o produto voltou danificado (perda total dos custos)
// ou se a plataforma pagou o valor do produto (só entra a taxa de R$ 15)
const DEFEITO_SUBTIPOS = [
  { key: "danificado", label: "Defeito de fabricação" },
  { key: "pago_plataforma", label: "Danificado: Pago pela plataforma" },
];
// valor inicial sugerido pro campo "Valor da Devolução" quando marca "Defeito de fabricação"
// (o usuário pode editar esse valor livremente, caso a caso)
const DEFAULT_VALOR_DEVOLUCAO = 15.0;

// custo fixo de etiqueta + QR code, cobrado em todo produto de todas as lojas
const CUSTO_ETIQUETA = 0.10;

// quem paga a taxa ME de 4%: ninguém (não incluir), o produto (desconta do seu lucro) ou o cliente
// (o cliente paga a mais, não sai do seu bolso — só fica registrado pra controle)
const TAXA_ME_OPCOES = [
  { key: "nenhum", label: "Não incluir" },
  { key: "produto", label: "4% do produto" },
  { key: "cliente", label: "4% do cliente" },
];
const PESO_PADRAO_PECA = 1000; // peso padrão (g) de uma peça/rolo de filamento, usado como sugestão inicial

/* ===================== Estado ===================== */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultState() {
  const fil1 = uid(), fil2 = uid(), fil3 = uid();
  const packA = uid(), packB = uid();
  const PRINTER_A1 = "Bambu Lab A1", PRINTER_A1_MINI = "Bambu Lab A1 mini";
  const printer1 = uid(), printer2 = uid();
  const exampleProduct3D = (impressora, filamentoId, data, numeroPedido) => ({
    id: uid(),
    example: true,
    produto: "(exemplo) Vaso Geométrico P",
    data,
    numeroPedido,
    tipo: TIPO_3D,
    impressora,
    filamentoId,
    precoVenda: 45.0,
    recebido: 38.7,
    taxaMETipo: "nenhum",
    peso: 120,
    tempo: 3.5,
    embalagemId: packA,
    gastoLevar: 1.0,
  });

  const exampleProdutoRevenda = (data, numeroPedido) => ({
    id: uid(),
    example: true,
    produto: "(exemplo) Mini Console Portátil",
    data,
    numeroPedido,
    tipo: TIPO_REVENDA,
    precoVenda: 89.9,
    recebido: 76.0,
    taxaMETipo: "nenhum",
    insumos: 25.0,
    embalagemId: packB,
    gastoLevar: 1.0,
  });

  return {
    filaments: [
      { id: fil1, nome: "PLA Preto Genérico", preco: 79.9, pecas: 2, pesoPeca: 1000, obs: "exemplo — edite ou apague" },
      { id: fil2, nome: "PLA Branco Voolt", preco: 94.9, pecas: 1, pesoPeca: 1000, obs: "exemplo — edite ou apague" },
      { id: fil3, nome: "PETG Preto Bambu Lab", preco: 129.9, pecas: 1, pesoPeca: 1000, obs: "exemplo — edite ou apague" },
    ],
    packagings: [
      { id: packA, nome: "Caixa de Papelão P", preco: 40.0, quantidade: 20, obs: "exemplo — edite ou apague" },
      { id: packB, nome: "Envelope Plástico Rígido", preco: 30.0, quantidade: 10, obs: "exemplo — edite ou apague" },
    ],
    printers: [
      { id: printer1, nome: PRINTER_A1, potencia: 120, obs: "exemplo — edite ou apague" },
      { id: printer2, nome: PRINTER_A1_MINI, potencia: 70, obs: "exemplo — edite ou apague" },
    ],
    params: {
      tarifa: 0.7894,
    },
    profile: {
      nome: "Gestão de Lojas",
      icone: null,
    },
    stores: {
      shopee: [exampleProduct3D(PRINTER_A1, fil1, "2026-06-15", "SHP-100234"), exampleProdutoRevenda("2026-06-20", "SHP-100311")],
      ml: [exampleProduct3D(PRINTER_A1_MINI, fil2, "2026-07-10", "ML-582910"), exampleProdutoRevenda("2026-07-18", "ML-583067")],
      tiktok: [exampleProduct3D(PRINTER_A1, fil3, "2026-08-05", "TT-004821"), exampleProdutoRevenda("2026-08-06", "TT-004835")],
    },
    pricing: {
      threeD: [{
        id: uid(), example: true, produto: "(exemplo) Chaveiro Personalizado",
        impressora: PRINTER_A1_MINI, filamentoId: fil2, peso: 15, tempo: 0.8,
        embalagemId: packA, gastoLevar: 0.3, taxaMETipo: "nenhum", taxaPlataforma: 40, margemDesejada: 45,
      }],
      produtos: [{
        id: uid(), example: true, produto: "(exemplo) Capinha de Celular",
        insumos: 8.0, embalagemId: packB, gastoLevar: 0.5, taxaMETipo: "nenhum", taxaPlataforma: 40, margemDesejada: 50,
      }],
    },
    devolucoes: [
      { id: uid(), example: true, numeroPedido: "SHP-100311", categoria: "arrependimento", data: "2026-06-25" },
      { id: uid(), example: true, numeroPedido: "ML-582910", categoria: "defeito", subtipoDefeito: "danificado", valorDevolucao: 15.0, data: "2026-07-15" },
    ],
    ads: [
      { id: uid(), example: true, storeKey: "shopee", valor: 35.0, data: "2026-06-10" },
    ],
    custosFixos: [
      { id: uid(), example: true, nome: "Contadora", valor: 150.0, data: "2026-08-01", obs: "exemplo — edite ou apague" },
    ],
  };
}

// state começa com um placeholder; só é usado de verdade depois que init() carrega
// os dados reais do banco (IndexedDB) — ver seção "Banco de dados local" mais abaixo.
let state = defaultState();

// converte o antigo campo booleano taxaME (true/false) pro novo taxaMETipo (produto/cliente/nenhum),
// sem mexer em quem já estiver no formato novo
function migrateTaxaME(row) {
  if (row.taxaMETipo === undefined) {
    row.taxaMETipo = row.taxaME ? "produto" : "nenhum";
  }
  delete row.taxaME;
}

function normalizeState(parsed) {
  STORE_META.forEach(s => { if (!parsed.stores[s.key]) parsed.stores[s.key] = []; });
  if (!parsed.profile) parsed.profile = { nome: "Gestão de Lojas", icone: null };
  if (!parsed.pricing) parsed.pricing = { threeD: [], produtos: [] };
  if (!parsed.pricing.threeD) parsed.pricing.threeD = [];
  if (!parsed.pricing.produtos) parsed.pricing.produtos = [];
  if (!parsed.devolucoes) parsed.devolucoes = [];
  if (!parsed.packagings) parsed.packagings = [];
  if (!parsed.ads) parsed.ads = [];
  if (!parsed.custosFixos) parsed.custosFixos = [];

  STORE_META.forEach(s => parsed.stores[s.key].forEach(migrateTaxaME));
  parsed.pricing.threeD.forEach(migrateTaxaME);
  parsed.pricing.produtos.forEach(migrateTaxaME);

  // filamentos antigos podem não ter peças/peso por peça cadastrados ainda
  parsed.filaments.forEach(f => {
    if (f.pecas === undefined) f.pecas = 1;
    if (f.pesoPeca === undefined) f.pesoPeca = PESO_PADRAO_PECA;
  });

  // impressoras antigas: até então era um seletor fixo (A1 / A1 mini) — vira uma aba de
  // cadastro de verdade. Contas antigas ganham automaticamente um catálogo com os nomes e
  // potências que já estavam salvos em params.potA1/potA1Mini (ou os valores padrão).
  if (!parsed.printers) {
    const potA1 = parsed.params && parsed.params.potA1 !== undefined ? parsed.params.potA1 : 120;
    const potA1Mini = parsed.params && parsed.params.potA1Mini !== undefined ? parsed.params.potA1Mini : 70;
    parsed.printers = [
      { id: uid(), nome: "Bambu Lab A1", potencia: potA1, obs: "" },
      { id: uid(), nome: "Bambu Lab A1 mini", potencia: potA1Mini, obs: "" },
    ];
  }
  // renomeia seleções antigas ("A1" / "A1 mini", do seletor fixo) para os nomes completos
  // usados no novo catálogo, pra não perder a referência de qual impressora foi usada
  const renamePrinter = row => {
    if (row.impressora === "A1") row.impressora = "Bambu Lab A1";
    else if (row.impressora === "A1 mini") row.impressora = "Bambu Lab A1 mini";
  };
  STORE_META.forEach(s => parsed.stores[s.key].forEach(renamePrinter));
  parsed.pricing.threeD.forEach(renamePrinter);

  // custos fixos antigos podem não ter data cadastrada ainda — sem data eles não entravam
  // no cálculo de lucro/prejuízo dos KPIs, então damos um valor inicial (hoje)
  parsed.custosFixos.forEach(c => {
    if (!c.data) c.data = new Date().toISOString().slice(0, 10);
  });

  return parsed;
}

// soma o que foi gasto em ADS, com filtros opcionais de loja/ano/mês
// (usado no Resumo e nos KPIs para que o gasto com anúncios conte no custo/lucro da loja)
function adsGastoFiltered({ store, year, month } = {}) {
  return state.ads
    .filter(a => a.data)
    .filter(a => !store || a.storeKey === store)
    .filter(a => !year || a.data.slice(0, 4) === year)
    .filter(a => !month || a.data.slice(0, 7) === month)
    .reduce((s, a) => s + n(a.valor), 0);
}

// soma o que foi gasto em custos fixos, com filtros opcionais de ano/mês (usado nos KPIs
// para que esse gasto conte no lucro/prejuízo do período). Custo fixo não é por loja.
function custosFixosGastoFiltered({ year, month } = {}) {
  return state.custosFixos
    .filter(c => c.data)
    .filter(c => !year || c.data.slice(0, 4) === year)
    .filter(c => !month || c.data.slice(0, 7) === month)
    .reduce((s, c) => s + n(c.valor), 0);
}

// procura, em todas as lojas (3D e Produtos), o pedido com esse número
function findProductByOrderNumber(numeroPedido) {
  const needle = String(numeroPedido || "").trim().toLowerCase();
  if (!needle) return null;
  for (const meta of STORE_META) {
    const found = state.stores[meta.key].find(r => (r.numeroPedido || "").trim().toLowerCase() === needle);
    if (found) return { row: found, storeKey: meta.key, storeLabel: meta.label, storeColor: meta.color };
  }
  return null;
}

// custo (impacto financeiro) de uma devolução:
// - defeito de fabricação: não recebe nada, perde embalagem + gasto p/ levar + o valor de
//   devolução informado no cadastro (campo editável, não é mais fixo em R$ 15)
// - danificado: pago pela plataforma: recebe o valor completo — sem custo extra de devolução
// - defeito sem sub-tipo escolhido ainda: custo indefinido (pede pra completar o cadastro)
// - arrependimento / não encontrou o cliente: só perde embalagem + gasto p/ levar (o produto
//   volta inteiro e pode ser revendido, então o custo de produção não conta como perda)
function calcDevolucao(dev) {
  const match = findProductByOrderNumber(dev.numeroPedido);
  if (!match) return { match: null, custoTotal: null };

  const row = match.row;
  const embalagem = getPackagingUnitPrice(row.embalagemId);
  const gastoLevar = n(row.gastoLevar);

  let custoTotal = null;
  if (dev.categoria === "defeito") {
    if (dev.subtipoDefeito === "danificado") custoTotal = embalagem + gastoLevar + CUSTO_ETIQUETA + n(dev.valorDevolucao);
    else if (dev.subtipoDefeito === "pago_plataforma") custoTotal = 0;
  } else if (dev.categoria === "arrependimento" || dev.categoria === "nao_encontrado") {
    custoTotal = embalagem + gastoLevar + CUSTO_ETIQUETA;
  }

  return { match, custoTotal };
}

// caminho inverso: dado um número de pedido, existe alguma devolução registrada pra ele?
// usado dentro de calcRow() para que o Lucro do produto nas Lojas/Resumo/KPIs reflita a devolução
function findDevolucaoByOrderNumber(numeroPedido) {
  const needle = String(numeroPedido || "").trim().toLowerCase();
  if (!needle) return null;
  return state.devolucoes.find(d => String(d.numeroPedido || "").trim().toLowerCase() === needle) || null;
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

/* ===================== Banco de dados (Neon, via Netlify Functions) =====================
   Os dados não ficam mais só no navegador: cada usuário aprovado tem seu próprio estado
   salvo no Postgres (Neon), lido/gravado através das Functions em /api/state-get e
   /api/state-save (veja netlify/functions/). O cookie de sessão (httpOnly) já identifica
   quem está logado — essas chamadas não precisam mandar usuário/senha de novo.
   Essa camada continua isolada de propósito: só ela sabe "onde" os dados moram; o resto
   do app só chama saveState() e dbLoadState(), sem se importar com o transporte. */

// evita disparar uma requisição a cada tecla digitada: só salva de verdade 700ms depois
// da última mudança (e sempre a versão mais recente do estado, mesmo que dispare várias vezes)
const STATE_SAVE_DEBOUNCE_MS = 700;
let saveDebounceTimer = null;

function dbSaveState(value) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  return new Promise((resolve, reject) => {
    saveDebounceTimer = setTimeout(() => {
      fetch("/api/state-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: value }),
      })
        .then(res => {
          if (!res.ok) throw new Error("HTTP " + res.status);
          resolve();
        })
        .catch(reject);
    }, STATE_SAVE_DEBOUNCE_MS);
  });
}

async function dbLoadState() {
  const res = await fetch("/api/state-get");
  if (!res.ok) throw new Error("HTTP " + res.status);
  const body = await res.json();
  return body.data ? normalizeState(body.data) : defaultState();
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

/* ===================== Datas (dd/mm/aaaa) =====================
   Internamente as datas continuam guardadas como string ISO "AAAA-MM-DD" (é o que
   permite ordenar, filtrar por mês/ano e alimentar os KPIs sem gambiarra). Só a
   exibição/digitação nos campos de data é convertida pra dd/mm/aaaa, que é o formato
   que faz sentido pro usuário brasileiro. */

// "AAAA-MM-DD" -> "DD/MM/AAAA" (pra mostrar no campo)
function formatDateBR(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

// "DD/MM/AAAA" -> "AAAA-MM-DD" (só retorna algo se a data for válida de verdade)
function parseDateBR(str) {
  const m = String(str || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10), month = parseInt(m[2], 10), year = parseInt(m[3], 10);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// aplica a máscara dd/mm/aaaa enquanto o usuário digita (só dígitos, insere as barras sozinho)
function maskDateTyping(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

// liga a máscara + validação num input de data em texto; chama onValidDate(iso) só quando
// o que foi digitado já forma uma data real e completa
function attachDateMask(el, onValidDate) {
  el.addEventListener("input", () => {
    const masked = maskDateTyping(el.value);
    if (masked !== el.value) el.value = masked;
    const iso = parseDateBR(el.value);
    if (iso) onValidDate(iso);
  });
}

/* ===================== Cálculos ===================== */

function getFilamentPrice(filamentoId) {
  const f = state.filaments.find(f => f.id === filamentoId);
  return f ? n(f.preco) : 0;
}

/* ---------- Estoque de filamento -----------
   Não guardamos um "estoque atual" separado que vai sendo decrementado manualmente — isso
   daria problema de sincronização (some, duplica, fica desatualizado). Em vez disso, o estoque
   é sempre calculado na hora: quanto você comprou (peças × peso por peça) menos quanto já foi
   usado (soma do peso de cada produto 3D cadastrado em todas as lojas com esse filamento). */

// soma, em todas as lojas, o peso (g) já usado desse filamento em produtos de Impressão 3D
function filamentConsumedGrams(filamentoId) {
  let total = 0;
  STORE_META.forEach(meta => {
    state.stores[meta.key].forEach(row => {
      if (row.tipo === TIPO_3D && row.filamentoId === filamentoId) total += n(row.peso);
    });
  });
  return total;
}

// { comprado, consumido, atual } em gramas, pra um filamento
function filamentStock(f) {
  const comprado = n(f.pecas) * n(f.pesoPeca);
  const consumido = filamentConsumedGrams(f.id);
  return { comprado, consumido, atual: comprado - consumido };
}

// preço por unidade da embalagem: preço total pago dividido pela quantidade que veio no pacote
function getPackagingUnitPrice(embalagemId) {
  const p = state.packagings.find(p => p.id === embalagemId);
  if (!p) return 0;
  const qty = n(p.quantidade);
  return qty > 0 ? n(p.preco) / qty : 0;
}

function buildPackagingOptions(selectedId) {
  return ['<option value="">—</option>']
    .concat(state.packagings.map(p => `<option value="${p.id}" ${p.id === selectedId ? "selected" : ""}>${escapeHtml(p.nome || "(sem nome)")}</option>`))
    .join("");
}

/* ---------- Estoque de embalagem -----------
   Mesma lógica do estoque de filamento: nunca guardamos um contador que vai sendo
   decrementado à mão — o estoque atual é sempre "quantidade comprada" menos "quantas vezes
   essa embalagem foi selecionada em algum produto cadastrado nas lojas" (1 unidade por
   produto, já que cada pedido usa uma embalagem). */

// conta, em todas as lojas (3D e Revenda), quantas vezes essa embalagem foi usada
function packagingConsumedUnits(embalagemId) {
  let total = 0;
  STORE_META.forEach(meta => {
    state.stores[meta.key].forEach(row => {
      if (row.embalagemId === embalagemId) total += 1;
    });
  });
  return total;
}

// { comprado, consumido, atual } em unidades, pra uma embalagem
function packagingStock(p) {
  const comprado = n(p.quantidade);
  const consumido = packagingConsumedUnits(p.id);
  return { comprado, consumido, atual: comprado - consumido };
}

function buildTaxaMEOptions(selected) {
  return TAXA_ME_OPCOES.map(o => `<option value="${o.key}" ${o.key === (selected || "nenhum") ? "selected" : ""}>${o.label}</option>`).join("");
}

/* ---------- Impressoras ---------- */

function getPrinterPower(impressora) {
  const p = state.printers.find(p => p.nome === impressora);
  return p ? n(p.potencia) : 0;
}

function buildPrinterOptions(selected) {
  return ['<option value="">—</option>']
    .concat(state.printers.map(p => `<option value="${escapeAttr(p.nome)}" ${p.nome === selected ? "selected" : ""}>${escapeHtml(p.nome || "(sem nome)")}</option>`))
    .join("");
}

function calcRow(row) {
  const precoVenda = hasVal(row.precoVenda) ? n(row.precoVenda) : null;
  const recebido = hasVal(row.recebido) ? n(row.recebido) : null;

  const taxaRS = precoVenda !== null && recebido !== null ? precoVenda - recebido : null;
  const taxaPct = taxaRS !== null && precoVenda ? taxaRS / precoVenda : null;

  const custoFilamento = n(row.peso) / 1000 * getFilamentPrice(row.filamentoId);
  const custoEnergia = n(row.tempo) * (getPrinterPower(row.impressora) / 1000) * n(state.params.tarifa);
  const embalagem = getPackagingUnitPrice(row.embalagemId);
  const gastoLevar = n(row.gastoLevar);
  const insumos = n(row.insumos); // custo de insumos dos produtos de revenda (ex: pendrive, memory card)
  // taxa de 4% (ME): só entra como custo seu quando é "4% do produto" — quando é "4% do cliente"
  // ou "não incluir", não desconta nada do seu lucro (o cliente paga a mais, ou não tem taxa)
  const custoTaxaME = row.taxaMETipo === "produto" ? n(row.precoVenda) * 0.04 : 0;
  // custo fixo de etiqueta + QR code, cobrado em todo produto
  const custoEtiqueta = CUSTO_ETIQUETA;

  const custoTotal = custoFilamento + custoEnergia + embalagem + gastoLevar + custoEtiqueta + insumos + custoTaxaME;

  // se esse pedido está registrado na aba Devoluções, o lucro final muda:
  // - defeito de fabricação: você não recebe nada e perde embalagem + gasto p/ levar + etiqueta,
  //   mais o valor de devolução informado no cadastro
  // - danificado: pago pela plataforma: a loja reembolsa o valor total do produto — recebe
  //   normalmente, sem custo extra de devolução
  // - defeito sem sub-tipo escolhido ainda: mantém o cálculo normal até você completar o cadastro
  // - arrependimento / não encontrou o cliente: você não recebe nada pela venda — só perde
  //   o que já gastou com embalagem, frete e etiqueta (o produto volta inteiro e pode ser revendido)
  const devolucao = row.numeroPedido ? findDevolucaoByOrderNumber(row.numeroPedido) : null;

  let lucro, margem;
  if (devolucao && devolucao.categoria === "defeito" && devolucao.subtipoDefeito === "danificado") {
    lucro = -(embalagem + gastoLevar + custoEtiqueta) - n(devolucao.valorDevolucao);
    margem = precoVenda ? lucro / precoVenda : null;
  } else if (devolucao && devolucao.categoria === "defeito" && devolucao.subtipoDefeito === "pago_plataforma") {
    lucro = recebido !== null ? recebido - custoTotal : null;
    margem = lucro !== null && precoVenda ? lucro / precoVenda : null;
  } else if (devolucao && (devolucao.categoria === "arrependimento" || devolucao.categoria === "nao_encontrado")) {
    lucro = -(embalagem + gastoLevar + custoEtiqueta);
    margem = precoVenda ? lucro / precoVenda : null;
  } else {
    lucro = recebido !== null ? recebido - custoTotal : null;
    margem = lucro !== null && precoVenda ? lucro / precoVenda : null;
  }

  return { taxaRS, taxaPct, custoFilamento, custoEnergia, custoEmbalagem: embalagem, custoEtiqueta, custoTaxaME, custoTotal, lucro, margem, devolucao };
}

// Calcula o preço de venda sugerido a partir dos custos + margem desejada (%).
// Parte da mesma definição de margem usada no resto do site (lucro / preço de venda),
// considerando também a taxa média cobrada pela plataforma (ex: 40%) e a taxa ME de 4%
// (se marcada), as duas incidindo sobre o preço final:
//   precoVenda = custoBase / (1 - taxaPlataforma% - taxaME% - margem%)
function calcPricing(row) {
  const custoFilamento = n(row.peso) / 1000 * getFilamentPrice(row.filamentoId);
  const custoEnergia = n(row.tempo) * (getPrinterPower(row.impressora) / 1000) * n(state.params.tarifa);
  const embalagem = getPackagingUnitPrice(row.embalagemId);
  const gastoLevar = n(row.gastoLevar);
  const insumos = n(row.insumos);
  const custoBase = custoFilamento + custoEnergia + embalagem + gastoLevar + insumos;

  const margem = n(row.margemDesejada) / 100;
  const taxaMEFrac = row.taxaMETipo === "produto" ? 0.04 : 0;
  const taxaPlataformaFrac = n(row.taxaPlataforma) / 100;
  const denom = 1 - taxaPlataformaFrac - taxaMEFrac - margem;

  let precoSugerido = null, taxaPlataformaRS = null, recebidoEstimado = null, custoTaxaME = 0, custoTotal = custoBase, lucro = null;
  if (denom > 0) {
    precoSugerido = custoBase / denom;
    taxaPlataformaRS = precoSugerido * taxaPlataformaFrac;
    custoTaxaME = precoSugerido * taxaMEFrac;
    custoTotal = custoBase + custoTaxaME;
    recebidoEstimado = precoSugerido - taxaPlataformaRS;
    lucro = recebidoEstimado - custoTotal;
  }

  return {
    custoFilamento, custoEnergia, custoEmbalagem: embalagem, custoBase, custoTaxaME, custoTotal,
    taxaPlataformaRS, recebidoEstimado, precoSugerido, lucro,
    margemInvalida: denom <= 0,
  };
}

/* ===================== Navegação ===================== */

let activeTab = "filamentos";

function renderNav() {
  const nav = document.getElementById("nav");
  const items = [];
  const locked = !window.isAdmin && window.hasAccess === false;

  items.push(navGroupLabel("Produção"));
  items.push(navItem("filamentos", "Filamentos", "◆", null, locked));
  items.push(navItem("embalagens", "Embalagens", "▭", null, locked));
  items.push(navItem("impressoras", "Impressoras", "⎙", null, locked));
  items.push(navItem("parametros", "Parâmetros", "⚙", null, locked));
  items.push(navItem("precificacao", "Precificação", "%", null, locked));

  items.push(navGroupLabel("Lojas"));
  STORE_META.forEach(s => items.push(navItem(s.key, s.label, null, s.color, locked)));

  items.push(navGroupLabel("Despesas"));
  items.push(navItem("ads", "ADS", "◎", null, locked));
  items.push(navItem("custosfixos", "Custos Fixos", "▥", null, locked));

  items.push(navGroupLabel("Pós-venda"));
  items.push(navItem("devolucoes", "Devoluções", "↺", null, locked));

  items.push(navGroupLabel("Visão Geral"));
  items.push(navItem("resumo", "Resumo", "▤", null, locked));
  items.push(navItem("kpis", "KPIs", "▲", null, locked));

  items.push(navGroupLabel("Conta"));
  items.push(navItem("perfil", "Perfil", "◐"));

  if (window.isAdmin) {
    items.push(navGroupLabel("Administração"));
    items.push(navItem("aprovacoes", "Aprovações", "✓"));
    items.push(navItem("usuarios", "Usuários", "◈"));
    items.push(navItem("tickets", "Tickets", "✉"));
  }

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

function navItem(key, label, icon, color, locked) {
  const active = key === activeTab ? "active" : "";
  const marker = color
    ? `<span class="nav-dot" style="background:${color}"></span>`
    : `<span style="width:16px;text-align:center;color:#8F98A1;">${icon}</span>`;
  const badge = locked ? `<span class="premium-badge">Premium</span>` : "";
  return `<button class="nav-item ${active}${locked ? " locked" : ""}" data-tab="${key}" title="${label}">${marker}<span class="nav-label">${label}</span>${badge}</button>`;
}

/* ===================== Render: conteúdo principal ===================== */

function renderContent() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const locked = !window.isAdmin && window.hasAccess === false && activeTab !== "perfil";
  if (locked) {
    content.appendChild(renderPremiumLockPanel());
    return;
  }

  if (activeTab === "filamentos") content.appendChild(renderFilamentsPanel());
  else if (activeTab === "embalagens") content.appendChild(renderPackagingsPanel());
  else if (activeTab === "impressoras") content.appendChild(renderPrintersPanel());
  else if (activeTab === "parametros") content.appendChild(renderParamsPanel());
  else if (activeTab === "precificacao") content.appendChild(renderPricingPanel());
  else if (activeTab === "ads") content.appendChild(renderAdsPanel());
  else if (activeTab === "custosfixos") content.appendChild(renderCustosFixosPanel());
  else if (activeTab === "devolucoes") content.appendChild(renderDevolucoesPanel());
  else if (activeTab === "resumo") content.appendChild(renderResumoPanel());
  else if (activeTab === "kpis") content.appendChild(renderKpisPanel());
  else if (activeTab === "perfil") content.appendChild(renderPerfilPanel());
  else if (activeTab === "aprovacoes") content.appendChild(renderAprovacoesPanel());
  else if (activeTab === "usuarios") content.appendChild(renderUsuariosPanel());
  else if (activeTab === "tickets") content.appendChild(renderTicketsPanel());
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
        <p class="panel-sub">Cadastre cada filamento que você compra: preço por kg, quantas peças (rolos) e o peso de cada uma. O estoque é calculado sozinho — abate automaticamente o peso usado em cada produto de Impressão 3D cadastrado nas lojas.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" id="fil-add">+ Novo filamento</button>
      </div>
    </header>
  `;

  if (state.filaments.length > 0) {
    const grid = document.createElement("div");
    grid.className = "summary-grid";
    grid.innerHTML = state.filaments.map(f => {
      const s = filamentStock(f);
      const cls = s.atual < 0 ? "margin-bad" : s.atual < 1000 ? "margin-warn" : "margin-good";
      return `
        <div class="summary-card">
          <div class="label">${escapeHtml(f.nome || "(sem nome)")}</div>
          <div class="value"><span class="margin-badge ${cls}">${s.atual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g</span></div>
          <div class="sub">estoque atual · comprado ${s.comprado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g, usado ${s.consumido.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g</div>
        </div>
      `;
    }).join("");
    panel.appendChild(grid);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Filamento (material + cor)</th>
        <th class="num">Preço por Kg (R$)</th>
        <th class="num">Peças</th>
        <th class="num">Peso por Peça (g)</th>
        <th class="num calc">Estoque Comprado (g)</th>
        <th class="num calc">Consumido (g)</th>
        <th class="num calc">Estoque Atual (g)</th>
        <th>Observações</th>
        <th></th>
      </tr>
    </thead>
    <tbody id="fil-body"></tbody>
  `;
  const tbody = table.querySelector("#fil-body");
  if (state.filaments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">Nenhum filamento cadastrado ainda.</div></td></tr>`;
  } else {
    state.filaments.forEach(f => tbody.appendChild(filamentRow(f)));
  }
  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  panel.querySelector("#fil-add").addEventListener("click", () => {
    state.filaments.push({ id: uid(), nome: "", preco: 0, pecas: 1, pesoPeca: PESO_PADRAO_PECA, obs: "" });
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
    <td class="num"><input type="number" step="1" min="0" value="${f.pecas}" data-field="pecas" title="Quantas peças/rolos você comprou"></td>
    <td class="num"><input type="number" step="1" min="0" value="${f.pesoPeca}" data-field="pesoPeca" title="Peso de cada peça/rolo, em gramas"></td>
    <td class="num calc-cell" data-out="estoqueComprado">—</td>
    <td class="num calc-cell" data-out="estoqueConsumido">—</td>
    <td class="num calc-cell" data-out="estoqueAtual">—</td>
    <td><input type="text" value="${escapeAttr(f.obs || "")}" data-field="obs" placeholder="opcional"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  const updateStockCells = () => {
    const s = filamentStock(f);
    tr.querySelector('[data-out="estoqueComprado"]').textContent = `${s.comprado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g`;
    tr.querySelector('[data-out="estoqueConsumido"]').textContent = `${s.consumido.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g`;
    const atualCell = tr.querySelector('[data-out="estoqueAtual"]');
    atualCell.textContent = `${s.atual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} g`;
    atualCell.classList.toggle("devolucao-not-found", s.atual < 0);
  };

  tr.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      f[field] = (field === "preco" || field === "pecas" || field === "pesoPeca") ? n(input.value) : input.value;
      saveState();
      updateStockCells();
      // recalcula colunas de custo de filamento em todas as lojas, sem redesenhar tudo
      recalcAllStoreTables();
    });
  });

  updateStockCells();

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover o filamento "${f.nome || "(sem nome)"}"? Produtos que usam ele ficarão sem filamento selecionado.`)) return;
    state.filaments = state.filaments.filter(x => x.id !== f.id);
    saveState();
    renderContent();
  });

  return tr;
}

/* ---------- Embalagens ---------- */

function renderPackagingsPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Embalagens</h1>
        <p class="panel-sub">Cadastre cada embalagem que você compra: o preço total pago e a quantidade de unidades que vieram no pacote. O preço por unidade é calculado sozinho e aparece no seletor de cada produto. O estoque também é calculado sozinho — abate automaticamente 1 unidade a cada produto cadastrado nas lojas que usar essa embalagem.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" id="pack-add">+ Nova embalagem</button>
      </div>
    </header>
  `;

  if (state.packagings.length > 0) {
    const grid = document.createElement("div");
    grid.className = "summary-grid";
    grid.innerHTML = state.packagings.map(p => {
      const s = packagingStock(p);
      const cls = s.atual < 0 ? "margin-bad" : s.atual < 5 ? "margin-warn" : "margin-good";
      return `
        <div class="summary-card">
          <div class="label">${escapeHtml(p.nome || "(sem nome)")}</div>
          <div class="value"><span class="margin-badge ${cls}">${s.atual.toLocaleString("pt-BR")} un</span></div>
          <div class="sub">estoque atual · comprado ${s.comprado.toLocaleString("pt-BR")} un, usado ${s.consumido.toLocaleString("pt-BR")} un</div>
        </div>
      `;
    }).join("");
    panel.appendChild(grid);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Embalagem</th>
        <th class="num">Preço Pago (R$)</th>
        <th class="num">Quantidade Comprada (un)</th>
        <th class="num calc">Consumido (un)</th>
        <th class="num calc">Estoque Atual (un)</th>
        <th class="num calc">Preço Unitário (R$/un)</th>
        <th>Observações</th>
        <th></th>
      </tr>
    </thead>
    <tbody id="pack-body"></tbody>
  `;
  const tbody = table.querySelector("#pack-body");
  if (state.packagings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Nenhuma embalagem cadastrada ainda.</div></td></tr>`;
  } else {
    state.packagings.forEach(p => tbody.appendChild(packagingRow(p)));
  }
  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  panel.querySelector("#pack-add").addEventListener("click", () => {
    state.packagings.push({ id: uid(), nome: "", preco: 0, quantidade: 1, obs: "" });
    saveState();
    renderContent();
  });

  return panel;
}

function packagingRow(p) {
  const tr = document.createElement("tr");
  if (p.obs && p.obs.includes("exemplo")) tr.classList.add("example-row");
  tr.innerHTML = `
    <td><input type="text" value="${escapeAttr(p.nome)}" data-field="nome" placeholder="Ex: Caixa de papelão P"></td>
    <td class="num"><input type="number" step="0.01" value="${p.preco}" data-field="preco"></td>
    <td class="num"><input type="number" step="1" value="${p.quantidade}" data-field="quantidade"></td>
    <td class="num calc-cell" data-out="estoqueConsumido">—</td>
    <td class="num calc-cell" data-out="estoqueAtual">—</td>
    <td class="num calc-cell" data-out="unitPrice">—</td>
    <td><input type="text" value="${escapeAttr(p.obs || "")}" data-field="obs" placeholder="opcional"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  const updateCalcCells = () => {
    const s = packagingStock(p);
    tr.querySelector('[data-out="estoqueConsumido"]').textContent = `${s.consumido.toLocaleString("pt-BR")} un`;
    const atualCell = tr.querySelector('[data-out="estoqueAtual"]');
    atualCell.textContent = `${s.atual.toLocaleString("pt-BR")} un`;
    atualCell.classList.toggle("devolucao-not-found", s.atual < 0);
    tr.querySelector('[data-out="unitPrice"]').textContent = fmtCurrency(getPackagingUnitPrice(p.id));
  };

  tr.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      p[field] = (field === "preco" || field === "quantidade") ? n(input.value) : input.value;
      saveState();
      updateCalcCells();
      // recalcula colunas de custo de embalagem em todas as lojas, sem redesenhar tudo
      recalcAllStoreTables();
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover a embalagem "${p.nome || "(sem nome)"}"? Produtos que usam ela ficarão sem embalagem selecionada.`)) return;
    state.packagings = state.packagings.filter(x => x.id !== p.id);
    saveState();
    renderContent();
  });

  updateCalcCells();
  return tr;
}

/* ---------- Impressoras ---------- */

function renderPrintersPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Impressoras</h1>
        <p class="panel-sub">Cadastre cada impressora que você usa, com a potência média de consumo (usada para calcular o custo de energia de cada peça). O campo de nome traz sugestões dos modelos mais comuns do mercado, mas você pode digitar qualquer nome.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" id="printer-add">+ Nova impressora</button>
      </div>
    </header>
    <datalist id="printer-suggestions">
      ${PRINTER_SUGESTOES.map(nome => `<option value="${escapeAttr(nome)}"></option>`).join("")}
    </datalist>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Impressora</th>
            <th class="num">Potência Média (W)</th>
            <th>Observações</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="printer-body"></tbody>
      </table>
    </div>
  `;

  const tbody = panel.querySelector("#printer-body");
  if (state.printers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">Nenhuma impressora cadastrada ainda.</div></td></tr>`;
  } else {
    state.printers.forEach(p => tbody.appendChild(printerRow(p)));
  }

  panel.querySelector("#printer-add").addEventListener("click", () => {
    state.printers.push({ id: uid(), nome: "", potencia: 100, obs: "" });
    saveState();
    renderContent();
  });

  return panel;
}

function printerRow(p) {
  const tr = document.createElement("tr");
  if (p.obs && p.obs.includes("exemplo")) tr.classList.add("example-row");
  tr.innerHTML = `
    <td><input type="text" list="printer-suggestions" value="${escapeAttr(p.nome)}" data-field="nome" placeholder="Ex: Bambu Lab A1"></td>
    <td class="num"><input type="number" step="1" min="0" value="${p.potencia}" data-field="potencia" title="Consumo médio durante a impressão, em Watts"></td>
    <td><input type="text" value="${escapeAttr(p.obs || "")}" data-field="obs" placeholder="opcional"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  tr.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      const oldNome = p.nome;
      p[field] = field === "potencia" ? n(input.value) : input.value;
      saveState();
      // se o nome da impressora mudou, atualiza as seleções que apontavam pro nome antigo,
      // pra não perder a referência de qual impressora cada produto usou
      if (field === "nome" && oldNome !== p.nome) {
        STORE_META.forEach(meta => {
          state.stores[meta.key].forEach(row => { if (row.impressora === oldNome) row.impressora = p.nome; });
        });
        state.pricing.threeD.forEach(row => { if (row.impressora === oldNome) row.impressora = p.nome; });
      }
      // recalcula colunas de custo de energia em todas as lojas, sem redesenhar tudo
      recalcAllStoreTables();
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover a impressora "${p.nome || "(sem nome)"}"? Produtos que usam ela ficarão sem impressora selecionada.`)) return;
    state.printers = state.printers.filter(x => x.id !== p.id);
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
        <p class="panel-sub">Vale para todas as lojas. Usado para calcular o custo de energia de cada peça impressa. A potência de cada impressora agora é cadastrada na aba "Impressoras".</p>
      </div>
    </header>
    <div class="param-grid">
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

  panel.querySelector("#p-tarifa").addEventListener("input", e => {
    state.params.tarifa = n(e.target.value);
    saveState();
    recalcAllStoreTables();
  });

  return panel;
}

/* ---------- Lojas ---------- */

// qual sub-aba está ativa dentro de cada loja — vive só na sessão, não é salva no banco
let storeViewType = "3d";
// texto de busca por Nº do pedido na tela de Lojas — vive só na sessão, não é salvo no banco
let storeSearch = "";

function head3D() {
  return `
    <th class="col-produto">Produto</th>
    <th>Data</th>
    <th>Nº Pedido</th>
    <th>Impressora</th>
    <th>Filamento</th>
    <th>Embalagem</th>
    <th class="num">Venda (R$)</th>
    <th class="num">Recebido (R$)</th>
    <th class="num calc">Taxa (R$)</th>
    <th class="num calc">Taxa (%)</th>
    <th>Taxa ME</th>
    <th class="num calc">Taxa ME (R$)</th>
    <th class="num">Peso (g)</th>
    <th class="num">Tempo (h)</th>
    <th class="num calc">Filamento (R$)</th>
    <th class="num calc">Energia (R$)</th>
    <th class="num calc">Embalagem (R$)</th>
    <th class="num">Gasto p/ Levar (R$)</th>
    <th class="num calc">Etiqueta (R$)</th>
    <th class="num calc">Custo Total (R$)</th>
    <th class="num calc">Lucro (R$)</th>
    <th class="num calc">Margem</th>
    <th></th>
  `;
}

function headProdutos() {
  return `
    <th class="col-produto">Produto</th>
    <th>Data</th>
    <th>Nº Pedido</th>
    <th>Embalagem</th>
    <th class="num">Venda (R$)</th>
    <th class="num">Recebido (R$)</th>
    <th class="num calc">Taxa (R$)</th>
    <th class="num calc">Taxa (%)</th>
    <th>Taxa ME</th>
    <th class="num calc">Taxa ME (R$)</th>
    <th class="num">Insumos (R$)</th>
    <th class="num calc">Embalagem (R$)</th>
    <th class="num">Gasto p/ Levar (R$)</th>
    <th class="num calc">Etiqueta (R$)</th>
    <th class="num calc">Custo Total (R$)</th>
    <th class="num calc">Lucro (R$)</th>
    <th class="num calc">Margem</th>
    <th></th>
  `;
}

function renderStorePanel(storeKey) {
  const meta = STORE_META.find(s => s.key === storeKey);
  const is3D = storeViewType === "3d";

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="store-title"><span class="store-dot" style="background:${meta.color}"></span>${meta.label} — Gestão de Produtos</h1>
        <p class="panel-sub">Preencha os campos de cada produto. Os valores calculados atualizam sozinhos. Ordenado da data mais recente para a mais antiga.</p>
      </div>
      <div class="panel-actions">
        <input type="text" id="store-search" class="search-input" placeholder="Buscar por Nº do pedido..." value="${escapeAttr(storeSearch)}">
        <button class="primary-btn" data-action="add-row">+ Novo produto${is3D ? " 3D" : ""}</button>
        <button class="ghost-btn small" data-action="export-csv">Exportar CSV</button>
      </div>
    </header>
    <div class="segmented" id="store-type-tabs">
      <button class="segmented-btn ${is3D ? "active" : ""}" data-type="3d">Impressão 3D</button>
      <button class="segmented-btn ${!is3D ? "active" : ""}" data-type="produtos">Produtos</button>
    </div>
    <div class="table-wrap">
      <table class="data-table store-table">
        <thead><tr>${is3D ? head3D() : headProdutos()}</tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const tbody = panel.querySelector("tbody");

  // pega os produtos dessa loja/sub-aba, filtrados pela busca (Nº do pedido) e ordenados
  // por data — sempre do mais recente pro mais antigo; sem data vai pro final
  function getRows() {
    let rows = state.stores[storeKey].filter(r => is3D ? r.tipo !== TIPO_REVENDA : r.tipo === TIPO_REVENDA);
    const needle = storeSearch.trim().toLowerCase();
    if (needle) rows = rows.filter(r => (r.numeroPedido || "").toLowerCase().includes(needle));
    rows.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return b.data.localeCompare(a.data);
    });
    return rows;
  }

  // reconstrói só o corpo da tabela (não mexe no campo de busca, pra não perder o foco enquanto digita)
  function drawRows() {
    const rows = getRows();
    tbody.innerHTML = "";
    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const needle = storeSearch.trim();
      const msg = needle ? `Nenhum pedido encontrado para "${escapeHtml(needle)}".` : 'Nenhum produto cadastrado ainda. Clique em "Novo produto".';
      tr.innerHTML = `<td colspan="${is3D ? 23 : 18}"><div class="empty-state">${msg}</div></td>`;
      tbody.appendChild(tr);
    } else {
      rows.forEach(row => tbody.appendChild(is3D ? storeRow3D(storeKey, row) : storeRowProduto(storeKey, row)));
    }
  }

  drawRows();

  panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    const base = {
      id: uid(), example: false, produto: "", data: new Date().toISOString().slice(0, 10), numeroPedido: "",
      precoVenda: "", recebido: "", taxaMETipo: "nenhum", embalagemId: "", gastoLevar: "",
    };
    const newRow = is3D
      ? Object.assign(base, { tipo: TIPO_3D, impressora: "", filamentoId: "", peso: "", tempo: "" })
      : Object.assign(base, { tipo: TIPO_REVENDA, insumos: "" });
    state.stores[storeKey].push(newRow);
    saveState();
    drawRows();
  });

  panel.querySelector('[data-action="export-csv"]').addEventListener("click", () => exportStoreCSV(storeKey));

  panel.querySelector("#store-search").addEventListener("input", e => {
    storeSearch = e.target.value;
    drawRows();
  });

  panel.querySelectorAll(".segmented-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      storeViewType = btn.dataset.type;
      renderContent();
    });
  });

  return panel;
}

function bindRowInputs(tr, row) {
  tr.querySelectorAll("input, select").forEach(el => {
    if (el.dataset.field === "data") {
      attachDateMask(el, iso => {
        row.data = iso;
        saveState();
        updateRowCalcCells(tr, row);
      });
      return;
    }
    const evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt, () => {
      row[el.dataset.field] = el.value;
      saveState();
      updateRowCalcCells(tr, row);
    });
  });
}

function bindRowDelete(tr, storeKey, row) {
  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover o produto "${row.produto || "(sem nome)"}"?`)) return;
    state.stores[storeKey] = state.stores[storeKey].filter(r => r.id !== row.id);
    saveState();
    renderContent();
  });
}

function storeRow3D(storeKey, row) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = row.id;
  if (row.example) tr.classList.add("example-row");

  const filamentOptions = ['<option value="">—</option>']
    .concat(state.filaments.map(f => `<option value="${f.id}" ${f.id === row.filamentoId ? "selected" : ""}>${escapeHtml(f.nome || "(sem nome)")}</option>`))
    .join("");

  const printerOptions = buildPrinterOptions(row.impressora);

  tr.innerHTML = `
    <td class="col-produto"><input type="text" value="${escapeAttr(row.produto)}" data-field="produto" placeholder="Nome do produto"></td>
    <td><input type="text" inputmode="numeric" class="date-input" maxlength="10" value="${formatDateBR(row.data)}" data-field="data" placeholder="dd/mm/aaaa"></td>
    <td><input type="text" value="${escapeAttr(row.numeroPedido || "")}" data-field="numeroPedido" placeholder="Nº do pedido"></td>
    <td><select data-field="impressora">${printerOptions}</select></td>
    <td><select data-field="filamentoId">${filamentOptions}</select></td>
    <td><select data-field="embalagemId">${buildPackagingOptions(row.embalagemId)}</select></td>
    <td class="num"><input type="number" step="0.01" value="${row.precoVenda}" data-field="precoVenda"></td>
    <td class="num"><input type="number" step="0.01" value="${row.recebido}" data-field="recebido"></td>
    <td class="num calc-cell" data-out="taxaRS">—</td>
    <td class="num calc-cell" data-out="taxaPct">—</td>
    <td><select data-field="taxaMETipo" title="Quem paga a taxa ME de 4%">${buildTaxaMEOptions(row.taxaMETipo)}</select></td>
    <td class="num calc-cell" data-out="custoTaxaME">—</td>
    <td class="num"><input type="number" step="0.1" value="${row.peso}" data-field="peso"></td>
    <td class="num"><input type="number" step="0.1" value="${row.tempo}" data-field="tempo"></td>
    <td class="num calc-cell" data-out="custoFilamento">—</td>
    <td class="num calc-cell" data-out="custoEnergia">—</td>
    <td class="num calc-cell" data-out="custoEmbalagem">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.gastoLevar}" data-field="gastoLevar"></td>
    <td class="num calc-cell" data-out="custoEtiqueta" title="Custo fixo de etiqueta + QR code">—</td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td class="num calc-cell" data-out="lucro">—</td>
    <td class="num" data-out="margem">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover produto">✕</button></td>
  `;

  bindRowInputs(tr, row);
  bindRowDelete(tr, storeKey, row);
  updateRowCalcCells(tr, row);
  return tr;
}

function storeRowProduto(storeKey, row) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = row.id;
  if (row.example) tr.classList.add("example-row");

  tr.innerHTML = `
    <td class="col-produto"><input type="text" value="${escapeAttr(row.produto)}" data-field="produto" placeholder="Nome do produto"></td>
    <td><input type="text" inputmode="numeric" class="date-input" maxlength="10" value="${formatDateBR(row.data)}" data-field="data" placeholder="dd/mm/aaaa"></td>
    <td><input type="text" value="${escapeAttr(row.numeroPedido || "")}" data-field="numeroPedido" placeholder="Nº do pedido"></td>
    <td><select data-field="embalagemId">${buildPackagingOptions(row.embalagemId)}</select></td>
    <td class="num"><input type="number" step="0.01" value="${row.precoVenda}" data-field="precoVenda"></td>
    <td class="num"><input type="number" step="0.01" value="${row.recebido}" data-field="recebido"></td>
    <td class="num calc-cell" data-out="taxaRS">—</td>
    <td class="num calc-cell" data-out="taxaPct">—</td>
    <td><select data-field="taxaMETipo" title="Quem paga a taxa ME de 4%">${buildTaxaMEOptions(row.taxaMETipo)}</select></td>
    <td class="num calc-cell" data-out="custoTaxaME">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.insumos}" data-field="insumos" title="Custo dos insumos usados (ex: pendrive, memory card)"></td>
    <td class="num calc-cell" data-out="custoEmbalagem">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.gastoLevar}" data-field="gastoLevar"></td>
    <td class="num calc-cell" data-out="custoEtiqueta" title="Custo fixo de etiqueta + QR code">—</td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td class="num calc-cell" data-out="lucro">—</td>
    <td class="num" data-out="margem">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover produto">✕</button></td>
  `;

  bindRowInputs(tr, row);
  bindRowDelete(tr, storeKey, row);
  updateRowCalcCells(tr, row);
  return tr;
}

function updateRowCalcCells(tr, row) {
  const c = calcRow(row);
  setCalc(tr, "taxaRS", c.taxaRS === null ? "—" : fmtCurrency(c.taxaRS));
  setCalc(tr, "taxaPct", c.taxaPct === null ? "—" : fmtPercent(c.taxaPct));
  setCalc(tr, "custoFilamento", fmtCurrency(c.custoFilamento));
  setCalc(tr, "custoEnergia", fmtCurrency(c.custoEnergia));
  setCalc(tr, "custoEmbalagem", fmtCurrency(c.custoEmbalagem));
  setCalc(tr, "custoEtiqueta", fmtCurrency(c.custoEtiqueta));
  setCalc(tr, "custoTaxaME", fmtCurrency(c.custoTaxaME));
  setCalc(tr, "custoTotal", fmtCurrency(c.custoTotal));

  const lucroCell = tr.querySelector('[data-out="lucro"]');
  if (lucroCell) {
    if (c.lucro === null) {
      lucroCell.textContent = "—";
    } else if (c.devolucao) {
      let catLabel = DEVOLUCAO_CATEGORIAS.find(x => x.key === c.devolucao.categoria)?.label || "Devolução";
      if (c.devolucao.categoria === "defeito") {
        const subLabel = DEFEITO_SUBTIPOS.find(x => x.key === c.devolucao.subtipoDefeito)?.label;
        catLabel = subLabel || "Defeito — tipo pendente";
      }
      lucroCell.innerHTML = `${fmtCurrency(c.lucro)} <span class="devolucao-tag" title="Pedido em devolução: ${catLabel}">↺</span>`;
    } else {
      lucroCell.textContent = fmtCurrency(c.lucro);
    }
  }

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
  if (activeTab === "precificacao") {
    const listKey = pricingViewType === "3d" ? "threeD" : "produtos";
    document.querySelectorAll("tbody tr[data-row-id]").forEach(tr => {
      const row = state.pricing[listKey].find(r => r.id === tr.dataset.rowId);
      if (row) updatePricingRowCalcCells(tr, row);
    });
  }
  if (activeTab === "resumo") renderContent();
}

/* ---------- Precificação ---------- */

// qual sub-aba está ativa na tela de Precificação — vive só na sessão, não é salva no banco
let pricingViewType = "3d";

function headPricing3D() {
  return `
    <th class="col-produto">Produto</th>
    <th>Impressora</th>
    <th>Filamento</th>
    <th>Embalagem</th>
    <th class="num">Peso (g)</th>
    <th class="num">Tempo (h)</th>
    <th class="num calc">Filamento (R$)</th>
    <th class="num calc">Energia (R$)</th>
    <th class="num calc">Embalagem (R$)</th>
    <th class="num">Gasto p/ Levar (R$)</th>
    <th>Taxa ME</th>
    <th class="num">Taxa Plataforma (%)</th>
    <th class="num">Margem Desejada (%)</th>
    <th class="num calc">Custo Total (R$)</th>
    <th class="num calc">Taxa Plataforma (R$)</th>
    <th class="num calc">Preço Sugerido (R$)</th>
    <th class="num calc">Recebido Estimado (R$)</th>
    <th class="num calc">Lucro Estimado (R$)</th>
    <th></th>
  `;
}

function headPricingProdutos() {
  return `
    <th class="col-produto">Produto</th>
    <th>Embalagem</th>
    <th class="num">Insumos (R$)</th>
    <th class="num calc">Embalagem (R$)</th>
    <th class="num">Gasto p/ Levar (R$)</th>
    <th>Taxa ME</th>
    <th class="num">Taxa Plataforma (%)</th>
    <th class="num">Margem Desejada (%)</th>
    <th class="num calc">Custo Total (R$)</th>
    <th class="num calc">Taxa Plataforma (R$)</th>
    <th class="num calc">Preço Sugerido (R$)</th>
    <th class="num calc">Recebido Estimado (R$)</th>
    <th class="num calc">Lucro Estimado (R$)</th>
    <th></th>
  `;
}

function renderPricingPanel() {
  const is3D = pricingViewType === "3d";
  const listKey = is3D ? "threeD" : "produtos";
  const rows = state.pricing[listKey];

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Precificação</h1>
        <p class="panel-sub">Informe os custos, a taxa média da plataforma e a margem que você quer ganhar — o preço de venda sugerido é calculado sozinho (considerando também a taxa ME de 4%, se marcada).</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" data-action="add-row">+ Novo item${is3D ? " 3D" : ""}</button>
      </div>
    </header>
    <div class="segmented" id="pricing-type-tabs">
      <button class="segmented-btn ${is3D ? "active" : ""}" data-type="3d">Impressão 3D</button>
      <button class="segmented-btn ${!is3D ? "active" : ""}" data-type="produtos">Produtos</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${is3D ? headPricing3D() : headPricingProdutos()}</tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const tbody = panel.querySelector("tbody");
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="${is3D ? 19 : 14}"><div class="empty-state">Nenhum item de precificação ainda. Clique em "Novo item".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(row => tbody.appendChild(is3D ? pricingRow3D(row) : pricingRowProduto(row)));
  }

  panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    const base = { id: uid(), example: false, produto: "", embalagemId: "", gastoLevar: "", taxaMETipo: "nenhum", taxaPlataforma: 40, margemDesejada: "" };
    const newRow = is3D
      ? Object.assign(base, { impressora: "", filamentoId: "", peso: "", tempo: "" })
      : Object.assign(base, { insumos: "" });
    state.pricing[listKey].push(newRow);
    saveState();
    renderContent();
  });

  panel.querySelectorAll(".segmented-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      pricingViewType = btn.dataset.type;
      renderContent();
    });
  });

  return panel;
}

function bindPricingRowInputs(tr, row) {
  tr.querySelectorAll("input, select").forEach(el => {
    const evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt, () => {
      row[el.dataset.field] = el.value;
      saveState();
      updatePricingRowCalcCells(tr, row);
    });
  });
}

function bindPricingRowDelete(tr, listKey, row) {
  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover "${row.produto || "(sem nome)"}" da precificação?`)) return;
    state.pricing[listKey] = state.pricing[listKey].filter(r => r.id !== row.id);
    saveState();
    renderContent();
  });
}

function pricingRow3D(row) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = row.id;
  if (row.example) tr.classList.add("example-row");

  const filamentOptions = ['<option value="">—</option>']
    .concat(state.filaments.map(f => `<option value="${f.id}" ${f.id === row.filamentoId ? "selected" : ""}>${escapeHtml(f.nome || "(sem nome)")}</option>`))
    .join("");

  const printerOptions = buildPrinterOptions(row.impressora);

  tr.innerHTML = `
    <td class="col-produto"><input type="text" value="${escapeAttr(row.produto)}" data-field="produto" placeholder="Nome do produto"></td>
    <td><select data-field="impressora">${printerOptions}</select></td>
    <td><select data-field="filamentoId">${filamentOptions}</select></td>
    <td><select data-field="embalagemId">${buildPackagingOptions(row.embalagemId)}</select></td>
    <td class="num"><input type="number" step="0.1" value="${row.peso}" data-field="peso"></td>
    <td class="num"><input type="number" step="0.1" value="${row.tempo}" data-field="tempo"></td>
    <td class="num calc-cell" data-out="custoFilamento">—</td>
    <td class="num calc-cell" data-out="custoEnergia">—</td>
    <td class="num calc-cell" data-out="custoEmbalagem">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.gastoLevar}" data-field="gastoLevar"></td>
    <td><select data-field="taxaMETipo" title="Quem paga a taxa ME de 4%">${buildTaxaMEOptions(row.taxaMETipo)}</select></td>
    <td class="num"><input type="number" step="1" value="${row.taxaPlataforma}" data-field="taxaPlataforma" placeholder="Ex: 40" title="Comissão média cobrada pela plataforma sobre o preço de venda"></td>
    <td class="num"><input type="number" step="1" value="${row.margemDesejada}" data-field="margemDesejada" placeholder="Ex: 40"></td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td class="num calc-cell" data-out="taxaPlataformaRS">—</td>
    <td class="num calc-cell price-highlight" data-out="precoSugerido">—</td>
    <td class="num calc-cell" data-out="recebidoEstimado">—</td>
    <td class="num calc-cell" data-out="lucroEstimado">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  bindPricingRowInputs(tr, row);
  bindPricingRowDelete(tr, "threeD", row);
  updatePricingRowCalcCells(tr, row);
  return tr;
}

function pricingRowProduto(row) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = row.id;
  if (row.example) tr.classList.add("example-row");

  tr.innerHTML = `
    <td class="col-produto"><input type="text" value="${escapeAttr(row.produto)}" data-field="produto" placeholder="Nome do produto"></td>
    <td><select data-field="embalagemId">${buildPackagingOptions(row.embalagemId)}</select></td>
    <td class="num"><input type="number" step="0.01" value="${row.insumos}" data-field="insumos" title="Custo dos insumos usados (ex: pendrive, memory card)"></td>
    <td class="num calc-cell" data-out="custoEmbalagem">—</td>
    <td class="num"><input type="number" step="0.01" value="${row.gastoLevar}" data-field="gastoLevar"></td>
    <td><select data-field="taxaMETipo" title="Quem paga a taxa ME de 4%">${buildTaxaMEOptions(row.taxaMETipo)}</select></td>
    <td class="num"><input type="number" step="1" value="${row.taxaPlataforma}" data-field="taxaPlataforma" placeholder="Ex: 40" title="Comissão média cobrada pela plataforma sobre o preço de venda"></td>
    <td class="num"><input type="number" step="1" value="${row.margemDesejada}" data-field="margemDesejada" placeholder="Ex: 40"></td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td class="num calc-cell" data-out="taxaPlataformaRS">—</td>
    <td class="num calc-cell price-highlight" data-out="precoSugerido">—</td>
    <td class="num calc-cell" data-out="recebidoEstimado">—</td>
    <td class="num calc-cell" data-out="lucroEstimado">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  bindPricingRowInputs(tr, row);
  bindPricingRowDelete(tr, "produtos", row);
  updatePricingRowCalcCells(tr, row);
  return tr;
}

function updatePricingRowCalcCells(tr, row) {
  const c = calcPricing(row);
  setCalc(tr, "custoFilamento", fmtCurrency(c.custoFilamento));
  setCalc(tr, "custoEnergia", fmtCurrency(c.custoEnergia));
  setCalc(tr, "custoEmbalagem", fmtCurrency(c.custoEmbalagem));
  setCalc(tr, "custoTotal", fmtCurrency(c.custoTotal));
  setCalc(tr, "taxaPlataformaRS", c.taxaPlataformaRS !== null ? fmtCurrency(c.taxaPlataformaRS) : "—");
  setCalc(tr, "precoSugerido", c.precoSugerido !== null ? fmtCurrency(c.precoSugerido) : "—");
  setCalc(tr, "recebidoEstimado", c.recebidoEstimado !== null ? fmtCurrency(c.recebidoEstimado) : "—");
  setCalc(tr, "lucroEstimado", c.lucro !== null ? fmtCurrency(c.lucro) : "—");

  const precoCell = tr.querySelector('[data-out="precoSugerido"]');
  if (precoCell) {
    precoCell.title = c.margemInvalida
      ? "Margem desejada muito alta para esses custos — reduza a margem ou os custos."
      : "";
  }
}

/* ---------- ADS ---------- */

function renderAdsPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  const rows = state.ads;

  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">ADS</h1>
        <p class="panel-sub">Registre quanto você pagou em anúncios em cada loja. Esse valor entra automaticamente no custo (e reduz o lucro) daquela loja no Resumo e nos KPIs.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" data-action="add-row">+ Novo ADS</button>
      </div>
    </header>
  `;

  if (rows.length > 0) {
    const grid = document.createElement("div");
    grid.className = "summary-grid";
    const totalGeral = rows.reduce((s, a) => s + n(a.valor), 0);
    grid.innerHTML = [
      kpiCard("Total em ADS", fmtCurrency(totalGeral), `${rows.length} registro(s)`),
      ...STORE_META.map(meta => kpiCard(meta.label, fmtCurrency(adsGastoFiltered({ store: meta.key })), "gasto em ADS")),
    ].join("");
    panel.appendChild(grid);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Loja</th>
        <th class="num">Valor Pago (R$)</th>
        <th>Data</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4"><div class="empty-state">Nenhum registro de ADS ainda. Clique em "Novo ADS".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(a => tbody.appendChild(adsRow(a)));
  }

  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    state.ads.push({ id: uid(), example: false, storeKey: "", valor: "", data: new Date().toISOString().slice(0, 10) });
    saveState();
    renderContent();
  });

  return panel;
}

function adsRow(a) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = a.id;
  if (a.example) tr.classList.add("example-row");

  const storeOptions = ['<option value="">— selecione a loja —</option>']
    .concat(STORE_META.map(meta => `<option value="${meta.key}" ${meta.key === a.storeKey ? "selected" : ""}>${meta.label}</option>`))
    .join("");

  tr.innerHTML = `
    <td><select data-field="storeKey">${storeOptions}</select></td>
    <td class="num"><input type="number" step="0.01" value="${a.valor}" data-field="valor"></td>
    <td><input type="text" inputmode="numeric" class="date-input" maxlength="10" value="${formatDateBR(a.data)}" data-field="data" placeholder="dd/mm/aaaa"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  const dataEl = tr.querySelector('[data-field="data"]');
  attachDateMask(dataEl, iso => {
    a.data = iso;
    saveState();
  });

  tr.querySelectorAll('[data-field]:not([data-field="data"])').forEach(el => {
    el.addEventListener("input", () => {
      a[el.dataset.field] = el.value;
      saveState();
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm("Remover este registro de ADS?")) return;
    state.ads = state.ads.filter(x => x.id !== a.id);
    saveState();
    renderContent();
  });

  return tr;
}

/* ---------- Custos Fixos ---------- */

function renderCustosFixosPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  const rows = state.custosFixos;

  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Custos Fixos</h1>
        <p class="panel-sub">Registre custos fixos mensais do seu negócio, como contadora, assinaturas, etc. Informe a data de cada um para que entrem corretamente no lucro/prejuízo mostrado nos KPIs do período.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" data-action="add-row">+ Novo custo fixo</button>
      </div>
    </header>
  `;

  if (rows.length > 0) {
    const total = rows.reduce((s, c) => s + n(c.valor), 0);
    const grid = document.createElement("div");
    grid.className = "summary-grid";
    grid.innerHTML = kpiCard("Total de Custos Fixos (mensal)", fmtCurrency(total), `${rows.length} custo(s) cadastrado(s)`);
    panel.appendChild(grid);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Nome</th>
        <th>Data</th>
        <th class="num">Valor Mensal (R$)</th>
        <th>Observações</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5"><div class="empty-state">Nenhum custo fixo cadastrado ainda. Clique em "Novo custo fixo".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(c => tbody.appendChild(custoFixoRow(c)));
  }

  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    state.custosFixos.push({ id: uid(), example: false, nome: "", valor: "", data: new Date().toISOString().slice(0, 10), obs: "" });
    saveState();
    renderContent();
  });

  return panel;
}

function custoFixoRow(c) {
  const tr = document.createElement("tr");
  if (c.example) tr.classList.add("example-row");
  tr.innerHTML = `
    <td><input type="text" value="${escapeAttr(c.nome)}" data-field="nome" placeholder="Ex: Contadora"></td>
    <td><input type="text" inputmode="numeric" class="date-input" maxlength="10" value="${formatDateBR(c.data)}" data-field="data" placeholder="dd/mm/aaaa"></td>
    <td class="num"><input type="number" step="0.01" value="${c.valor}" data-field="valor"></td>
    <td><input type="text" value="${escapeAttr(c.obs || "")}" data-field="obs" placeholder="opcional"></td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  const dataEl = tr.querySelector('[data-field="data"]');
  attachDateMask(dataEl, iso => {
    c.data = iso;
    saveState();
  });

  tr.querySelectorAll('[data-field]:not([data-field="data"])').forEach(input => {
    input.addEventListener("input", () => {
      const field = input.dataset.field;
      c[field] = field === "valor" ? n(input.value) : input.value;
      saveState();
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm(`Remover o custo fixo "${c.nome || "(sem nome)"}"?`)) return;
    state.custosFixos = state.custosFixos.filter(x => x.id !== c.id);
    saveState();
    renderContent();
  });

  return tr;
}

/* ---------- Devoluções ---------- */

function renderDevolucoesPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  const rows = state.devolucoes;

  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Devoluções</h1>
        <p class="panel-sub">Selecione o produto pelo pedido (igual ao seletor de filamentos). O Lucro desse pedido nas telas de Lojas, Resumo e KPIs é atualizado sozinho: em "Danificado: Pago pela plataforma" você recebe o valor completo, normalmente, sem custo extra; em "Defeito de fabricação" você não recebe nada e perde embalagem + gasto p/ levar + etiqueta (R$ 0,10) + o valor de devolução que você informar; em arrependimento ou pedido não encontrado, você não recebe nada e só perde embalagem + gasto p/ levar + etiqueta.</p>
      </div>
      <div class="panel-actions">
        <button class="primary-btn" data-action="add-row">+ Nova devolução</button>
      </div>
    </header>
  `;

  if (rows.length > 0) {
    let custoTotalGeral = 0;
    const porCategoria = { defeito: 0, arrependimento: 0, nao_encontrado: 0 };
    rows.forEach(dev => {
      const c = calcDevolucao(dev);
      if (c.custoTotal !== null) custoTotalGeral += c.custoTotal;
      if (dev.categoria && porCategoria[dev.categoria] !== undefined) porCategoria[dev.categoria]++;
    });

    const grid = document.createElement("div");
    grid.className = "summary-grid";
    grid.innerHTML = [
      kpiCard("Devoluções", String(rows.length), "registradas"),
      kpiCard("Custo Total", fmtCurrency(custoTotalGeral), "conforme categoria de cada devolução"),
      kpiCard("Defeito", String(porCategoria.defeito), "danificado ou pago pela plataforma"),
      kpiCard("Arrependimento / Não encontrado", String(porCategoria.arrependimento + porCategoria.nao_encontrado), "sem recebimento"),
    ].join("");
    panel.appendChild(grid);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-produto">Produto</th>
        <th>Loja</th>
        <th>Categoria</th>
        <th>Tipo de Defeito</th>
        <th class="num">Valor da Devolução (R$)</th>
        <th>Data</th>
        <th class="num calc">Custo Total (R$)</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8"><div class="empty-state">Nenhuma devolução registrada ainda. Clique em "Nova devolução".</div></td>`;
    tbody.appendChild(tr);
  } else {
    rows.forEach(dev => tbody.appendChild(devolucaoRow(dev)));
  }

  tableWrap.appendChild(table);
  panel.appendChild(tableWrap);

  panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
    state.devolucoes.push({
      id: uid(), example: false, numeroPedido: "", categoria: "", subtipoDefeito: "", valorDevolucao: "",
      data: new Date().toISOString().slice(0, 10),
    });
    saveState();
    renderContent();
  });

  return panel;
}

// lista de produtos (de todas as lojas, 3D e Produtos) que já têm Nº Pedido preenchido —
// é essa lista que alimenta o seletor de Produto na aba Devoluções, igual ao de filamentos
function buildDevolucaoProductOptions(selectedNumeroPedido) {
  const options = ['<option value="">— selecione o produto —</option>'];
  STORE_META.forEach(meta => {
    state.stores[meta.key].forEach(row => {
      if (!row.numeroPedido) return;
      const label = `${row.produto || "(sem nome)"} — ${row.numeroPedido} (${meta.label})`;
      options.push(`<option value="${escapeAttr(row.numeroPedido)}" ${row.numeroPedido === selectedNumeroPedido ? "selected" : ""}>${escapeHtml(label)}</option>`);
    });
  });
  return options.join("");
}

function devolucaoRow(dev) {
  const tr = document.createElement("tr");
  tr.dataset.rowId = dev.id;
  if (dev.example) tr.classList.add("example-row");

  const catOptions = ['<option value="">—</option>']
    .concat(DEVOLUCAO_CATEGORIAS.map(c => `<option value="${c.key}" ${c.key === dev.categoria ? "selected" : ""}>${c.label}</option>`))
    .join("");

  const subtipoCell = dev.categoria === "defeito"
    ? `<select data-field="subtipoDefeito">${['<option value="">— selecione —</option>']
        .concat(DEFEITO_SUBTIPOS.map(s => `<option value="${s.key}" ${s.key === dev.subtipoDefeito ? "selected" : ""}>${s.label}</option>`))
        .join("")}</select>`
    : `<span class="devolucao-subtipo-vazio">—</span>`;

  const valorDevolucaoCell = dev.subtipoDefeito === "danificado"
    ? `<input type="number" step="0.01" value="${dev.valorDevolucao ?? DEFAULT_VALOR_DEVOLUCAO}" data-field="valorDevolucao" placeholder="Ex: 15,00">`
    : `<span class="devolucao-subtipo-vazio">—</span>`;

  tr.innerHTML = `
    <td class="col-produto"><select data-field="numeroPedido">${buildDevolucaoProductOptions(dev.numeroPedido)}</select></td>
    <td data-out="loja">—</td>
    <td><select data-field="categoria">${catOptions}</select></td>
    <td data-cell="subtipo">${subtipoCell}</td>
    <td class="num" data-cell="valorDevolucao">${valorDevolucaoCell}</td>
    <td><input type="text" inputmode="numeric" class="date-input" maxlength="10" value="${formatDateBR(dev.data)}" data-field="data" placeholder="dd/mm/aaaa"></td>
    <td class="num calc-cell" data-out="custoTotal">—</td>
    <td><button class="icon-btn" data-action="delete" title="Remover">✕</button></td>
  `;

  tr.querySelector('[data-field="categoria"]').addEventListener("input", e => {
    dev.categoria = e.target.value;
    if (dev.categoria !== "defeito") dev.subtipoDefeito = "";
    saveState();
    renderContent(); // precisa refazer a linha pra mostrar/esconder o seletor de sub-tipo e o campo de valor
  });

  const subtipoEl = tr.querySelector('[data-field="subtipoDefeito"]');
  if (subtipoEl) {
    subtipoEl.addEventListener("input", e => {
      dev.subtipoDefeito = e.target.value;
      if (dev.subtipoDefeito === "danificado" && !hasVal(dev.valorDevolucao)) {
        dev.valorDevolucao = DEFAULT_VALOR_DEVOLUCAO; // sugestão inicial — o usuário pode editar
      }
      saveState();
      renderContent(); // precisa refazer a linha pra mostrar/esconder o campo de valor da devolução
    });
  }

  const dataEl = tr.querySelector('[data-field="data"]');
  attachDateMask(dataEl, iso => {
    dev.data = iso;
    saveState();
    updateDevolucaoRowCalcCells(tr, dev);
  });

  tr.querySelectorAll('input[data-field]:not([data-field="data"]), select[data-field]:not([data-field="categoria"]):not([data-field="subtipoDefeito"])').forEach(el => {
    el.addEventListener("input", () => {
      const field = el.dataset.field;
      dev[field] = el.value;
      saveState();
      updateDevolucaoRowCalcCells(tr, dev);
    });
  });

  tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
    if (!confirm("Remover esta devolução?")) return;
    state.devolucoes = state.devolucoes.filter(d => d.id !== dev.id);
    saveState();
    renderContent();
  });

  updateDevolucaoRowCalcCells(tr, dev);
  return tr;
}

function updateDevolucaoRowCalcCells(tr, dev) {
  const c = calcDevolucao(dev);
  const lojaCell = tr.querySelector('[data-out="loja"]');

  if (c.match) {
    lojaCell.innerHTML = `<span class="nav-dot" style="background:${c.match.storeColor}"></span>${c.match.storeLabel}`;
  } else if (dev.numeroPedido) {
    lojaCell.innerHTML = `<span class="devolucao-not-found">produto não encontrado</span>`;
  } else {
    lojaCell.textContent = "—";
  }

  const custoCell = tr.querySelector('[data-out="custoTotal"]');
  if (custoCell) {
    if (c.custoTotal !== null) {
      custoCell.textContent = fmtCurrency(c.custoTotal);
      custoCell.title = "";
    } else if (dev.categoria === "defeito") {
      custoCell.textContent = "—";
      custoCell.title = 'Escolha o tipo de defeito ("Defeito de fabricação" ou "Danificado: Pago pela plataforma") para calcular o custo.';
    } else {
      custoCell.textContent = "—";
      custoCell.title = "";
    }
  }
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
    // o que foi pago em ADS pra essa loja também conta como custo e reduz o lucro
    const gastoAds = adsGastoFiltered({ store: meta.key });
    lucro -= gastoAds;
    const margem = faturamento ? lucro / faturamento : null;
    return { meta, faturamento, recebido, custoTotal, gastoAds, lucro, margem, count: rows.length };
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
      <div class="sub">lucro líquido (já descontando ADS) · ${t.count} produto(s)</div>
    `;
    grid.appendChild(card);
  });
  const gastoAdsGeral = totals.reduce((s, t) => s + t.gastoAds, 0);
  const adsCard = document.createElement("div");
  adsCard.innerHTML = kpiCard("Gasto Total em ADS", fmtCurrency(gastoAdsGeral), "todas as lojas · já descontado do lucro acima");
  grid.appendChild(adsCard.firstElementChild);
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
        <th class="num">Gasto ADS (R$)</th>
        <th class="num">Lucro Total (R$)</th>
        <th class="num">Margem Média</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  let totFat = 0, totRec = 0, totCusto = 0, totAds = 0, totLucro = 0;
  totals.forEach(t => {
    totFat += t.faturamento; totRec += t.recebido; totCusto += t.custoTotal; totAds += t.gastoAds; totLucro += t.lucro;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.meta.label}</td>
      <td class="num">${fmtCurrency(t.faturamento)}</td>
      <td class="num">${fmtCurrency(t.recebido)}</td>
      <td class="num">${fmtCurrency(t.custoTotal)}</td>
      <td class="num">${fmtCurrency(t.gastoAds)}</td>
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
    <td class="num">${fmtCurrency(totAds)}</td>
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

// filtro de período/loja da tela de KPIs — vive só na sessão, não é salvo no banco
let kpiState = { store: "", year: "", month: "" };

const KPI_CATEGORIES = [
  { key: TIPO_3D, label: "Impressão 3D", color: "#FF6A1A" },
  { key: TIPO_REVENDA, label: "Produtos", color: "#1B6B6B" },
];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthLabel(m) {
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]}/${y}`;
}

function kpiCard(label, value, sub) {
  return `<div class="summary-card"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
}

// soma (ou subtrai) meses de uma string "YYYY-MM", tratando virada de ano
function monthAddOffset(monthStr, offset) {
  const [y, m] = monthStr.split("-").map(Number);
  const total = y * 12 + (m - 1) + offset;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12 + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

// lista todos os meses entre "from" e "to" (inclusive), mesmo os que não têm nenhum dado —
// usada pra manter a linha do tempo do gráfico completa, sem "buracos" de meses ausentes
function monthRangeInclusive(from, to) {
  const result = [];
  let cur = from;
  while (true) {
    result.push(cur);
    if (cur === to) break;
    cur = monthAddOffset(cur, 1);
  }
  return result;
}

// Crescimento nos últimos 12 meses: compara o faturamento do mês mais recente com o de 12 meses
// atrás — mas se o histórico for menor que isso, usa o primeiro mês que já teve faturamento
// como ponto de partida, em vez de "quebrar" ou considerar um mês sem dado nenhum.
// Não é afetado pelos filtros de Ano/Mês (sempre olha a janela móvel mais recente); respeita
// só o filtro de loja, porque "kpiRows" já vem filtrado por loja de quem chamou.
function calcCrescimento12Meses(kpiRows) {
  const meses = [...new Set(kpiRows.map(r => r.data.slice(0, 7)))].sort();
  if (meses.length < 2) return { valor: null, detalhe: "dados insuficientes" };

  const ultimoMes = meses[meses.length - 1];
  const primeiroMes = meses[0];
  const janela12 = monthAddOffset(ultimoMes, -11);
  const mesBase = primeiroMes > janela12 ? primeiroMes : janela12;

  if (mesBase === ultimoMes) return { valor: null, detalhe: "dados insuficientes" };

  const faturamentoDoMes = m => kpiRows.filter(r => r.data.slice(0, 7) === m).reduce((s, r) => s + n(r.precoVenda), 0);
  const fatBase = faturamentoDoMes(mesBase);
  const fatUltimo = faturamentoDoMes(ultimoMes);

  if (fatBase <= 0) return { valor: null, detalhe: "sem faturamento no mês inicial" };

  return {
    valor: (fatUltimo - fatBase) / fatBase,
    detalhe: `${monthLabel(mesBase)} → ${monthLabel(ultimoMes)}`,
  };
}

function renderKpisPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";

  // só entram nos KPIs pedidos reais (sem os produtos de exemplo) com data preenchida
  const kpiRowsAll = allRows().filter(r => !r.example && r.data);

  if (kpiState.store && !STORE_META.some(s => s.key === kpiState.store)) kpiState.store = "";
  const kpiRows = kpiState.store ? kpiRowsAll.filter(r => r._storeKey === kpiState.store) : kpiRowsAll;

  const years = [...new Set(kpiRows.map(r => r.data.slice(0, 4)))].sort();
  const months = [...new Set(kpiRows.map(r => r.data.slice(0, 7)))].sort();

  if (kpiState.year && !years.includes(kpiState.year)) { kpiState.year = ""; kpiState.month = ""; }
  if (kpiState.month && kpiState.month.slice(0, 4) !== kpiState.year) kpiState.month = "";
  if (kpiState.month && !months.includes(kpiState.month)) kpiState.month = "";

  const monthsInYear = months.filter(m => !kpiState.year || m.slice(0, 4) === kpiState.year);

  const storeOptions = ['<option value="">Todas as lojas</option>']
    .concat(STORE_META.map(s => `<option value="${s.key}" ${s.key === kpiState.store ? "selected" : ""}>${s.label}</option>`))
    .join("");
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
        <select id="kpi-store">${storeOptions}</select>
        <select id="kpi-year">${yearOptions}</select>
        <select id="kpi-month">${monthOptions}</select>
      </div>
    </header>
  `;

  const bindFilters = () => {
    panel.querySelector("#kpi-store").addEventListener("change", e => {
      kpiState.store = e.target.value;
      renderContent();
    });
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

  let faturamento = 0, custoTotal = 0, lucro = 0, devolvidos = 0;
  const pedidos = filtered.length;
  filtered.forEach(row => {
    const c = calcRow(row);
    faturamento += n(row.precoVenda);
    custoTotal += c.custoTotal;
    lucro += c.lucro !== null ? c.lucro : 0;
    if (row.numeroPedido && findDevolucaoByOrderNumber(row.numeroPedido)) devolvidos++;
  });

  // o que foi pago em ADS no mesmo período/loja filtrados também conta como custo e reduz o lucro
  const gastoAds = adsGastoFiltered({ store: kpiState.store, year: kpiState.year, month: kpiState.month });
  lucro -= gastoAds;

  // custos fixos do mesmo período (não são por loja) também contam como custo e reduzem o lucro
  const gastoCustosFixos = custosFixosGastoFiltered({ year: kpiState.year, month: kpiState.month });
  lucro -= gastoCustosFixos;

  const margem = faturamento ? lucro / faturamento : null;
  const ticket = pedidos ? faturamento / pedidos : null;
  const taxaDevolucao = pedidos ? devolvidos / pedidos : null;

  const crescimento = calcCrescimento12Meses(kpiRows);

  const grid = document.createElement("div");
  grid.className = "summary-grid";
  grid.innerHTML = [
    kpiCard("Faturamento", fmtCurrency(faturamento), `${pedidos} pedido(s)`),
    kpiCard("Lucro Líquido", fmtCurrency(lucro), margem !== null ? `margem ${fmtPercent(margem)}` : "—"),
    kpiCard("Custo Total", fmtCurrency(custoTotal), "filamento + energia + taxas + embalagem"),
    kpiCard("Gasto ADS", fmtCurrency(gastoAds), "já descontado do lucro líquido"),
    kpiCard("Custos Fixos", fmtCurrency(gastoCustosFixos), "já descontado do lucro líquido"),
    kpiCard("Ticket Médio", ticket !== null ? fmtCurrency(ticket) : "—", "por pedido"),
    kpiCard("Devoluções", String(devolvidos), taxaDevolucao !== null ? `${fmtPercent(taxaDevolucao)} dos pedidos` : "sem pedidos"),
    kpiCard("Crescimento (12 meses)", crescimento.valor !== null ? fmtPercent(crescimento.valor) : "—", crescimento.detalhe),
  ].join("");
  panel.appendChild(grid);

  panel.appendChild(renderRevenueChart(kpiRows, months));
  if (!kpiState.store) panel.appendChild(renderKpiStoreBreakdown(filtered));
  panel.appendChild(renderKpiCategoryBreakdown(filtered));
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
    // preenche os meses "vazios" entre o primeiro e o último mês com venda, pra manter a
    // linha do tempo completa mesmo quando não vendeu nada em algum mês do meio
    const monthsRange = allMonths.length ? monthRangeInclusive(allMonths[0], allMonths[allMonths.length - 1]) : [];
    bars = monthsRange.map(m => {
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

function renderKpiCategoryBreakdown(rows) {
  const wrap = document.createElement("div");
  wrap.className = "panel-block";
  wrap.innerHTML = `<h2 class="block-title">Por categoria (período selecionado)</h2>`;

  const byCat = KPI_CATEGORIES.map(cat => {
    const catRows = rows.filter(r => r.tipo === cat.key);
    let fat = 0;
    catRows.forEach(r => { fat += n(r.precoVenda); });
    return { cat, fat, count: catRows.length };
  });
  const total = byCat.reduce((sum, x) => sum + x.fat, 0);

  const pieWrap = document.createElement("div");
  pieWrap.className = "pie-wrap";

  if (total <= 0) {
    pieWrap.innerHTML = `<div class="empty-state">Sem faturamento nesse período.</div>`;
    wrap.appendChild(pieWrap);
    return wrap;
  }

  let acc = 0;
  const slices = byCat.filter(x => x.fat > 0).map(x => {
    const start = (acc / total) * 360;
    acc += x.fat;
    const end = (acc / total) * 360;
    return `${x.cat.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
  }).join(", ");

  const pie = document.createElement("div");
  pie.className = "pie-chart";
  pie.style.background = `conic-gradient(${slices})`;
  pieWrap.appendChild(pie);

  const legend = document.createElement("div");
  legend.className = "pie-legend";
  legend.innerHTML = byCat.map(x => {
    const pct = total ? (x.fat / total) * 100 : 0;
    return `
      <div class="pie-legend-item">
        <span class="nav-dot" style="background:${x.cat.color}"></span>
        <span class="pie-legend-label">${x.cat.label}</span>
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

/* ---------- Aprovações (só visível pra você, o dono da conta) ---------- */

function renderAprovacoesPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Aprovações</h1>
        <p class="panel-sub">Cadastros aguardando sua aprovação pra poder entrar no sistema.</p>
      </div>
    </header>
    <div id="aprovacoes-body"><div class="empty-state">Carregando...</div></div>
  `;

  const body = panel.querySelector("#aprovacoes-body");

  async function load() {
    body.innerHTML = `<div class="empty-state">Carregando...</div>`;
    try {
      const res = await fetch("/api/admin-pending");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const { pending: users } = await res.json();
      if (!users || users.length === 0) {
        body.innerHTML = `<div class="empty-state">Nenhum cadastro pendente no momento.</div>`;
        return;
      }
      const table = document.createElement("table");
      table.className = "data-table";
      table.innerHTML = `
        <thead><tr><th>E-mail</th><th>Cadastrado em</th><th></th></tr></thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector("tbody");
      users.forEach(u => {
        const tr = document.createElement("tr");
        const data = new Date(u.created_at).toLocaleString("pt-BR");
        tr.innerHTML = `
          <td>${escapeHtml(u.email)}</td>
          <td>${data}</td>
          <td class="row-actions">
            <button class="primary-btn small" data-action="approve" data-id="${u.id}">Aprovar</button>
            <button class="ghost-btn small" data-action="reject" data-id="${u.id}">Rejeitar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      wrap.appendChild(table);
      body.innerHTML = "";
      body.appendChild(wrap);

      body.querySelectorAll('[data-action="approve"], [data-action="reject"]').forEach(btn => {
        btn.addEventListener("click", async () => {
          const action = btn.dataset.action === "approve" ? "approve" : "reject";
          btn.disabled = true;
          try {
            const res = await fetch("/api/admin-approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: btn.dataset.id, action }),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            showToast(action === "approve" ? "Cadastro aprovado." : "Cadastro rejeitado.");
            load();
          } catch (e) {
            console.error(e);
            showToast("⚠ Não foi possível concluir a ação.");
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      console.error(e);
      body.innerHTML = `<div class="empty-state">Não foi possível carregar os pendentes agora.</div>`;
    }
  }

  load();
  return panel;
}

function renderPremiumLockPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="empty-state premium-lock">
      <p class="premium-lock-title">🔒 Seu período de teste acabou</p>
      <p class="panel-sub">Fale com o administrador pra continuar usando essa área.</p>
      <button class="primary-btn" id="btn-request-premium">✨ Torne-se premium</button>
    </div>
  `;
  panel.querySelector("#btn-request-premium").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "Enviando...";
    await requestPremium();
    btn.disabled = false;
    btn.textContent = "✨ Torne-se premium";
  });
  return panel;
}

function renderUsuariosPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Usuários</h1>
        <p class="panel-sub">Todos os cadastros da plataforma — status, trial e bloqueio.</p>
      </div>
    </header>
    <div id="usuarios-body"><div class="empty-state">Carregando...</div></div>
  `;

  const body = panel.querySelector("#usuarios-body");

  function fmtData(v) {
    return v ? new Date(v).toLocaleString("pt-BR") : "—";
  }

  function statusLabel(u) {
    if (u.status === "pending") return "Pendente";
    if (u.status === "rejected") return "Rejeitado";
    if (u.blocked_at) return "Bloqueado";
    if (u.trial_ends_at && new Date(u.trial_ends_at) < new Date()) return "Trial expirado";
    return "Ativo";
  }

  async function runAction(btn, userId, act, extra) {
    btn.disabled = true;
    try {
      const res = await fetch("/api/admin-user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: act, ...extra }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      await load();
      return true;
    } catch (e) {
      console.error(e);
      showToast("⚠ Não foi possível concluir a ação.");
      btn.disabled = false;
      return false;
    }
  }

  async function load() {
    body.innerHTML = `<div class="empty-state">Carregando...</div>`;
    try {
      const res = await fetch("/api/admin-users");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const { users } = await res.json();
      if (!users || users.length === 0) {
        body.innerHTML = `<div class="empty-state">Nenhum usuário cadastrado ainda.</div>`;
        return;
      }

      const table = document.createElement("table");
      table.className = "data-table";
      table.innerHTML = `
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Status</th>
            <th>Cadastrado em</th>
            <th>Trial até</th>
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector("tbody");

      users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(u.email)}</td>
          <td>${statusLabel(u)}</td>
          <td>${fmtData(u.created_at)}</td>
          <td>${fmtData(u.trial_ends_at)}</td>
          <td class="usuarios-actions row-actions"></td>
        `;

        const actionsCell = tr.querySelector(".usuarios-actions");
        if (u.status === "approved") {
          const btn7 = document.createElement("button");
          btn7.className = "ghost-btn small";
          btn7.textContent = "+7 dias trial";
          btn7.addEventListener("click", () => runAction(btn7, u.id, "extend_trial", { days: 7 }));
          actionsCell.appendChild(btn7);

          const btn30 = document.createElement("button");
          btn30.className = "ghost-btn small";
          btn30.textContent = "+30 dias trial";
          btn30.addEventListener("click", () => runAction(btn30, u.id, "extend_trial", { days: 30 }));
          actionsCell.appendChild(btn30);

          const btnExpire = document.createElement("button");
          btnExpire.className = "ghost-btn small";
          btnExpire.textContent = "Expirar trial agora";
          btnExpire.title = "Força o trial pro passado — útil pra testar o bloqueio das abas";
          btnExpire.addEventListener("click", () => {
            if (!confirm("Expirar o trial desse usuário agora? As abas dele ficam travadas imediatamente.")) return;
            runAction(btnExpire, u.id, "expire_trial");
          });
          actionsCell.appendChild(btnExpire);

          const btnClear = document.createElement("button");
          btnClear.className = "ghost-btn small";
          btnClear.textContent = "Remover limite de trial";
          btnClear.addEventListener("click", () => runAction(btnClear, u.id, "clear_trial"));
          actionsCell.appendChild(btnClear);

          const btnBlock = document.createElement("button");
          btnBlock.className = "ghost-btn small";
          btnBlock.textContent = u.blocked_at ? "Desbloquear" : "Bloquear";
          btnBlock.addEventListener("click", () => {
            if (!confirm(u.blocked_at ? "Desbloquear esse usuário?" : "Bloquear o acesso desse usuário?")) return;
            runAction(btnBlock, u.id, u.blocked_at ? "unblock" : "block");
          });
          actionsCell.appendChild(btnBlock);
        } else {
          actionsCell.textContent = "—";
        }

        tbody.appendChild(tr);
      });

      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      wrap.appendChild(table);
      body.innerHTML = "";
      body.appendChild(wrap);
    } catch (e) {
      console.error(e);
      body.innerHTML = `<div class="empty-state">Não foi possível carregar os usuários agora.</div>`;
    }
  }

  load();
  return panel;
}

function renderTicketsPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <h1 class="page-title">Tickets</h1>
        <p class="panel-sub">Mensagens enviadas por usuários bloqueados ou pelo botão de suporte.</p>
      </div>
    </header>
    <div id="tickets-body"><div class="empty-state">Carregando...</div></div>
  `;

  const body = panel.querySelector("#tickets-body");

  function fmtData(v) {
    return v ? new Date(v).toLocaleString("pt-BR") : "—";
  }

  async function load() {
    body.innerHTML = `<div class="empty-state">Carregando...</div>`;
    try {
      const res = await fetch("/api/admin-tickets");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const { tickets } = await res.json();
      if (!tickets || tickets.length === 0) {
        body.innerHTML = `<div class="empty-state">Nenhum ticket enviado ainda.</div>`;
        return;
      }

      const list = document.createElement("div");
      list.className = "tickets-list";

      tickets.forEach(t => {
        const card = document.createElement("div");
        card.className = "ticket-card" + (t.status === "closed" ? " closed" : "");
        card.innerHTML = `
          <div class="ticket-card-header">
            <div>
              <strong>${escapeHtml(t.user_email)}</strong>
              <span class="ticket-status ${t.status}">${t.status === "open" ? "Aberto" : "Resolvido"}</span>
            </div>
            <span class="ticket-date">${fmtData(t.created_at)}</span>
          </div>
          ${t.subject ? `<p class="ticket-subject">${escapeHtml(t.subject)}</p>` : ""}
          <p class="ticket-message">${escapeHtml(t.message)}</p>
          <div class="row-actions"></div>
        `;

        const actions = card.querySelector(".row-actions");
        const btn = document.createElement("button");
        btn.className = "ghost-btn small";
        btn.textContent = t.status === "open" ? "Marcar como resolvido" : "Reabrir";
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const res = await fetch("/api/admin-ticket-action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticketId: t.id, action: t.status === "open" ? "close" : "reopen" }),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            load();
          } catch (e) {
            console.error(e);
            showToast("⚠ Não foi possível concluir a ação.");
            btn.disabled = false;
          }
        });
        actions.appendChild(btn);

        list.appendChild(card);
      });

      body.innerHTML = "";
      body.appendChild(list);
    } catch (e) {
      console.error(e);
      body.innerHTML = `<div class="empty-state">Não foi possível carregar os tickets agora.</div>`;
    }
  }

  load();
  return panel;
}

/* ===================== Suporte: botão flutuante de ticket ===================== */

function renderFloatingTicketButton() {
  if (document.getElementById("floating-ticket-btn")) return;

  const btn = document.createElement("button");
  btn.id = "floating-ticket-btn";
  btn.className = "floating-ticket-btn";
  btn.title = "Falar com o suporte";
  btn.textContent = "💬";
  btn.addEventListener("click", () => openTicketModal());
  document.body.appendChild(btn);
}

function openTicketModal() {
  if (document.getElementById("ticket-modal-backdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.id = "ticket-modal-backdrop";
  backdrop.className = "ticket-modal-backdrop";
  backdrop.innerHTML = `
    <div class="ticket-modal">
      <h3>Falar com o suporte</h3>
      <form id="ticket-modal-form" class="auth-form">
        <label>Assunto (opcional)<input type="text" id="ticket-modal-subject" maxlength="200"></label>
        <label>Mensagem<textarea id="ticket-modal-message" required rows="4" style="width:100%; font-family:inherit; padding:8px; border-radius:8px;"></textarea></label>
        <div class="row-actions" style="justify-content:flex-end;">
          <button type="button" class="ghost-btn small" id="ticket-modal-cancel">Cancelar</button>
          <button type="submit" class="primary-btn small" id="ticket-modal-submit">Enviar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });
  backdrop.querySelector("#ticket-modal-cancel").addEventListener("click", close);

  backdrop.querySelector("#ticket-modal-form").addEventListener("submit", async e => {
    e.preventDefault();
    const subject = backdrop.querySelector("#ticket-modal-subject").value.trim();
    const message = backdrop.querySelector("#ticket-modal-message").value.trim();
    const submitBtn = backdrop.querySelector("#ticket-modal-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      close();
      showToast("Ticket enviado! O administrador vai analisar em breve.");
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar";
      showToast("⚠ Não foi possível enviar o ticket agora.");
    }
  });
}

/* ===================== Export / Import ===================== */

function exportStoreCSV(storeKey) {
  const meta = STORE_META.find(s => s.key === storeKey);
  const is3D = storeViewType === "3d";
  const rows = state.stores[storeKey].filter(r => is3D ? r.tipo !== TIPO_REVENDA : r.tipo === TIPO_REVENDA);

  const headers = is3D
    ? ["Produto", "Data", "Nº Pedido", "Impressora", "Filamento", "Embalagem", "Venda (R$)", "Recebido (R$)",
      "Taxa (R$)", "Taxa (%)", "Taxa ME", "Taxa ME (R$)", "Peso (g)", "Tempo (h)", "Filamento (R$)", "Energia (R$)",
      "Embalagem (R$)", "Gasto p/ Levar (R$)", "Etiqueta (R$)", "Custo Total (R$)", "Lucro (R$)", "Margem (%)"]
    : ["Produto", "Data", "Nº Pedido", "Embalagem", "Venda (R$)", "Recebido (R$)", "Taxa (R$)", "Taxa (%)", "Taxa ME", "Taxa ME (R$)",
      "Insumos (R$)", "Embalagem (R$)", "Gasto p/ Levar (R$)", "Etiqueta (R$)", "Custo Total (R$)", "Lucro (R$)", "Margem (%)"];

  const lines = [headers.join(";")];
  rows.forEach(row => {
    const c = calcRow(row);
    const filName = state.filaments.find(f => f.id === row.filamentoId)?.nome || "";
    const packName = state.packagings.find(p => p.id === row.embalagemId)?.nome || "";
    const taxaMELabel = TAXA_ME_OPCOES.find(o => o.key === row.taxaMETipo)?.label || "Não incluir";
    const cells = is3D
      ? [
        row.produto, formatDateBR(row.data), row.numeroPedido || "", row.impressora, filName, packName,
        row.precoVenda, row.recebido,
        c.taxaRS ?? "", c.taxaPct !== null ? (c.taxaPct * 100).toFixed(1) : "",
        taxaMELabel, c.custoTaxaME.toFixed(2),
        row.peso, row.tempo,
        c.custoFilamento.toFixed(2), c.custoEnergia.toFixed(2),
        c.custoEmbalagem.toFixed(2), row.gastoLevar, c.custoEtiqueta.toFixed(2),
        c.custoTotal.toFixed(2), c.lucro !== null ? c.lucro.toFixed(2) : "",
        c.margem !== null ? (c.margem * 100).toFixed(1) : "",
      ]
      : [
        row.produto, formatDateBR(row.data), row.numeroPedido || "", packName,
        row.precoVenda, row.recebido,
        c.taxaRS ?? "", c.taxaPct !== null ? (c.taxaPct * 100).toFixed(1) : "",
        taxaMELabel, c.custoTaxaME.toFixed(2),
        row.insumos, c.custoEmbalagem.toFixed(2), row.gastoLevar, c.custoEtiqueta.toFixed(2),
        c.custoTotal.toFixed(2), c.lucro !== null ? c.lucro.toFixed(2) : "",
        c.margem !== null ? (c.margem * 100).toFixed(1) : "",
      ];
    lines.push(cells.map(v => String(v).replace(".", ",").replace(";", ",")).join(";"));
  });

  const sufixo = is3D ? "3D" : "Produtos";
  downloadFile(`${meta.label.replace(/\s+/g, "_")}_${sufixo}.csv`, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
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

/* ===================== Tema claro/escuro ===================== */

const THEME_KEY = "gestaoLojas3D_theme";
let theme = localStorage.getItem(THEME_KEY) || "light";

function applyTheme() {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("btn-theme-toggle");
  if (btn) {
    const isDark = theme === "dark";
    btn.querySelector(".btn-icon").textContent = isDark ? "☀" : "☾";
    btn.querySelector(".btn-label").textContent = isDark ? "Modo claro" : "Modo escuro";
    btn.title = isDark ? "Mudar para modo claro" : "Mudar para modo escuro";
  }
}

document.getElementById("btn-theme-toggle").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
});

applyTheme();

/* ===================== Init =====================
   Diferente de antes, o app não inicia sozinho ao carregar o script: quem decide a hora
   certa de chamar startApp() é o auth.js, depois de confirmar que existe uma sessão válida
   (usuário logado e aprovado). Antes disso, é a tela de login/cadastro que fica visível. */

async function startApp() {
  try {
    state = await dbLoadState();
  } catch (e) {
    console.error("Falha ao carregar dados salvos, usando padrão.", e);
    showToast("⚠ Não foi possível carregar seus dados agora. Tente recarregar a página.");
    state = defaultState();
  }
  renderNav();
  renderContent();
  renderBrand();
  renderAccountBadge();
  applySidebarState();
  if (!window.isAdmin) renderFloatingTicketButton();
}

function renderAccountBadge() {
  const hint = document.getElementById("current-user-hint");
  if (!hint) return;

  const email = window.userEmail || "";

  if (window.isAdmin) {
    hint.innerHTML = `
      <span class="account-email">${escapeHtml(email)} · admin</span>
      <span class="account-access premium">👑 Premium</span>
    `;
    return;
  }

  if (!window.trialEndsAt) {
    hint.innerHTML = `
      <span class="account-email">${escapeHtml(email)}</span>
      <span class="account-access premium">👑 Premium</span>
    `;
    return;
  }

  const trialDate = new Date(window.trialEndsAt);
  const diasRestantes = Math.ceil((trialDate - new Date()) / (1000 * 60 * 60 * 24));

  if (window.hasAccess) {
    hint.innerHTML = `
      <span class="account-email">${escapeHtml(email)}</span>
      <span class="account-access trial">🕐 Trial: ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} restante${diasRestantes === 1 ? "" : "s"}</span>
    `;
  } else {
    hint.innerHTML = `
      <span class="account-email">${escapeHtml(email)}</span>
      <span class="account-access expired">Trial expirado — <a href="#" id="account-upgrade-link">torne-se premium</a></span>
    `;
    const link = document.getElementById("account-upgrade-link");
    if (link) link.addEventListener("click", e => { e.preventDefault(); requestPremium(); });
  }
}

async function requestPremium() {
  try {
    await fetch("/api/request-premium", { method: "POST" });
  } catch (e) {
    console.error(e);
  }
  alert("Pedido enviado! O administrador foi avisado e vai entrar em contato em breve.");
}

window.startApp = startApp;
