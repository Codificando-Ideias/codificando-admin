async function verificarLogin() {

  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const { data: userData } =
    await supabaseClient.auth.getUser();

  const role = userData.user?.app_metadata?.role;

  if (role !== "admin") {

    await supabaseClient.auth.signOut();

    alert("Acesso restrito ao administrador.");

    window.location.href = "index.html";
    return;
  }

}

verificarLogin();

async function carregarUsuario() {

  const { data } = await supabaseClient.auth.getUser();

  if (data.user) {
    const email = data.user.email;
    const nome = email.split("@")[0];

    document.getElementById("adminNome").innerText =
      nome.charAt(0).toUpperCase() + nome.slice(1);
  }
}

carregarUsuario();

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

let statusAtual = "pendente"
async function init(){

await atualizarContadores()
await carregarPosts()

}


function trocarAba(status){

statusAtual = status

document.querySelectorAll(".nav-link")
.forEach(tab=>tab.classList.remove("active"))

document.getElementById(`tab-${status}`)
.classList.add("active")

carregarPosts()

}

async function atualizarContadores(){

const { data } = await supabaseClient
.from("conteudos_gerados")
.select("status")

let pendentes = 0
let publicados = 0

data.forEach(item=>{

if(item.status === "pendente") pendentes++
if(item.status === "publicado") publicados++

})

document.getElementById("count-pendente").innerText = pendentes
document.getElementById("count-publicado").innerText = publicados

}

async function carregarPosts(){

const container = document.getElementById("listaPosts")
const loading = document.getElementById("loadingPosts")
const empty = document.getElementById("emptyState")

container.innerHTML = ""
empty.classList.add("d-none")

loading.classList.remove("d-none")

const { data, error } = await supabaseClient
.from("artigos")
.select(`
id,
titulo,
data_publicacao,
conteudos_gerados!inner(
id,
post_linkedin,
thread_threads,
roteiro_reels,
email_newsletter,
mensagem_whatsapp,
status
)
`)
.eq("conteudos_gerados.status", statusAtual)
.order("data_publicacao",{ascending:false})

loading.classList.add("d-none")

if(error){

console.error(error)
return

}

if(!data || data.length === 0){

empty.classList.remove("d-none")
return

}

renderPosts(data)

}

function renderPosts(posts){

const container = document.getElementById("listaPosts")

container.innerHTML = ""

posts.forEach(post=>{

const conteudo = post.conteudos_gerados?.[0]

if(!conteudo) return

container.innerHTML += `

<div class="col-12">
<div class="post-card">

<div class="post-header">

<div>

<h5 class="fw-bold mb-1">
${post.titulo}
</h5>

<small class="text-secondary">
${new Date(post.data_publicacao).toLocaleDateString()}
</small>

</div>

<button class="btn btn-sm btn-outline-success"
onclick="arquivarPost('${conteudo.id}')">

<i class="bi bi-check-circle me-1"></i>
Publicado

</button>

</div>


${blocoConteudo("LinkedIn","post_linkedin",conteudo.post_linkedin,conteudo.id,"channel-linkedin")}

${blocoConteudo("Threads","thread_threads",conteudo.thread_threads,conteudo.id,"channel-threads")}

${blocoConteudo("Reels","roteiro_reels",conteudo.roteiro_reels,conteudo.id,"channel-reels")}

${blocoConteudo("Newsletter","email_newsletter",conteudo.email_newsletter,conteudo.id,"channel-newsletter")}

${blocoConteudo("WhatsApp","mensagem_whatsapp",conteudo.mensagem_whatsapp,conteudo.id,"channel-whatsapp")}

</div>

</div>

`

})

}

function blocoConteudo(titulo,campo,texto,id,classe){

if(!texto) return ""

const collapseId = `collapse-${campo}-${id}`

return `

<div class="post-block ${classe}">

<div class="post-block-header">

<button 
class="collapse-toggle"
data-bs-toggle="collapse"
data-bs-target="#${collapseId}"
aria-expanded="false">

${titulo}

<i class="bi bi-chevron-down"></i>

</button>

<div class="post-actions">

<button class="btn-copy"
onclick="copiarTexto(\`${texto.replace(/`/g,"")}\`)">

<i class="bi bi-clipboard"></i>

</button>

<button class="btn-edit"
onclick="abrirEditor('${campo}','${id}',\`${texto.replace(/`/g,"")}\`)">

<i class="bi bi-pencil"></i>

</button>

</div>

</div>

<div id="${collapseId}" class="collapse mt-2">

<textarea class="post-content"
rows="4"
readonly>${texto}</textarea>

</div>

</div>

`
}

function copiarTexto(texto){

navigator.clipboard.writeText(texto)

showToast("Copiado!")

}

function abrirEditor(campo,id,texto){

document.getElementById("editorTexto").value = texto

document.getElementById("editorCampo").value = campo

document.getElementById("editorId").value = id

new bootstrap.Modal(document.getElementById("modalEditar")).show()

}

async function salvarEdicao(){

const campo = document.getElementById("editorCampo").value
const id = document.getElementById("editorId").value
const texto = document.getElementById("editorTexto").value

const { error } = await supabaseClient

.from("conteudos_gerados")

.update({
[campo]:texto
})

.eq("id",id)

if(error){
console.error(error)

showToast("Erro ao salvar")

return

}

bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide()

carregarPosts()

}

async function arquivarPost(id){

if(!confirm("Confirma que este post já foi publicado?")) return

const { error } = await supabaseClient
.from("conteudos_gerados")
.update({
status:"publicado"
})
.eq("id",id)

if(error){

console.error(error)
showToast("Erro ao arquivar")

return

}
await atualizarContadores()
carregarPosts()

}

init()