const supabaseLogin = window.supabaseClient;

async function verificarLogin() {

  const { data } = await supabaseLogin.auth.getSession();

  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const { data: userData } =
    await supabaseLogin.auth.getUser();

  const role = userData.user?.app_metadata?.role;

  if (role !== "admin") {

    await supabaseLogin.auth.signOut();

    alert("Acesso restrito ao administrador.");

    window.location.href = "index.html";
    return;
  }

}

verificarLogin();

async function carregarUsuario() {

  const { data } = await supabaseLogin.auth.getUser();

  if (data.user) {
    const email = data.user.email;
    const nome = email.split("@")[0];

    document.getElementById("adminNome").innerText =
      nome.charAt(0).toUpperCase() + nome.slice(1);
  }
}

carregarUsuario();

async function logout() {
  await supabaseLogin.auth.signOut();
  window.location.href = "index.html";
}

let todosLeads = [];
let graficoModelo;
let graficoTipo;
let graficoTemporal;
let graficoConversao;
let paginaAtual = 1;
const itensPorPagina = 8;
let campoOrdenacao = null;
let ordemAsc = true;

const coresTipo = {
  "Site Institucional": "#3B82F6",                  // azul
  "Sistema Personalizado": "#22C55E",               // verde
  "Plataforma de Gestão": "#F59E0B",                // laranja
  "Solução com Inteligência Artificial": "#8B5CF6",// roxo
  "Outro": "#64748B"                                // cinza
};

const META_ANUAL = 81000; // ajuste
const META_RECORRENTE_MENSAL = 6750; // meta recorrente mensal

// ================= CARREGAR LEADS =================
async function carregarLeads() {

  try {
    const { data, error } = await supabaseLogin
    .from("leads")
    .select("*");

    if (error) throw new Error("Erro ao buscar leads");

    todosLeads = data;

    atualizarDashboard(todosLeads);
    renderizarTabela(todosLeads);
    aplicarFiltros();
    gerarGraficoTipo(todosLeads);
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar leads.");
  }
}

