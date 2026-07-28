/* Fonte de dados do catálogo — lê os produtos do painel (Sanity) ao vivo.
   Mantém o mesmo formato que o site já usava (window.IELEN_PRODUCTS),
   então catalogo.html e produto.html continuam funcionando igual. */
(function () {
    const PROJECT_ID = "zfn09zm7";
    const DATASET = "production";
    const API_VERSION = "2024-06-01";
    // apicdn = borda cacheada (rápida). Atualizações no painel aparecem em ~1 min.
    const BASE = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

    // Parâmetros de imagem: entrega WebP redimensionado direto da CDN do Sanity.
    const IMG = "?w=700&fm=webp&q=80&fit=max";
    const withImg = (url) => (url ? url + IMG : url);

    const QUERY = `*[_type=="produto"]{
        "id": coalesce(productId, _id),
        "code": code,
        "name": name,
        "brand": brand,
        "section": section,
        "image": mainImage.asset->url,
        "variants": variants[]{
            "size": size,
            "code": code,
            "image": coalesce(image.asset->url, ^.mainImage.asset->url)
        }
    } | order(name asc)`;

    let cache = null;

    window.loadIelenProducts = async function loadIelenProducts() {
        if (cache) return cache;

        // Cache curto na sessão p/ navegação entre páginas ficar instantânea.
        try {
            const s = sessionStorage.getItem("ielen_products");
            if (s) {
                const parsed = JSON.parse(s);
                if (parsed.t && Date.now() - parsed.t < 5 * 60 * 1000) {
                    cache = parsed.data;
                    window.IELEN_PRODUCTS = cache;
                    return cache;
                }
            }
        } catch (_) {}

        const url = `${BASE}?query=${encodeURIComponent(QUERY)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Falha ao carregar catálogo: " + res.status);
        const json = await res.json();

        const products = (json.result || [])
            .filter((p) => p && p.name)
            .map((p) => ({
                id: p.id,
                code: p.code || "",
                name: p.name,
                brand: p.brand || "",
                section: p.section || "",
                image: withImg(p.image) || "",
                variants: (p.variants || []).map((v) => ({
                    size: v.size || "",
                    code: v.code || "",
                    image: withImg(v.image) || "",
                })),
            }));

        cache = products;
        window.IELEN_PRODUCTS = products;
        window.IELEN_READY = true;
        try {
            sessionStorage.setItem(
                "ielen_products",
                JSON.stringify({ t: Date.now(), data: products })
            );
        } catch (_) {}
        return products;
    };

    // Consulta avulsa — usada pelas páginas que não precisam do catálogo inteiro.
    async function query(groq) {
        const res = await fetch(`${BASE}?query=${encodeURIComponent(groq)}`);
        if (!res.ok) throw new Error("Falha na consulta: " + res.status);
        return (await res.json()).result;
    }

    // Textos de um produto só (resumo e "sobre"), buscados sob demanda para não
    // pesar a query do catálogo, que traz os ~3 mil produtos de uma vez.
    window.loadIelenProdutoTextos = async function (id) {
        if (id === undefined || id === null || id === "") return null;
        const idNum = Number(id);
        const filtro = Number.isFinite(idNum)
            ? `productId == ${idNum} || _id == "produto-${idNum}"`
            : `_id == "${String(id).replace(/"/g, '')}"`;
        try {
            return await query(`*[_type=="produto" && (${filtro})][0]{resumo, descricao}`);
        } catch (e) {
            console.warn("Textos do produto indisponíveis:", e);
            return null;
        }
    };

    window.loadIelenParceiros = async function () {
        try {
            return await query(`*[_type=="parceiros"][0]{
                titulo,
                subtitulo,
                "logos": logos[]{ nome, site, "imagem": logo.asset->url }
            }`);
        } catch (e) {
            console.warn("Parceiros indisponíveis:", e);
            return null;
        }
    };

    window.loadIelenOfertas = async function () {
        try {
            return await query(`*[_type=="ofertas"][0]{
                ativo, mes, titulo, subtitulo, descricao, botao,
                "arquivo": arquivo.asset->url,
                "arquivoNome": arquivo.asset->originalFilename,
                "atualizadoEm": arquivo.asset->_updatedAt
            }`);
        } catch (e) {
            console.warn("Ofertas indisponíveis:", e);
            return null;
        }
    };
})();
