
import { gerarDesenho } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Verificar o método
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  // 2. Verificar o corpo da requisição
  let dados;

  try {
    dados = await request.json();
  } catch {
    return new Response("Corpo JSON inválido", { status: 400 });
  }

  const numero = dados?.numero;

  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 100
  ) {
    return new Response("Número inválido: informe um inteiro de 1 a 100", {
      status: 400,
    });
  }

  // 3. Verificar o token do Google
  const autorizacao = request.headers.get("Authorization");
  const token = autorizacao?.startsWith("Bearer ")
    ? autorizacao.slice(7)
    : null;

  if (!token || !env.GOOGLE_CLIENT_ID) {
    return new Response("Token ausente ou inválido", { status: 401 });
  }

  try {
    const resposta = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    if (!resposta.ok) {
      return new Response("Token inválido ou expirado", { status: 401 });
    }

    const usuario = await resposta.json();

    if (
      usuario.aud !== env.GOOGLE_CLIENT_ID ||
      usuario.email_verified !== "true" ||
      !usuario.email
    ) {
      return new Response("Token inválido ou e-mail não verificado", {
        status: 401,
      });
    }

    const svg = gerarDesenho(numero, usuario.email);

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  } catch {
    return new Response("Não foi possível verificar o token", {
      status: 401,
    });
  }
}