// ================= ATUALIZAR DASHBOARD =================
function atualizarDashboard(leads) {

  document.getElementById("totalLeads").textContent = leads.length;

  let totalInicial = 0;
  let totalMensal = 0;
  let recorrentes = 0;

  const tipoContador = {};
  const modeloContador = {
    projeto: 0,
    recorrente: 0
  };

  leads.forEach(lead => {

    const estimativa = calcularEstimativa(lead);

    // ===============================
    // PROJETO FECHADO
    // ===============================

    if (estimativa.tipoPagamento === "projeto") {
      totalInicial += estimativa.projeto || 0;
      modeloContador.projeto++;
    }

    // ===============================
    // RECORRENTE
    // ===============================

    if (estimativa.tipoPagamento === "recorrente") {

      const setupTotal = (estimativa.setup || 0) * 12;

      totalInicial += setupTotal;
      totalMensal += estimativa.mensalDurante12 || 0;

      recorrentes++;
      modeloContador.recorrente++;
    }

    // ===============================
    // CONTADOR POR TIPO
    // ===============================

    tipoContador[lead.tipo_sistema] =
      (tipoContador[lead.tipo_sistema] || 0) + 1;
  });

  // ===============================
  // PROJEÇÕES
  // ===============================

  const total12Meses =
    totalInicial + (totalMensal * 12);

  const ticketMedio =
    leads.length ? totalInicial / leads.length : 0;

  const percentualRecorrente =
    leads.length ? (recorrentes / leads.length) * 100 : 0;

  // ===============================
  // ATUALIZA DOM
  // ===============================

  document.getElementById("valorInicial").textContent =
    "R$ " + Math.round(totalInicial).toLocaleString();

  document.getElementById("valorMensal").textContent =
    "R$ " + Math.round(totalMensal).toLocaleString();

  document.getElementById("valor12Meses").textContent =
    "R$ " + Math.round(total12Meses).toLocaleString();

  document.getElementById("ticketMedio").textContent =
    "R$ " + Math.round(ticketMedio).toLocaleString();

  document.getElementById("percentualRecorrente").textContent =
    percentualRecorrente.toFixed(1) + "%";

  // ===============================
  // GRÁFICOS
  // ===============================

  gerarGraficoModelo(modeloContador);
  gerarGraficoTipo(leads);
  gerarGraficoTemporal(leads);
  gerarGraficoConversao(todosLeads);

  atualizarMetaAnual(total12Meses);
  atualizarMetaRecorrente(totalMensal);
}
// ================= RENDER TABELA =================
function renderizarTabela(leads) {

  const tbody = document.getElementById("leadsTable");
  tbody.innerHTML = "";

  leads.forEach(lead => {

    const estimativa = calcularEstimativa(lead);

    let estimativaTexto = "";

    if (estimativa.projeto) {
      estimativaTexto =
        `R$ ${estimativa.projeto.toLocaleString()}`;
    }

    if (estimativa.setup && estimativa.mensal) {
      estimativaTexto = `
        Setup: R$ ${estimativa.setup.toLocaleString()}<br>
        Mensal: R$ ${estimativa.mensal.toLocaleString()}
      `;
    }

    const row = `
      <tr>
        <td>${lead.nome}</td>
        <td>${lead.tipo_sistema}</td>
        <td>${lead.modelo_contratacao}</td>
        <td>${estimativaTexto}</td>
        <td>${lead.status || "Novo"}</td>
        <td>
          <button class="btn btn-sm btn-outline-light"
            onclick='abrirDetalhes(${JSON.stringify(lead)})'>
            Ver
          </button>
        </td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
}

// ================= GRÁFICO MODELO =================
function gerarGraficoModelo(dados) {

  if (graficoModelo) graficoModelo.destroy();

  graficoModelo = new Chart(
    document.getElementById("graficoModelo"),
    {
      type: "doughnut",
      data: {
        labels: ["Projeto", "Recorrente"],
        datasets: [{
          data: [dados.projeto, dados.recorrente],
          backgroundColor: ["#6366F1", "#22C55E"]
        }]
      }
    }
  );
}

// ================= GRÁFICO TIPO =================
function gerarGraficoTipo(leads) {

  if (!Array.isArray(leads)) return;
  if (graficoTipo) graficoTipo.destroy();

  const filtroPeriodo = document.getElementById("filtroGraficoTipo").value;
  const modo = document.getElementById("modoGraficoTipo").value;
  const anoAtual = new Date().getFullYear();

  const agrupado = {};

  leads.forEach(lead => {

    if (filtroPeriodo === "ano") {
      const data = new Date(lead.created_at);
      if (data.getFullYear() !== anoAtual) return;
    }

    const tipo = lead.tipo_sistema || "Outro";

    if (!agrupado[tipo]) {
      agrupado[tipo] = {
        quantidade: 0,
        receita: 0
      };
    }

    agrupado[tipo].quantidade++;

    const estimativa = calcularEstimativa(lead);

    if (estimativa.projeto) {
      agrupado[tipo].receita += estimativa.projeto;
    }

    if (estimativa.setup) {
      agrupado[tipo].receita += estimativa.setup;
    }
  });

  const ordenado = Object.entries(agrupado)
    .sort((a, b) =>
      modo === "quantidade"
        ? b[1].quantidade - a[1].quantidade
        : b[1].receita - a[1].receita
    );

  const labels = ["Leads"]; // label único para eixo X

  const datasets = ordenado.map(([tipo, dados]) => {

    const valor = modo === "quantidade"
      ? dados.quantidade
      : dados.receita;

    return {
      label: tipo,
      data: [valor],
      backgroundColor: coresTipo[tipo] || "#64748B",
      borderRadius: 6
    };
  });

  graficoTipo = new Chart(
    document.getElementById("graficoTipo"),
    {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#cbd5e1"
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const valor = context.raw;
                return modo === "receita"
                  ? context.dataset.label + ": R$ " + valor.toLocaleString()
                  : context.dataset.label + ": " + valor;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { display: false },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: "#94a3b8",
              callback: function(value) {
                if (modo === "receita") {
                  return "R$ " + value.toLocaleString();
                }
                return value;
              }
            },
            grid: { color: "rgba(148,163,184,0.1)" }
          }
        }
      },
      plugins: [{
        id: "valorAcimaBarra",
        afterDatasetsDraw(chart) {

          const { ctx } = chart;

          chart.data.datasets.forEach((dataset, i) => {

            const meta = chart.getDatasetMeta(i);

            meta.data.forEach((bar) => {

              const valor = dataset.data[0];

              ctx.save();
              ctx.fillStyle = "#cbd5e1";
              ctx.font = "bold 12px sans-serif";
              ctx.textAlign = "center";

              const texto = modo === "receita"
                ? "R$ " + valor.toLocaleString()
                : valor;

              ctx.fillText(texto, bar.x, bar.y - 6);
              ctx.restore();
            });
          });
        }
      }]
    }
  );
}

function gerarGraficoTemporal(leads) {

  if (graficoTemporal) graficoTemporal.destroy();

  const anoAtual = new Date().getFullYear();

  // Estrutura fixa 12 meses
  const meses = {};

  leads.forEach(lead => {

    const data = new Date(lead.created_at);

    if (data.getFullYear() !== anoAtual) return;

    const mesIndex = data.getMonth(); // 0-11

    meses[mesIndex] = (meses[mesIndex] || 0) + 1;
  });

  const labels = [];
  const valores = [];

  for (let i = 0; i < 12; i++) {

    const nomeMes = new Date(anoAtual, i)
      .toLocaleString("pt-BR", { month: "short" });

    labels.push(nomeMes);
    valores.push(meses[i] || 0);
  }

  graficoTemporal = new Chart(
    document.getElementById("graficoTemporal"),
    {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Leads Criados",
          data: valores,
          borderColor: "#3B82F6",
          backgroundColor: "transparent",
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#cbd5e1" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148,163,184,0.1)" }
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148,163,184,0.1)" }
          }
        }
      }
    }
  );
}

function gerarGraficoConversao(leads) {

  if (graficoConversao) graficoConversao.destroy();

  const anoAtual = new Date().getFullYear();

  // Estrutura base por mês
  const meses = {};

  const statusList = [
    "Novo",
    "Contato",
    "Proposta",
    "Contrato",
    "Fechado"
  ];

  leads.forEach(lead => {

    const data = new Date(lead.created_at);
    if (data.getFullYear() !== anoAtual) return;

    const mesIndex = data.getMonth();

    if (!meses[mesIndex]) {
      meses[mesIndex] = {};
      statusList.forEach(status => {
        meses[mesIndex][status] = 0;
      });
    }

    const status = lead.status || "Novo";

    if (statusList.includes(status)) {
      meses[mesIndex][status]++;
    }
  });

  const labels = [];
  const datasets = [];

  // Gerar labels (12 meses fixos)
  for (let i = 0; i < 12; i++) {
    const nomeMes = new Date(anoAtual, i)
      .toLocaleString("pt-BR", { month: "short" });
    labels.push(nomeMes);
  }

  // Cores estratégicas por estágio
  const cores = {
    "Novo": "#3B82F6",        // azul
    "Contato": "#F59E0B",     // amarelo
    "Proposta": "#8B5CF6",    // roxo
    "Contrato": "#06B6D4",    // ciano
    "Fechado": "#22C55E"      // verde
  };

  statusList.forEach(status => {

    const dataStatus = [];

    for (let i = 0; i < 12; i++) {
      dataStatus.push(meses[i]?.[status] || 0);
    }

    datasets.push({
      label: status,
      data: dataStatus,
      borderColor: cores[status],
      backgroundColor: "transparent",
      tension: 0.35,
      borderWidth: 2
    });

  });

  graficoConversao = new Chart(
    document.getElementById("graficoConversao"),
    {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: "#cbd5e1"
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148,163,184,0.1)" }
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148,163,184,0.1)" }
          }
        }
      }
    }
  );
}

function atualizarMetaAnual(total12Meses) {

  const percentual = Math.min((total12Meses / META_ANUAL) * 100, 100);

  const barra = document.getElementById("barraMetaAnual");
  barra.style.width = percentual + "%";
  barra.textContent = percentual.toFixed(1) + "%";

  document.getElementById("textoMetaAnual").textContent =
    `R$ ${total12Meses.toLocaleString()} de R$ ${META_ANUAL.toLocaleString()}`;
}

function atualizarMetaRecorrente(totalMensal) {

  const percentual = Math.min((totalMensal / META_RECORRENTE_MENSAL) * 100, 100);

  const barra = document.getElementById("barraMetaRecorrente");
  barra.style.width = percentual + "%";
  barra.textContent = percentual.toFixed(1) + "%";

  document.getElementById("textoMetaRecorrente").textContent =
    `R$ ${totalMensal.toLocaleString()} de R$ ${META_RECORRENTE_MENSAL.toLocaleString()}`;
}

async function atualizarStatus(id) {

  const novoStatus =
    document.getElementById("statusSelect").value;

  try {

    // Atualiza lead
    const { error } = await supabaseLogin
      .from("leads")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) throw error;
    
    // Atualiza cliente se existir
    const { data: cliente } = await supabaseLogin
    .from("clientes")
    .select("id")
    .eq("lead_id", id)
    .maybeSingle();

  if (cliente) {

    await supabaseLogin
      .from("clientes")
      .update({ status: novoStatus })
      .eq("id", cliente.id);

  }
    if (cliente) throw cliente;

    // ======================
    // 📝 Proposta
    // ======================
    if (novoStatus === "Proposta") {
      await liberarPortal(id);
    }

    showToast("Status atualizado com sucesso");

    carregarLeads();

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("leadModal")
    );
    modal.hide();

  } catch (error) {

    console.error(error);
    showToast("Erro ao atualizar status");

  }

}

async function liberarPortal(leadId) {

  if (!leadId) {
    showToast("Lead inválido.", false);
    return;
  }

  try {

    const { data, error } =
      await window.supabaseClient.functions.invoke(
        "liberar-portal-cliente",
        {
          body: {
            lead_id: leadId
          }
        }
      );

    if (error) {
      throw error;
    }

    showToast("Portal liberado com sucesso 🚀");
    console.log("Resposta:", data);

  } catch (error) {

    console.error("Erro liberarPortal:", error);
    showToast("Erro ao liberar portal.", false);
  }
}


async function enviarNewsletterAdmin() {

  const subject = "teste newsletter";
  const content = "teste newsletter botão dashboard detalhes";

  if (!subject || !content) {
    showToast("Preencha assunto e conteúdo.", false);
    return;
  }

  const { data } = await window.supabaseClient.auth.getSession();
console.log(data);

  try {

    const { data, error } =
      await window.supabaseClient.functions.invoke(
        "send-newsletter",
        {
          body: {
            subject,
            content
          }
        }
      );

    if (error) {
      throw error;
    }

    showToast(`Newsletter enviada com sucesso 🚀 (${data?.total_enviados || 0} enviados)`);

  } catch (error) {
    console.error("Newsletter error:", error);
    showToast("Erro ao enviar newsletter.", false);
  }

}

async function gerarPreview(template) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-preview-link`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ template }),
    }
  );

  const data = await response.json();

  if (data.url) {
    navigator.clipboard.writeText(data.url);
    alert("Link copiado para área de transferência!");
  } else {
    alert("Erro ao gerar preview");
  }
}

