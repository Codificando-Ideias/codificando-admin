let leadAtual = null;
const fluxoStatus = {

  "Novo": ["Contato", "Cancelado"],

  "Contato": ["Em Análise", "Cancelado"],

  "Em Análise": ["Proposta", "Cancelado"],

  "Proposta": ["Contrato", "Cancelado"],

  "Contrato": ["Aguardando Pagamento", "Cancelado"],

  "Aguardando Pagamento": ["Em Desenvolvimento", "Cancelado"],

  "Em Desenvolvimento": ["Homologação", "Cancelado"],

  "Homologação": ["Aguardando Produção", "Cancelado"],

  "Aguardando Produção": ["Fechado", "Cancelado"],

  "Fechado": [],

  "Cancelado": []

};
// ================= MODAL DETALHES =================
function abrirDetalhes(lead) {
  leadAtual = lead;
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
  const html = `
    <div class="row g-3">
      <div class="col-md-6"><strong>Nome:</strong><br>${lead.nome}</div>
<div class="col-md-6">
  <strong>Email:</strong><br>
  <button id="emailLink"
          class="btn btn-outline-info btn-sm mt-1">
    <i class="bi bi-envelope me-1"></i>
    ${lead.email}
  </button>
</div>
<div class="col-md-6 mb-3"> <strong>WhatsApp:</strong><br> <button id="whatsappLink" class="btn btn-outline-success btn-sm mt-1"> <i class="bi bi-whatsapp me-1"></i> ${lead.whatsapp} </button> </div>      <div class="col-md-6"><strong>Tipo:</strong><br>${lead.tipo_sistema}</div>
      <div class="col-md-6"><strong>Modelo:</strong><br>${lead.modelo_contratacao}</div>
      <div class="col-md-6"><strong>Status:</strong><br>
<select id="statusSelect" class="form-select mt-1"></select>

<button class="btn btn-sm btn-success mt-2"
  onclick="atualizarStatus('${lead.id}')">
  Salvar Status
</button>
</div>
      <div class="col-12">
        <strong>Descrição:</strong>
        <div class="p-2 bg-secondary rounded mt-1">
          ${lead.descricao || "-"}
        </div>
      </div>
      <div class="col-12">
        <strong>Link:</strong><br>
        ${lead.link_empresa
          ? `<a href="${lead.link_empresa}" target="_blank">${lead.link_empresa}</a>`
          : "-"}
      </div>
      <div class="col-6">
        <strong>Estimativa:</strong><br>${estimativaTexto}
      </div>
      <div class="col-6">
        <strong>Criado em:</strong><br>
        ${new Date(lead.created_at).toLocaleString()}
      </div>
    <div id="acoesContrato" class="mt-4 d-flex gap-2"></div>
    <button class="btn btn-primary"
        onclick="enviarNewsletterAdmin()">
  <i class="bi bi-megaphone-fill me-1"></i>
  Disparar Newsletter
</button>
<button onclick="gerarPreview('landing-page')">
  Gerar link preview (48h)
</button>
    </div>
  `;

  document.getElementById("leadDetalhes").innerHTML = html;
  renderizarStatusSelect(lead.status);
renderizarBotoesStatus(lead.status);
const whatsappEl = document.getElementById("whatsappLink"); 
if (whatsappEl) { 
    whatsappEl.addEventListener("click", function () {
      enviarWhatsAppDashboard(leadAtual);
    });
}

const emailEl = document.getElementById("emailLink");

if (emailEl) {
  emailEl.addEventListener("click", function () {
    enviarEmailDashboard(leadAtual);
  });
}

  const modal = new bootstrap.Modal(
    document.getElementById("leadModal")
  );
  modal.show();
}

function renderizarBotoesStatus(status) {

  const container = document.getElementById("acoesContrato");
  container.innerHTML = "";

  const faseComercial = ["Proposta", "Aguardando Aprovação"];
  const faseContrato = ["Contrato", "Em Desenvolvimento", "Homologação", "Fechado"];
  const faseOperacional = ["Em Desenvolvimento", "Homologação"];

  // ======================
  // 📄 PROPOSTA
  // ======================
  if (faseComercial.includes(status)) {
    container.innerHTML += `
      <button class="btn btn-primary"
        onclick="gerarPropostaPDF(leadAtual)">
        📄 Gerar Proposta
      </button>
    `;
  }

  if (faseContrato.includes(status)) {
    container.innerHTML += `
      <button class="btn btn-primary"
        onclick="gerarPropostaPDF(leadAtual)">
        📄 Visualizar Proposta
      </button>
    `;
  }

  // ======================
  // 📝 CONTRATO
  // ======================
  if (status === "Contrato") {
    container.innerHTML += `
      <button class="btn btn-success"
        onclick="gerarContratoPDF(leadAtual)">
        📝 Gerar Contrato
      </button>
    `;
  }

  if (faseOperacional.includes(status) || status === "Fechado") {
    container.innerHTML += `
      <button class="btn btn-success"
        onclick="gerarContratoPDF(leadAtual)">
        📝 Visualizar Contrato
      </button>
    `;
  }

}

function renderizarStatusSelect(statusAtual) {
  const select = document.getElementById("statusSelect");

  select.innerHTML = "";

  // Sempre mostrar o status atual
  const optionAtual = document.createElement("option");
  optionAtual.value = statusAtual;
  optionAtual.textContent = statusAtual + " (Atual)";
  optionAtual.selected = true;
  optionAtual.disabled = true;
  select.appendChild(optionAtual);

  // Buscar próximos permitidos
  const proximos = fluxoStatus[statusAtual] || [];

  proximos.forEach(status => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.appendChild(option);
  });
}

