function calcularEstruturaFinanceiraEmpresa() {

  const custosFixos = {

    // Infra
    supabase: 0,//supabase é gratuito, mas pode ter custos futuros dependendo do uso
    render: 0, //render é gratuito, mas pode ter custos futuros dependendo do uso
    cloudflare: 0, // plano gratuito, mas pode ter custos futuros dependendo do uso
    resend: 0,  //resend é gratuito, mas pode ter custos futuros dependendo do uso
    vps: 0, //vps é gratuito, mas pode ter custos futuros dependendo do uso
    github: 0, //github pro é gratuito, mas pode ter custos futuros dependendo do uso
    chatgpt: 0, //chatgpt go é gratuito, mas pode ter custos futuros dependendo do uso
    dominioPrincipal: 50, // custo médio anual de um domínio .com, dividido por 12 meses

    // Administrativo
    dasMei: 75, // valor mensal do DAS para MEI
    contabilidade: 0, // custo médio mensal de um serviço de contabilidade para MEI
    contador: 0,  // custo médio mensal de um contador para MEI
    taxasBancarias: 0,  // muitas contas digitais oferecem isenção de taxas, mas é importante considerar possíveis custos futuros

    // Comercial
    marketing: 50, // custo médio mensal com marketing digital (anúncios, ferramentas de automação, etc.)
    ferramentasExtras: 0, // custo médio mensal com ferramentas extras (CRM, automação, etc.)

    // Planejamento futuro
    upgradeInfraFuturo: 50 // reserva mensal para possíveis upgrades de infraestrutura à medida que a empresa cresce
  };

  const totalFixoMensal = Object.values(custosFixos)
    .reduce((acc, valor) => acc + valor, 0);

  const percentuais = {
    taxaGateway: 0.04,  // percentual médio de taxa de gateways de pagamento (ex: Stripe, PayPal)  
    custosOperacionais: 0.05, // percentual médio para cobrir custos operacionais variáveis (infraestrutura, ferramentas, etc.)
    reservaEmergencia: 0.01,  // percentual para reserva de emergência, garantindo segurança financeira em imprevistos
    reinvestimento: 0.01,// percentual para reinvestimento no crescimento da empresa (marketing, melhorias, etc.)
    bufferRisco: 0.03// percentual para buffer de risco, protegendo a empresa contra variações inesperadas de receita ou custos
  };

  const percentualTotal =
    Object.values(percentuais)
      .reduce((acc, valor) => acc + valor, 0);

  return {
    custosFixos, // detalhamento dos custos fixos mensais
    totalFixoMensal,// soma total dos custos fixos mensais
    totalFixoAnual: totalFixoMensal * 12,// projeção anual dos custos fixos
    percentuais,// detalhamento dos percentuais aplicados sobre o faturamento
    percentualTotalSobreFaturamento: percentualTotal// soma total dos percentuais que devem ser aplicados sobre o faturamento para cobrir custos e garantir margem de segurança
  };
}

function calcularCustosOperacionaisProjeto(tipoProjeto) {

  let detalhamento = {};

  switch (tipoProjeto) {

    case "Site Institucional":
      detalhamento = {
        dominioCliente: 50,
        vpsGithubPages: 25,
        supabaseLeads: 0,
        resendMailing: 0,
        backup: 0
      };
      break;

    case "Sistema Personalizado":
      detalhamento = {
        dominioCliente: 50,
        vpsMedia: 60,
        supabaseApp: 50,
        resend: 25,
        monitoramento: 20,
        backup: 20
      };
      break;

    case "Plataforma de Gestão":
      detalhamento = {
        dominioCliente: 50,
        vpsDedicada: 120,
        supabaseDedicado: 100,
        resend: 40,
        monitoramento: 40,
        backup: 30,
        logs: 25
      };
      break;

    case "Solução com Inteligência Artificial":
      detalhamento = {
        dominioCliente: 50,
        vpsAltaPerformance: 180,
        supabaseAvancado: 120,
        apiIA: 150,
        resend: 40,
        monitoramento: 50,
        backup: 40,
        cache: 30
      };
      break;

    default:
      detalhamento = {
        dominioCliente: 50,
        vps: 0,
        supabase: 0,
        backup: 0
      };
  }

  const custoMensalInfra =
    Object.values(detalhamento)
      .reduce((acc, valor) => acc + valor, 0);

  // Setup inicial pode considerar provisionamento técnico
  const custoSetupInfra = Math.round(custoMensalInfra * 2);

  return {
    detalhamento,
    custoMensalInfra,
    custoSetupInfra,
    custoAnualInfra: custoMensalInfra * 12
  };
}

function calcularHorasMesDisponiveis({
  horasPorDia,
  diasPorSemana,
  percentualNaoFaturavel = 0.30 // 30% padrão
}) {

  const semanasPorMes = 4.33;

  const horasTotaisMes =
    horasPorDia * diasPorSemana * semanasPorMes;

  const horasFaturaveis =
    horasTotaisMes * (1 - percentualNaoFaturavel);

  return horasFaturaveis;
}


function calcularValorHora({
  proLaboreAtual,
  diasPorMes
}) {

  const valorHoraBruto =
    proLaboreAtual / diasPorMes / 8; // considerando uma jornada de 8 horas por dia

  return Math.round(valorHoraBruto);

}

