# Como atualizar as Ofertas do Mês

Toda vez que sair o catálogo promocional do mês, faça só estes 3 passos:

## 1. Coloque o PDF nesta pasta

Copie o arquivo PDF para:

```
ofertas/
```

Exemplo de nome: `catalogo-promocional.pdf`

Pode usar outro nome, desde que seja o mesmo informado no `config.json`.

## 2. Edite o arquivo `config.json`

Abra `ofertas/config.json` e ajuste os campos:

| Campo | O que significa | Exemplo |
|-------|-----------------|---------|
| `ativo` | `true` = mostra o download no site | `true` |
| `mes` | Mês/ano da promoção | `"Julho 2026"` |
| `titulo` | Título principal da página | `"Ofertas do Mês"` |
| `subtitulo` | Texto de apoio curto | `"Condições especiais..."` |
| `descricao` | Texto maior da página | `"Baixe o catálogo..."` |
| `arquivo` | Nome do PDF nesta pasta | `"catalogo-promocional.pdf"` |
| `botao` | Texto do botão de download | `"Baixar catálogo PDF"` |
| `atualizado_em` | Data da atualização (opcional) | `"2026-07-09"` |

### Exemplo pronto para publicar

```json
{
  "ativo": true,
  "mes": "Julho 2026",
  "titulo": "Ofertas do Mês",
  "subtitulo": "Condições especiais para abastecer o seu negócio.",
  "descricao": "Baixe o catálogo promocional e fale com o televendas para condições comerciais.",
  "arquivo": "catalogo-promocional.pdf",
  "botao": "Baixar catálogo PDF",
  "atualizado_em": "2026-07-09"
}
```

## 3. Publique / envie os arquivos

Envie para o site (ou para quem faz o deploy):

1. `ofertas/config.json`
2. `ofertas/seu-arquivo.pdf`

Pronto. A página `ofertas.html` lê o `config.json` automaticamente.

## Atalho: painel auxiliar

Abra no navegador (com o site rodando localmente):

```
http://localhost:5500/admin-ofertas.html
```

Preencha os campos, baixe o `config.json` gerado e substitua o arquivo na pasta `ofertas/`.

## Para desativar a promoção

No `config.json`, mude:

```json
"ativo": false
```

O site volta a mostrar “Download em breve”.
