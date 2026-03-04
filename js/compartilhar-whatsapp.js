function enviarWhatsApp(lead) {

    const telefoneDestino = WHATSAPP_NUMERO_KEY; // Seu número com DDI (ex: 5511999999999)

    // Remove máscara do WhatsApp do cliente
    const numeroCliente = lead.whatsapp.replace(/\D/g, "");

    const mensagem = `
Olá, meu nome é ${lead.nome}.

📌 Tipo de Projeto: ${lead.tipo_sistema}
📦 Modelo de Contratação: ${lead.modelo_contratacao}

📧 Email: ${lead.email}
📱 WhatsApp: ${numeroCliente}

📝 Descrição:
${lead.descricao || "-"}

🌐 Site / Rede Social:
${lead.link_empresa || "-"}

Vim através do site Codificando Ideias e aguardo retorno.
`;

    const textoCodificado = encodeURIComponent(mensagem.trim());

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const url = isMobile
        ? `whatsapp://send?phone=${telefoneDestino}&text=${textoCodificado}`
        : `https://api.whatsapp.com/send?phone=${telefoneDestino}&text=${textoCodificado}`;

    window.open(url, "_blank");
}

function enviarWhatsAppDashboard(lead) {

  const numeroCliente = lead.whatsapp.replace(/\D/g, "");

  const estimativa = calcularEstimativa(lead);

  let estimativaTexto = "";

  if (estimativa.projeto) {
    estimativaTexto = `💰 Estimativa Projeto: R$ ${estimativa.projeto.toLocaleString()}`;
  }

  if (estimativa.setup && estimativa.mensal) {
    estimativaTexto = 
`💰 Setup: R$ ${estimativa.setup.toLocaleString()}
💳 Mensal: R$ ${estimativa.mensal.toLocaleString()}`;
  }

  const mensagem = `
Olá ${lead.nome}, tudo bem?

Estou entrando em contato sobre sua solicitação enviada pelo site Codificando Ideias.

━━━━━━━━━━━━━━━━━━
📌 Tipo de Projeto:
${lead.tipo_sistema}

📦 Modelo de Contratação:
${lead.modelo_contratacao}

${estimativaTexto}

📝 Descrição informada:
${lead.descricao || "-"}

🌐 Site / Rede:
${lead.link_empresa || "-"}

━━━━━━━━━━━━━━━━━━
Gostaria de conversar para alinharmos detalhes e próximos passos.

Fico à disposição 🙂

━━━━━━━━━━━━━━━━━━
Você pode conhecer mais sobre nosso trabalho em:
Codificando Ideias
Impulsionando negócios através da tecnologia
🌐 https://www.codificandoideias.site
`;

  const textoCodificado = encodeURIComponent(mensagem.trim());

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const url = isMobile
    ? `whatsapp://send?phone=${numeroCliente}&text=${textoCodificado}`
    : `https://api.whatsapp.com/send?phone=+55${numeroCliente}&text=${textoCodificado}`;

  window.open(url, "_blank");
}