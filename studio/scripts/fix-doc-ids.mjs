#!/usr/bin/env node
/**
 * Correção ÚNICA: renomeia documentos `produto.<id>` -> `produto-<id>`.
 *
 * Motivo: IDs com ponto no Sanity são documentos "privados" (como drafts.*),
 * invisíveis para consultas sem token — o site não enxergava nenhum produto.
 *
 * Copia cada documento como está (preserva edições feitas no painel) para o
 * novo _id e depois apaga o antigo. Resumível: se rodar de novo, só processa
 * o que faltar.
 *
 * Uso: node scripts/fix-doc-ids.mjs [--dry]
 * Token: SANITY_AUTH_TOKEN ou ~/.config/sanity/config.json.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT_ID = "zfn09zm7";
const DATASET = "production";
const TX_BATCH = 100;
const DRY = process.argv.includes("--dry");

function getToken() {
  if (process.env.SANITY_AUTH_TOKEN) return process.env.SANITY_AUTH_TOKEN;
  const cfg = path.join(os.homedir(), ".config", "sanity", "config.json");
  return JSON.parse(fs.readFileSync(cfg, "utf8")).authToken;
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-06-01",
  token: getToken(),
  useCdn: false,
});

async function run() {
  const docs = await client.fetch(
    `*[_type=="produto" && !(_id in path("drafts.**"))]`
  );
  const dotted = docs.filter((d) => d._id.includes("."));
  console.log(`Documentos com ID pontuado: ${dotted.length}`);
  if (!dotted.length) return console.log("Nada a corrigir.");

  if (DRY) {
    console.log("(dry-run) exemplos:", dotted.slice(0, 3).map((d) => d._id));
    return;
  }

  let done = 0;
  for (let i = 0; i < dotted.length; i += TX_BATCH) {
    const batch = dotted.slice(i, i + TX_BATCH);
    let tx = client.transaction();
    for (const doc of batch) {
      const { _rev, _createdAt, _updatedAt, _system, ...rest } = doc;
      const newId = doc._id.replace(/\./g, "-");
      tx = tx.createOrReplace({ ...rest, _id: newId });
      tx = tx.delete(doc._id);
    }
    await tx.commit({ visibility: "async" });
    done += batch.length;
    console.log(`  ${done}/${dotted.length}`);
  }
  console.log("Pronto. Verifique com: count(*[_type=='produto']) sem token.");
}

run().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
