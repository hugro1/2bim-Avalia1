
const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const mensagem = document.getElementById("mensagem");
const areaDesenho = document.getElementById("desenho");
const botaoBaixar = document.getElementById("baixar");

let idToken = null;
let svgAtual = null;

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
}

function receberLoginGoogle(resposta) {
  idToken = resposta.credential;
  mostrarMensagem("Login realizado! Agora escolha um número e clique em Desenhar.");
}

window.onload = function () {
  if (!window.google?.accounts?.id) {
    mostrarMensagem("Não foi possível carregar o login do Google.");
    return;
  }

  google.accounts.id.initialize({
    client_id: "612970592259-cksb0t8ceenui0rdfcl6uuhfgccomq4g.apps.googleusercontent.com",
    callback: receberLoginGoogle
  });

  google.accounts.id.renderButton(
    document.getElementById("google-login"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "pt-BR"
    }
  );
};

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  areaDesenho.replaceChildren();
  botaoBaixar.hidden = true;
  svgAtual = null;

  const numero = Number(campoNumero.value);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mostrarMensagem("Digite um número inteiro entre 1 e 100.");
    return;
  }

  if (!idToken) {
    mostrarMensagem("Faça login com sua conta Google antes de desenhar.");
    return;
  }

  mostrarMensagem("Gerando desenho...");

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ numero })
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      mostrarMensagem(erro || `Erro ${resposta.status} ao gerar o desenho.`);
      return;
    }

    svgAtual = await resposta.text();

    const imagem = document.createElement("img");
    imagem.alt = `Desenho assinado número ${numero}`;
    imagem.src = URL.createObjectURL(
      new Blob([svgAtual], { type: "image/svg+xml" })
    );

    areaDesenho.appendChild(imagem);
    botaoBaixar.hidden = false;
    mostrarMensagem("Desenho gerado com sucesso!");
  } catch {
    mostrarMensagem("Não foi possível conectar ao servidor.");
  }
});

botaoBaixar.addEventListener("click", function () {
  if (!svgAtual) return;

  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "desenho-assinado.svg";
  link.click();

  URL.revokeObjectURL(url);
});
