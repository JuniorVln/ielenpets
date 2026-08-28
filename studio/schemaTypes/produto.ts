import { defineType, defineField, defineArrayMember } from "sanity";

// Seções conhecidas do catálogo (a cliente pode digitar uma nova se precisar).
export const SECOES = [
  "Acessórios",
  "Agropecuária",
  "Cães",
  "Gaiolas",
  "Gatos",
  "Higiene",
  "Medicamentos",
  "Pássaros",
  "Peixes",
  "Petiscos",
  "Rações",
  "Répteis",
  "Roedores",
];

export default defineType({
  name: "produto",
  title: "Produto",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome do produto",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Foto principal",
      type: "image",
      options: { hotspot: true },
      description: "Foto que aparece no catálogo e no topo da página do produto.",
    }),
    defineField({
      name: "brand",
      title: "Marca",
      type: "string",
    }),
    defineField({
      name: "resumo",
      title: "Resumo (aparece logo abaixo do nome)",
      type: "text",
      rows: 3,
      description:
        "Frase curta de apresentação do produto. Se deixar vazio, o site monta uma frase automática com a marca e a seção.",
    }),
    defineField({
      name: "descricao",
      title: "Sobre o produto",
      type: "text",
      rows: 8,
      description:
        'Texto do bloco "Sobre o Produto". Pule uma linha para separar parágrafos. Se deixar vazio, o site usa um texto padrão.',
    }),
    defineField({
      name: "section",
      title: "Seção",
      type: "string",
      options: {
        list: SECOES.map((s) => ({ title: s, value: s })),
      },
      description:
        "Categoria do produto no catálogo (ex.: Cães, Gatos, Peixes...).",
    }),
    defineField({
      name: "code",
      title: "Código",
      type: "string",
      description:
        "Código principal do produto. Usado no link da página e na busca.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "variants",
      title: "Apresentações / tamanhos",
      type: "array",
      description:
        "Cada tamanho ou apresentação do produto (ex.: 1KG, 5KG). Se o produto tem só um tamanho, deixe uma linha.",
      of: [
        defineArrayMember({
          type: "object",
          name: "variant",
          title: "Apresentação",
          fields: [
            defineField({ name: "size", title: "Tamanho", type: "string" }),
            defineField({ name: "code", title: "Código", type: "string" }),
            defineField({
              name: "image",
              title: "Foto desta apresentação (opcional)",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "size", subtitle: "code", media: "image" },
          },
        }),
      ],
    }),
    defineField({
      name: "productId",
      title: "ID interno (não mexer)",
      type: "number",
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: "Nome (A-Z)",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Seção",
      name: "section",
      by: [
        { field: "section", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { title: "name", brand: "brand", section: "section", media: "mainImage" },
    prepare({ title, brand, section, media }) {
      return {
        title,
        subtitle: [brand, section].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
