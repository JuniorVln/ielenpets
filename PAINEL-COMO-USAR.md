# Painel da Ielenpet — como gerenciar o site

O site agora tem um **painel** onde você mesma cadastra e altera os produtos, troca
fotos e edita os textos das páginas. Não precisa mexer em código nem chamar ninguém:
o que você salvar no painel aparece no site sozinho (em cerca de 1 minuto).

## 1. Entrar no painel

Acesse: **https://ielenpets.sanity.studio**

- Faça login com o e-mail que foi convidado (Google ou e-mail + senha).
- Na primeira vez, aceite o convite que chega no seu e-mail.

> Guarde esse link nos favoritos. É o seu painel de administração.

## 2. Mexer nos produtos

No menu à esquerda, clique em **Produtos**.

- **Buscar** um produto: use a busca no topo da lista (por nome).
- **Alterar** um produto: clique nele, mude o que quiser e clique em **Publish**
  (publicar) no canto inferior direito. Sem publicar, a mudança não vai pro site.
- **Trocar a foto**: no campo *Foto principal*, clique na imagem, remova e envie a nova.
- **Cadastrar um produto novo**: botão de **+** (novo documento) → **Produto**.
  Preencha:
  - **Nome do produto** (obrigatório)
  - **Foto principal**
  - **Marca** e **Seção** (a seção define em qual categoria ele aparece no catálogo)
  - **Código** (obrigatório)
  - **Apresentações / tamanhos**: uma linha por tamanho (ex.: 1KG, 5KG). Se o produto
    tem só um tamanho, deixe uma linha só.
  - Clique em **Publish**.
- **Excluir** um produto: abra o produto → menu **⋮** (três pontinhos) → **Delete**.

## 3. Descrição do produto (o texto "Sobre o Produto")

Dentro de cada produto existem dois campos de texto:

- **Resumo** — a frase que aparece logo abaixo do nome do produto.
- **Sobre o produto** — o texto do bloco "Sobre o Produto", mais abaixo na página.

Os dois são **opcionais**. Se você deixar em branco, o site monta um texto
automático com a marca e a seção — que é o que aparece hoje. Assim que você
escrever algo e clicar em **Publish**, o seu texto substitui o automático.

> Para separar parágrafos em "Sobre o produto", **pule uma linha** entre eles.

## 4. Logos dos parceiros

No menu à esquerda: **Parceiros (logos)**.

- Em **Logos dos parceiros**, clique em **Add item** para cada parceiro.
- Preencha o **Nome**, envie a **Logo** e, se quiser, o **Site** (a logo vira link).
- A ordem da lista é a ordem que aparece no site — arraste para reordenar.
- Clique em **Publish**.

> Prefira **PNG com fundo transparente**. A seção fica sobre fundo verde escuro,
> então logos com fundo branco aparecem dentro de um quadrado branco.

Enquanto não houver nenhuma logo cadastrada, o site mostra os espaços reservados.

## 5. Ofertas do Mês (o PDF para download)

No menu à esquerda: **Ofertas do Mês**.

1. Em **PDF do catálogo promocional**, envie o arquivo.
2. Preencha o **Mês da promoção** (ex.: "Agosto 2026").
3. Ligue a chave **Mostrar o download no site**.
4. Clique em **Publish**.

Para tirar do ar quando a promoção acabar, é só desligar a chave e publicar de
novo — a página volta a mostrar "Em breve". Não precisa apagar o PDF.

## 6. Editar textos e fotos das páginas

Ainda no menu à esquerda:

- **Página Inicial** — título e subtítulo do topo, imagem principal.
- **Quem Somos** — título e os parágrafos da história.
- **Contato & Endereço** — telefone, WhatsApp, e-mail, endereço e horário.

Edite e clique em **Publish**. (A ligação dessas três páginas ao painel ainda
está sendo finalizada — os **produtos, parceiros e ofertas já funcionam 100%**.)

## 4. Dúvidas comuns

- **Publiquei e não aparece no site.** Espere ~1 minuto e atualize a página do site
  (Ctrl+F5). O site usa um cache curto pra ficar rápido.
- **Salvei sem querer algo errado.** O painel guarda o histórico: abra o documento →
  menu **⋮** → é possível voltar a uma versão anterior.
- **Não sai do rascunho.** Toda alteração vira rascunho até você clicar em **Publish**.

---

### Notas técnicas (para o Junior / dev)

- **Projeto Sanity:** `zfn09zm7` · dataset `production` (público p/ leitura).
- **Studio:** pasta `studio/` neste repo. Deploy: `cd studio && npx sanity deploy`.
- **Site (estático):** lê os produtos ao vivo pela CDN do Sanity via `sanity-data.js`
  (mantém o formato antigo `window.IELEN_PRODUCTS`). `products.js` ficou obsoleto —
  não é mais a fonte de verdade (pode ser removido depois de validar em produção).
- **Convidar a cliente:** sanity.io/manage → projeto Ielenpets → Members → Invite.
- **Migração:** `studio/scripts/migrate-to-sanity.mjs` foi rodada **uma única vez**
  para o primeiro carregamento. Não rodar de novo (sobrescreveria edições da cliente).
- **Correção de IDs:** a migração criou docs com `_id` `produto.<n>` (ponto = documento
  privado no Sanity, invisível na API pública). `studio/scripts/fix-doc-ids.mjs` renomeia
  para `produto-<n>` preservando edições do painel. Rodar uma vez e validar com
  `count(*[_type=="produto"])` sem token.
- **Parceiros e Ofertas (28/07):** singletons `parceiros` e `ofertas` criados por
  `studio/scripts/seed-parceiros-ofertas.mjs` (idempotente). A home lê as logos em
  `index.html` (grid `#parceirosGrid`, com os placeholders como fallback) e
  `ofertas.html` lê o PDF do Sanity, caindo em `ofertas/config.json` se não houver
  nada cadastrado. O PDF agora é asset do Sanity — não precisa mais subir por FTP.
- **Textos do produto (28/07):** campos `resumo` e `descricao` no schema `produto`.
  `produto.html` busca esses dois campos numa query avulsa (`loadIelenProdutoTextos`)
  para não inflar a query do catálogo, que carrega os ~3 mil produtos de uma vez.
  Ambos têm fallback para o texto automático que já existia.
- **CORS:** as origens ficam em sanity.io/manage → API → CORS. Para testar local,
  a origem exata (ex.: `http://localhost:8899`) precisa estar cadastrada, senão o
  fetch falha e a seção fica no fallback silenciosamente.
- **Pendente (fase 2):** ligar as páginas estáticas (index/quem-somos/contato) para
  lerem os singletons do painel. Hoje esses textos ainda estão no HTML.
