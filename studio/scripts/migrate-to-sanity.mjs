#!/usr/bin/env node
/**
 * Migração ÚNICA: products.js -> Sanity (projeto Ielenpets).
 * Etapa 1: sobe cada imagem distinta uma vez (pool paralelo + cache resumível).
 * Etapa 2: cria um documento `produto` por item (em transações de lote).
 *
 * Uso:
 *   node scripts/migrate-to-sanity.mjs             # migra tudo (resumível)
 *   node scripts/migrate-to-sanity.mjs --limit 20  # teste
 *
 * Token: SANITY_AUTH_TOKEN ou ~/.config/sanity/config.json.
 * Uso único (primeiro carregamento). Depois o catálogo é gerenciado no painel.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/ -> studio/ -> repo root
const ROOT = path.resolve(__dirname, "..", "..");

const PROJECT_ID = "zfn09zm7";
const DATASET = "production";
const UPLOAD_CONCURRENCY = 12;
const TX_BATCH = 100;

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

function loadProducts() {
  const raw = fs.readFileSync(path.join(ROOT, "products.js"), "utf8");
  const json = raw.slice(raw.indexOf("=") + 1, raw.lastIndexOf(";")).trim();
  return JSON.parse(json);
}

const CACHE_PATH = path.join(__dirname, ".sanity-asset-cache.json");
const assetCache = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"))
  : {};
function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(assetCache));
}

async function uploadOne(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.warn("  ! imagem não encontrada:", rel);
    return;
  }
  const asset = await client.assets.upload("image", fs.createReadStream(abs), {
    filename: path.basename(rel),
  });
  assetCache[rel] = asset._id;
}

// Pool de concorrência para uploads.
async function uploadAll(paths) {
  const pending = paths.filter((p) => p && !assetCache[p]);
  console.log(
    `Imagens: ${paths.length} distintas · ${pending.length} a subir · ${Object.keys(assetCache).length} já no cache`
  );
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < pending.length) {
      const rel = pending[i++];
      try {
        await uploadOne(rel);
      } catch (e) {
        console.warn("  ! erro upload", rel, e.message);
      }
      done++;
      if (done % 50 === 0) {
        saveCache();
        console.log(`  ${done}/${pending.length} imagens enviadas`);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, pending.length) }, worker)
  );
  saveCache();
  console.log(`Imagens prontas: ${Object.keys(assetCache).length} no cache.`);
}

function imageField(rel) {
  const id = rel ? assetCache[rel] : null;
  return id
    ? { _type: "image", asset: { _type: "reference", _ref: id } }
    : undefined;
}

async function run() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : null;

  let products = loadProducts();
  if (limit) products = products.slice(0, limit);
  console.log(`Migrando ${products.length} produtos...`);

  // 1) coletar imagens distintas e subir tudo
  const imgs = new Set();
  for (const p of products) {
    if (p.image) imgs.add(p.image);
    for (const v of p.variants || []) if (v.image) imgs.add(v.image);
  }
  await uploadAll([...imgs]);

  // 2) criar documentos em transações de lote
  console.log("Criando documentos...");
  let tx = client.transaction();
  let n = 0;
  let committed = 0;
  for (const p of products) {
    const main = imageField(p.image);
    const variants = (p.variants || []).map((v, idx) => ({
      _key: `v${idx}_${v.code || idx}`,
      _type: "variant",
      size: v.size || "",
      code: v.code || "",
      ...(imageField(v.image) ? { image: imageField(v.image) } : {}),
    }));
    tx = tx.createOrReplace({
      _id: `produto.${p.id}`,
      _type: "produto",
      name: p.name,
      brand: p.brand || "",
      section: p.section || "",
      code: p.code || "",
      productId: p.id,
      ...(main ? { mainImage: main } : {}),
      variants,
    });
    n++;
    if (n % TX_BATCH === 0) {
      await tx.commit({ visibility: "async" });
      committed += TX_BATCH;
      console.log(`  ${committed}/${products.length} documentos`);
      tx = client.transaction();
    }
  }
  if (n % TX_BATCH !== 0) {
    await tx.commit({ visibility: "async" });
    committed = n;
  }
  console.log(`\nPronto. ${committed} produtos migrados.`);
}

run().catch((e) => {
  saveCache();
  console.error("ERRO:", e.message);
  process.exit(1);
});