function calcularEstimativa(lead) {

  // ===============================
  // BUSCA ESTRUTURA FINANCEIRA GLOBAL
  // ===============================

  const estrutura = calcularEstruturaFinanceiraEmpresa();
  const PERCENTUAL_ESTRUTURAL = estrutura.percentualTotalSobreFaturamento;

  // ===============================
  // CONFIGURAÇÕES DO PROJETO
  // ===============================

  const VALOR_HORA = calcularValorHora({
  proLaboreAtual: 13203.69,
  diasPorMes: 30
}); // valor base da hora técnica, pode ser ajustado conforme a realidade do mercado e posicionamento da empresa
  
const MARGEM_ESTRATEGICA = 0.10;// margem estratégica para garantir sustentabilidade financeira e capacidade de reinvestimento
  
  const HORAS_MES_DISPONIVEIS = calcularHorasMesDisponiveis({
  horasPorDia: 1,
  diasPorSemana: 7
});// média de horas técnicas disponíveis por mês para o projeto, considerando outras demandas e imprevistos

  const horasBasePorTipo = {
    "Site Institucional": 40,
    "Sistema Personalizado": 100,
    "Plataforma de Gestão": 150,
    "Solução com Inteligência Artificial": 180
  };

  const modelMultiplier = {
    "Projeto Fechado": 1.1,
    "Plano Recorrente (Recomendado)": 0.7,
    "Pacote Flexível": 0.9,
    "Preciso de orientação": 1.2
  };

  const horasBase = horasBasePorTipo[lead.tipo_sistema] || 80;
  const multiplier = modelMultiplier[lead.modelo_contratacao] || 1;

  const custos = calcularCustosOperacionaisProjeto(lead.tipo_sistema);

  // ===============================
  // COMPLEXIDADE
  // ===============================

  const tamanho = lead.descricao?.length || 0;

  let bonusPreco = 0;
  let impactoPrazo = 1;

  if (tamanho > 700) {
    bonusPreco = 0.30;
    impactoPrazo = 1.35;
  } else if (tamanho > 400) {
    bonusPreco = 0.20;
    impactoPrazo = 1.20;
  } else if (tamanho > 200) {
    bonusPreco = 0.10;
    impactoPrazo = 1.05;
  }

  // ===============================
  // CÁLCULO BASE DO PROJETO
  // ===============================

  const valorTecnico = horasBase * VALOR_HORA * multiplier;
  const valorComComplexidade = valorTecnico * (1 + bonusPreco);

  const baseProjeto =
    valorComComplexidade + custos.custoSetupInfra;

  const valorComMargem =
    baseProjeto * (1 + MARGEM_ESTRATEGICA);

  // 🔥 Aplicação correta dos percentuais estruturais
  const valorFinalProjeto = Math.round(
    valorComMargem / (1 - PERCENTUAL_ESTRUTURAL)
  );

  // ===============================
  // PRAZO
  // ===============================

  const horasEstimadas = Math.round(
    horasBase * (1 + bonusPreco) * impactoPrazo
  );

  let mesesEstimados = Math.ceil(
    horasEstimadas / HORAS_MES_DISPONIVEIS
  );

  if (mesesEstimados < 1) mesesEstimados = 1;

  // ===============================
  // CLASSIFICAÇÃO PÓS 12 MESES
  // ===============================

  let categoriaProjeto = "medio";
  let mensalBasePos12 = 80;

  if (horasBase <= 60) {
    categoriaProjeto = "simples";
    mensalBasePos12 = 50;
  } else if (horasBase > 120) {
    categoriaProjeto = "complexo";
    mensalBasePos12 = 100;
  }

  const mensalMinimoSeguro = Math.ceil(
    custos.custoMensalInfra * 1.5
  );

  const mensalPos12 = Math.max(
    mensalBasePos12,
    mensalMinimoSeguro
  );

  // ===============================
  // MODELO RECORRENTE
  // ===============================

  let tipoPagamento = "projeto";
  let projeto = null;
  let setup = null;
  let mensalDurante12 = null;

  if (lead.modelo_contratacao === "Plano Recorrente (Recomendado)") {

    tipoPagamento = "recorrente";

    const valorSetupTotal =
      Math.round(valorFinalProjeto * 0.5);

    const valorRestante =
      valorFinalProjeto - valorSetupTotal;

    setup = Math.round(valorSetupTotal / 12);

    mensalDurante12 = Math.round(
      (valorRestante / 12) + custos.custoMensalInfra
    );

  } else {
    projeto = valorFinalProjeto;
  }

  // ===============================
  // RETORNO FINAL
  // ===============================

  return {
    valorFinal: valorFinalProjeto,
    horasEstimadas,
    mesesEstimados,
    tipoPagamento,
    projeto,
    setup,
    mensalDurante12,
    mensalPos12,
    categoriaProjeto,
    estruturaFinanceiraAplicada: {
      percentualEstrutural: PERCENTUAL_ESTRUTURAL,
      custoFixoMensalEmpresa: estrutura.totalFixoMensal
    },
    custosOperacionaisCliente: custos,
    detalhes: {
      valorHora: VALOR_HORA,
      margemAplicada: MARGEM_ESTRATEGICA,
      multiplierModelo: multiplier,
      bonusComplexidade: bonusPreco,
      impactoPrazo: impactoPrazo
    }
  };
}