// ================= FILTRO STATUS =================
document.getElementById("filtroStatus")
  ?.addEventListener("change", function () {

    const valor = this.value;

    if (!valor) {
      atualizarDashboard(todosLeads);
      renderizarTabela(todosLeads);
      return;
    }

    const filtrados = todosLeads.filter(
      l => (l.status || "Novo") === valor
    );

    atualizarDashboard(filtrados);
    renderizarTabela(todosLeads);
  });


function aplicarFiltros() {

  const termo = document.getElementById("searchInput").value.toLowerCase();
  const statusFiltro = document.getElementById("filtroStatusTabela").value;
  const tipoFiltro = document.getElementById("filtroTipoTabela").value;

  let filtrados = todosLeads.filter(lead => {

    const matchBusca =
      lead.nome.toLowerCase().includes(termo) ||
      lead.email.toLowerCase().includes(termo);

    const matchStatus =
      !statusFiltro || lead.status === statusFiltro;

    const matchTipo =
      !tipoFiltro || lead.tipo_sistema === tipoFiltro;

    return matchBusca && matchStatus && matchTipo;
  });

  if (campoOrdenacao) {
    filtrados.sort((a, b) => {
      const valorA = a[campoOrdenacao] || "";
      const valorB = b[campoOrdenacao] || "";

      if (ordemAsc) {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  }

  renderizarTabela(filtrados);
}

function renderizarTabela(leads) {

  const tbody = document.getElementById("leadsTable");
  tbody.innerHTML = "";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  const paginaLeads = leads.slice(inicio, fim);

  paginaLeads.forEach(lead => {

    const estimativa = calcularEstimativa(lead);

let estimativaTexto = "";

if (estimativa.tipoPagamento === "projeto") {
  estimativaTexto = `
    R$ ${estimativa.projeto.toLocaleString()}
    <br>
    <small>${estimativa.horasEstimadas}h • ${estimativa.mesesEstimados} mês(es)</small>
  `;
} else {
  estimativaTexto = `
    Durante 12 meses:
    <br>
    Setup: R$ ${estimativa.setup.toLocaleString()}/mês
    <br>
    + Mensal: R$ ${estimativa.mensalDurante12.toLocaleString()}
    <br>
    Valor total: R$ ${(estimativa.setup * 12 + estimativa.mensalDurante12 * 12).toLocaleString()}
    <br><br>
    Após 12 meses:
    <br>
    R$ ${estimativa.mensalPos12.toLocaleString()} / mês
    <br>
    valor total: R$ ${(estimativa.mensalPos12 * 12).toLocaleString()}
    <br>
    <small>${estimativa.horasEstimadas}h • ${estimativa.mesesEstimados} mês(es)</small>
  `;
}
    tbody.innerHTML += `
      <tr>
        <td>${lead.nome}</td>
        <td>${lead.tipo_sistema}</td>
        <td>${lead.modelo_contratacao}</td>
        <td>${estimativaTexto}</td>
        <td>
          <span class="badge bg-secondary">
            ${lead.status || "Novo"}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-light"
            onclick='abrirDetalhes(${JSON.stringify(lead)})'>
            Ver
          </button>
        </td>
      </tr>
    `;
  });

  renderizarPaginacao(leads.length);
}

function renderizarPaginacao(totalItens) {

  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const paginacao = document.getElementById("pagination");
  paginacao.innerHTML = "";

  for (let i = 1; i <= totalPaginas; i++) {
    paginacao.innerHTML += `
      <li class="page-item ${i === paginaAtual ? "active" : ""}">
        <button class="page-link bg-dark text-light border-secondary"
          onclick="mudarPagina(${i})">${i}</button>
      </li>
    `;
  }
}

function mudarPagina(pagina) {
  paginaAtual = pagina;
  aplicarFiltros();
}


// ================= INIT =================
carregarLeads();
document
  .getElementById("modoGraficoTipo")
  .addEventListener("change", () => {
    gerarGraficoTipo(todosLeads);
  });

document
  .getElementById("filtroGraficoTipo")
  .addEventListener("change", () => {
    gerarGraficoTipo(todosLeads);
  });

document.getElementById("searchInput")
  .addEventListener("input", () => {
    paginaAtual = 1;
    aplicarFiltros();
  });

document.getElementById("filtroStatusTabela")
  .addEventListener("change", () => {
    paginaAtual = 1;
    aplicarFiltros();
  });

document.getElementById("filtroTipoTabela")
  .addEventListener("change", () => {
    paginaAtual = 1;
    aplicarFiltros();
  });

document.querySelectorAll("th[data-sort]")
  .forEach(th => {
    th.addEventListener("click", () => {

      const campo = th.getAttribute("data-sort");

      if (campoOrdenacao === campo) {
        ordemAsc = !ordemAsc;
      } else {
        campoOrdenacao = campo;
        ordemAsc = true;
      }

      aplicarFiltros();
    });
  });