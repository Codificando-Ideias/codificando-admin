async function gerarNumeroProposta() {

  const ano = new Date().getFullYear();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?select=numero_proposta&order=created_at.desc&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  let sequencial = 1;

  if (data.length && data[0].numero_proposta) {
    const ultimoNumero = data[0].numero_proposta;
    const ultimoSequencial = parseInt(ultimoNumero.split("-")[2]);
    sequencial = ultimoSequencial + 1;
  }

  const numeroFormatado = String(sequencial).padStart(4, "0");

  return `CI-${ano}-${numeroFormatado}`;
}

async function gerarPropostaPDF(lead) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageHeight = 297;
  const marginBottom = 20;
  const marginTop = 40;
  let y = marginTop;

  function adicionarHeader() {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Codificando Ideias", 20, 18);

    doc.setFontSize(10);
    doc.text("Impulsionando negócios através da tecnologia", 20, 24);

    doc.setTextColor(0, 0, 0);
  }

  function adicionarRodape() {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Codificando Ideias | www.codificandoideais.site | contato@codificandoideais.site",
      20,
      290
    );
  }

  function verificarQuebraPagina(alturaBloco) {
    if (y + alturaBloco > pageHeight - marginBottom) {
      doc.addPage();
      adicionarHeader();
      adicionarRodape();
      y = marginTop;
    }
  }

  function adicionarTextoBloco(titulo, conteudo) {

  const alturaLinha = 5;
  const espacamentoTitulo = 6;
  const espacamentoEntreBlocos = 6;

  doc.setFontSize(11);
  const linhas = doc.splitTextToSize(conteudo, 170);

  const alturaTitulo = espacamentoTitulo;
  const alturaTexto = linhas.length * alturaLinha;
  const alturaTotalBloco = alturaTitulo + alturaTexto + espacamentoEntreBlocos;

  // 🔥 VERIFICA O BLOCO INTEIRO
  if (y + alturaTotalBloco > pageHeight - marginBottom) {
    doc.addPage();
    adicionarHeader();
    adicionarRodape();
    y = marginTop;
  }

  // TÍTULO
  doc.setFontSize(13);
  doc.text(titulo, 20, y);
  y += espacamentoTitulo;

  // TEXTO
  doc.setFontSize(11);
  doc.text(linhas, 20, y);
  y += alturaTexto + espacamentoEntreBlocos;
}

  // ================= NUMERO PROPOSTA =================
  let numeroProposta = lead.numero_proposta;

  if (!numeroProposta) {
    numeroProposta = await gerarNumeroProposta();

    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        numero_proposta: numeroProposta
      })
    });
  }

  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const estimativa = calcularEstimativa(lead);

  let investimentoTexto = "";

  if (estimativa.projeto) {
    investimentoTexto = `Valor total: R$ ${estimativa.projeto.toLocaleString()}`;
  }

  if (estimativa.setup && estimativa.mensal) {
    investimentoTexto =
      `Setup inicial: R$ ${estimativa.setup.toLocaleString()}\n` +
      `Mensalidade: R$ ${estimativa.mensal.toLocaleString()}`;
  }

  // ================= PRIMEIRA PAGINA =================
  adicionarHeader();
  adicionarRodape();

  doc.setFontSize(16);
  doc.text("PROPOSTA COMERCIAL DE DESENVOLVIMENTO DE SOFTWARE", 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Proposta nº: ${numeroProposta}`, 20, y);
  y += 6;
  doc.text(`Data: ${dataAtual}`, 20, y);
  y += 15;

  // ================= CONTEÚDO =================
  adicionarTextoBloco(
    "1. IDENTIFICAÇÃO DAS PARTES",
    `CONTRATANTE:
Nome: ${lead.nome}
E-mail: ${lead.email}
Telefone: ${lead.whatsapp}

CONTRATADA:
Codificando Ideias
CNPJ: SEU_CNPJ_AQUI
Endereço: São Paulo - SP`
  );

  adicionarTextoBloco(
    "2. OBJETO",
    `A presente proposta tem como objeto o desenvolvimento de solução digital classificada como:

Tipo: ${lead.tipo_sistema}
Modelo de contratação: ${lead.modelo_contratacao}`
  );

  adicionarTextoBloco(
    "3. ESCOPO DOS SERVIÇOS",
    `Inclui:

- Levantamento técnico e entendimento de requisitos
- Arquitetura de software
- Desenvolvimento backend e frontend
- Modelagem e estruturação de banco de dados
- Deploy inicial em ambiente cloud
- Entrega em ambiente de produção
- Documentação técnica básica`
  );

  adicionarTextoBloco(
    "4. NÃO INCLUSO",
    `- Hospedagem (salvo contrato recorrente)
- Infraestrutura de terceiros
- Licenças externas
- Integrações não previstas
- Evoluções fora do escopo inicial`
  );

  adicionarTextoBloco(
    "5. INVESTIMENTO",
    investimentoTexto
  );

  adicionarTextoBloco(
    "6. PRAZOS",
    "Prazo estimado: até 30 dias úteis após aprovação."
  );

  adicionarTextoBloco(
    "7. VALIDADE DA PROPOSTA",
    "Esta proposta é válida por 15 dias."
  );

  doc.save(`Proposta-${numeroProposta}.pdf`);
}


async function gerarNumeroContrato() {

  const ano = new Date().getFullYear();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?select=numero_contrato&order=created_at.desc&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  let sequencial = 1;

  if (data.length && data[0].numero_contrato) {
    const ultimoNumero = data[0].numero_contrato;
    const ultimoSequencial = parseInt(ultimoNumero.split("-")[3]);
    sequencial = ultimoSequencial + 1;
  }

  const numeroFormatado = String(sequencial).padStart(4, "0");

  return `CI-CON-${ano}-${numeroFormatado}`;
}

async function gerarContratoPDF(lead) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageHeight = 297;
  const marginBottom = 20;
  const marginTop = 40;
  let y = marginTop;

  function adicionarHeader() {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Codificando Ideias", 20, 18);

    doc.setFontSize(10);
    doc.text("Contrato de Prestação de Serviços de Software", 20, 24);

    doc.setTextColor(0, 0, 0);
  }

  function adicionarRodape() {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Codificando Ideias | www.codificandoideais.site | contato@codificandoideais.site",
      20,
      290
    );
  }

  function adicionarBloco(titulo, conteudo) {

    const alturaLinha = 5;
    const espacamentoTitulo = 6;
    const espacamentoEntreBlocos = 8;

    doc.setFontSize(11);
    const linhas = doc.splitTextToSize(conteudo, 170);

    const alturaTitulo = espacamentoTitulo;
    const alturaTexto = linhas.length * alturaLinha;
    const alturaTotalBloco = alturaTitulo + alturaTexto + espacamentoEntreBlocos;

    if (y + alturaTotalBloco > pageHeight - marginBottom) {
      doc.addPage();
      adicionarHeader();
      adicionarRodape();
      y = marginTop;
    }

    doc.setFontSize(13);
    doc.text(titulo, 20, y);
    y += espacamentoTitulo;

    doc.setFontSize(11);
    doc.text(linhas, 20, y);
    y += alturaTexto + espacamentoEntreBlocos;
  }

  // ================= NUMERO CONTRATO =================
  let numeroContrato = lead.numero_contrato;

  if (!numeroContrato) {
    numeroContrato = await gerarNumeroContrato();

    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        numero_contrato: numeroContrato
      })
    });
  }

  const dataAtual = new Date().toLocaleDateString("pt-BR");

adicionarHeader();
adicionarRodape();

// Título principal centralizado em 2 linhas
doc.setFontSize(15);
doc.setFont(undefined, "bold");

doc.text(
  "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
  105,
  y,
  { align: "center" }
);

y += 8;

doc.text(
  "DE DESENVOLVIMENTO DE SOFTWARE",
  105,
  y,
  { align: "center" }
);

doc.setFont(undefined, "normal");

y += 12;

  doc.setFontSize(11);
  doc.text(`Contrato nº: ${numeroContrato}`, 20, y);
  y += 6;
  doc.text(`Data: ${dataAtual}`, 20, y);
  y += 15;

  adicionarBloco(
    "CLÁUSULA PRIMEIRA – OBJETO",
    `O presente contrato tem por objeto o desenvolvimento de ${lead.tipo_sistema}, conforme proposta comercial previamente aprovada entre as partes.`
  );

  adicionarBloco(
    "CLÁUSULA SEGUNDA – ESCOPO",
    `A CONTRATADA realizará os serviços de análise técnica, arquitetura de software, desenvolvimento backend e frontend, modelagem de banco de dados, testes, deploy e entrega em ambiente de produção, conforme especificações acordadas.`
  );

  adicionarBloco(
    "CLÁUSULA TERCEIRA – HONORÁRIOS",
    `O valor da prestação dos serviços seguirá o modelo de contratação escolhido: ${lead.modelo_contratacao}.
Em caso de atraso, incidirá multa de 2% sobre o valor devido, acrescida de juros de 1% ao mês, conforme prática de mercado.`
  );

  adicionarBloco(
    "CLÁUSULA QUARTA – PRAZOS",
    `Os prazos de execução serão definidos conforme cronograma acordado entre as partes, iniciando-se após confirmação formal da contratação.`
  );

  adicionarBloco(
    "CLÁUSULA QUINTA – PROPRIEDADE INTELECTUAL",
    lead.modelo_contratacao === "Projeto Fechado"
      ? `Após a quitação integral dos valores, o código-fonte e demais ativos desenvolvidos serão transferidos ao CONTRATANTE.`
      : `No modelo recorrente, o CONTRATANTE terá licença de uso da solução enquanto vigente o contrato, permanecendo a propriedade intelectual com a CONTRATADA.`
  );

  adicionarBloco(
    "CLÁUSULA SEXTA – CONFIDENCIALIDADE",
    `As partes comprometem-se a manter sigilo sobre informações técnicas, estratégicas e comerciais trocadas durante a vigência do contrato.`
  );

  adicionarBloco(
    "CLÁUSULA SÉTIMA – LGPD",
    `O tratamento de dados pessoais observará integralmente a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), cabendo às partes adotar medidas de segurança adequadas.`
  );

  adicionarBloco(
    "CLÁUSULA OITAVA – RESCISÃO",
    `O contrato poderá ser rescindido mediante notificação formal, respeitando-se eventuais obrigações financeiras pendentes até a data da rescisão.`
  );

  adicionarBloco(
    "CLÁUSULA NONA – SUPORTE E SLA",
    `Nos casos de contratação recorrente, serão aplicadas condições de suporte e níveis de serviço (SLA) previamente acordados entre as partes.`
  );

  adicionarBloco(
    "CLÁUSULA DÉCIMA – FORO",
    `Fica eleito o Foro da Comarca de São Paulo – SP para dirimir quaisquer controvérsias oriundas deste contrato.`
  );

  doc.save(`Contrato-${numeroContrato}.pdf`);
}