#!/usr/bin/env node
/**
 * Cria (uma vez) os documentos únicos `parceiros` e `ofertas` já preenchidos
 * com os textos que o site mostra hoje, para a cliente encontrar os campos
 * com conteúdo em vez de em branco.
 *
 * Usa createIfNotExists: rodar de novo não sobrescreve o que ela editar.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function getToken() {
  if (process.env.SANITY_AUTH_TOKEN) return process.env.SANITY_AUTH_TOKEN;
  const cfg = path.join(os.homedir(), ".config", "sanity", "config.json");
  return JSON.parse(fs.readFileSync(cfg, "utf8")).authToken;
}

const client = createClient({
  projectId: "zfn09zm7",
  dataset: "production",
  apiVersion: "2024-06-01",
  token: getToken(),
  useCdn: false,
});

const docs = [
  {
    _id: "parceiros",
    _type: "parceiros",
    titulo: "Principais parceiros da indústria",
    subtitulo:
      "Trabalhamos com marcas reconhecidas nacionalmente para abastecer o seu negócio com qualidade e variedade.",
    logos: [],
  },
  {
    _id: "ofertas",
    _type: "ofertas",
    ativo: false,
    mes: "",
    titulo: "Ofertas do Mês",
    subtitulo:
      "Confira as condições especiais deste mês para o seu negócio.",
    descricao:
      "Baixe o catálogo promocional e fale com o televendas para condições comerciais e disponibilidade.",
    botao: "Baixar catálogo PDF",
  },
];

const run = async () => {
  for (const d of docs) {
    const antes = await client.fetch(`*[_id=="${d._id}"][0]{_id}`);
    await client.createIfNotExists(d);
    console.log(antes ? `  ja existia: ${d._id}` : `  criado: ${d._id}`);
  }
  const check = await client.fetch(
    `{"parceiros": count(*[_type=="parceiros"]), "ofertas": count(*[_type=="ofertas"])}`
  );
  console.log("\nDocumentos no dataset:", JSON.stringify(check));
};

run().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
