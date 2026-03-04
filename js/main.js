$(document).ready(function () {


// ================= ANTI-BOT TEMPO =================
let formLoadedAt = Date.now();

// ================= WHATSAPP MASK =================
$("#whatsapp").on("input", function () {
  let value = $(this).val().replace(/\D/g, "");

  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 6) {
    value = value.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d+)/, "($1) $2");
  }

  $(this).val(value);
});

// ================= DESCRICAO COUNTER =================
$("#descricao").on("input", function () {
  const totalCaracteres = $(this).val().length;
  $("#contador").text(totalCaracteres);
});

// ================= WHATSAPP VALIDATION =================
function isValidWhatsApp(number) {
  const digits = number.replace(/\D/g, "");

  // Deve ter 11 dígitos
  if (digits.length !== 11) return false;

  const ddd = parseInt(digits.substring(0, 2), 10);
  const ninthDigit = digits.charAt(2);

  // DDD válido entre 11 e 99
  if (ddd < 11 || ddd > 99) return false;

  // Celular brasileiro começa com 9 após DDD
  if (ninthDigit !== "9") return false;

  return true;
}

// ================= EMAIL VALIDATION =================
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}


// ================= FORM SUBMIT =================
$("#contactForm").submit(async function (e) {
  e.preventDefault();

  // Honeypot
  if ($("#company").val() !== "") return;

  // Tempo mínimo (anti-bot)
  if (Date.now() - formLoadedAt < 3000) {
    showToast("Envio muito rápido. Tente novamente.", false);
    return;
  }

  const btn = $(this).find("button[type='submit']");
  btn.prop("disabled", true).html(`
    <span class="spinner-border spinner-border-sm me-2"></span>
    Enviando...
  `);

  const data = {
    tipo_sistema: $("#tipoSistema").val(),
    modelo_contratacao: $("#modeloContratacao").val(),
    nome: $("#nome").val().trim(),
    email: $("#email").val().trim(),
    whatsapp: $("#whatsapp").val().replace(/\D/g, ""),
    descricao: $("#descricao").val().trim(),
    link_empresa: $("#linkEmpresa").val().trim(),
    created_at: new Date().toISOString()
  };

  // Validação
  if (!data.tipo_sistema || !data.modelo_contratacao || !data.nome || !data.email) {
    showToast("Preencha todos os campos obrigatórios.", false);
    btn.prop("disabled", false).text("Receber Proposta Personalizada");
    return;
  }

  if (!isValidEmail(data.email)) {
    showToast("Digite um e-mail válido.", false);
    btn.prop("disabled", false).text("Receber Proposta Personalizada");
    return;
  }

  if (!isValidWhatsApp(data.whatsapp)) {
  showToast("Digite um WhatsApp válido com DDD (ex: 11987654321).", false);
  btn.prop("disabled", false).text("Receber Proposta Personalizada");
  return;
}

  try {

    // ================= ENVIO SUPABASE =================
    const token = await gerarRecaptchaToken();

    const response = await fetch(
      "https://vwzxirmphsnwflphiaog.supabase.co/functions/v1/lead",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...data,
          recaptcha_token: token
        })
      }
    );

    if (!response.ok) throw new Error("Erro ao enviar");

  } catch (error) {
    console.error(error);
    showToast("Erro ao enviar. Tente novamente.", false);
  }

  var aceitou = $("#acceptedTerms").is(":checked");

  if (aceitou) {
    const dataNewsletter = {
    name: data.nome,
    email: data.email,
    whatsapp: data.whatsapp,
    accepted_terms: aceitou,
    source: "landing_page",
    created_at: new Date().toISOString()
  };

    try {

    const token = await gerarRecaptchaToken();

    const response = await fetch(
      "https://vwzxirmphsnwflphiaog.supabase.co/functions/v1/subscriber-newsletter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...dataNewsletter,
          recaptcha_token: token
        })
      }
    );

    if (!response.ok) throw new Error("Erro Supabase");

  } catch (error) {
    console.error(error);
  }

}

 // ================= SUCCESS =================
    showToast("Solicitação enviada com sucesso! Entraremos em contato. 🚀");
    enviarEmail(data);
    //enviarWhatsApp(data);
    $("#contactForm")[0].reset();
    $("#contador").text("0");

  btn.prop("disabled", false).text("Receber Proposta Personalizada");
});

async function gerarRecaptchaToken() {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject("reCAPTCHA não carregado");
      return;
    }

    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "lead_submit" })
        .then(resolve)
        .catch(reject);
    });
  });
}

});
