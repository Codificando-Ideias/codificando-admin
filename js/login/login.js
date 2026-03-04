const supabaseLogin = window.supabaseClient;
document.getElementById("loginForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const { error } = await supabaseLogin.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      document.getElementById("erro").innerText =
        "Email ou senha inválidos.";
      return;
    }

    window.location.href = "dashboard.html";

  });

