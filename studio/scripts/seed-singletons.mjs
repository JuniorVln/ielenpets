#!/usr/bin/env node
/** Semeia os documentos únicos (Início, Quem Somos, Contato) com o conteúdo
 *  atual do site, pra cliente começar editando algo já preenchido.
 *  Uso: node scripts/seed-singletons.mjs   (idempotente) */
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

const blocks = (paras) =>
  paras.map((t, i) => ({
    _type: "block",
    _key: `b${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text: t, marks: [] }],
  }));

const docs = [
  {
    _id: "inicio",
    _type: "inicio",
    heroTitulo: "Desde 2001, movendo o mercado pet.",
    heroSubtitulo:
      "Conectamos as melhores marcas ao seu negócio, oferecendo mais de 4 mil produtos, atendimento especializado e soluções que impulsionam o mercado pet.",
  },
  {
    _id: "quemSomos",
    _type: "quemSomos",
    titulo: "Quem Somos",
    texto: blocks([
      "Fundada em 2001, a Ielenpet é uma distribuidora especializada em produtos para o mercado pet, atuando como parceira estratégica de pet shops, agropecuárias e clínicas veterinárias.",
      "Nossa missão é conectar as principais indústrias aos nossos clientes, oferecendo um atendimento próximo, um catálogo completo e uma logística eficiente para que cada parceiro tenha o melhor.",
      "Hoje contamos com mais de 4.000 produtos em estoque, reunindo marcas reconhecidas nacionalmente em categorias como alimentação, medicamentos, higiene, acessórios, aquarismo e jardinagem.",
      "Ao longo de nossa trajetória, construímos relações baseadas em confiança, transparência e compromisso. Mais do que distribuir produtos, buscamos contribuir para o crescimento de cada cliente.",
      "Seguimos evoluindo, investindo em estrutura, tecnologia e atendimento para continuar sendo uma referência na distribuição de produtos pet.",
    ]),
  },
  {
    _id: "contato",
    _type: "contato",
    telefone: "(41) 3606-9158",
    whatsapp: "5541995950968",
    email: "",
    endereco: "Rua Gustavo Nass, 439 - Jd. Contorno",
    cidade: "Colombo, PR · 83402-710",
    horario: "Seg a Qui: 07:30 – 17:30\nSex: 07:30 – 16:30",
  },
];

const run = async () => {
  // createIfNotExists: não sobrescreve se a cliente já editou.
  for (const d of docs) {
    await client.createIfNotExists(d);
    console.log("  seeded", d._id);
  }
  console.log("Pronto.");
};

run().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
