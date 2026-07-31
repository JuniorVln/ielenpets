import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "novidades",
  title: "Novidades (destaques da home)",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título da seção",
      type: "string",
      description: 'Aparece na página inicial. Ex.: "Novidades".',
    }),
    defineField({
      name: "subtitulo",
      title: "Texto abaixo do título",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "itens",
      title: "Produtos em destaque",
      type: "array",
      description:
        "Cada item é um card na seção Novidades da página inicial. A ordem aqui é a ordem que aparece no site.",
      of: [
        defineArrayMember({
          type: "object",
          name: "destaque",
          title: "Produto em destaque",
          fields: [
            defineField({
              name: "nome",
              title: "Nome do produto",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "descricao",
              title: "Descrição curta",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "imagem",
              title: "Foto do produto",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "selo",
              title: "Selo do card (opcional)",
              type: "string",
              description: 'Etiqueta no canto da foto. Se vazio, mostra "Novo".',
            }),
            defineField({
              name: "link",
              title: "Link do botão (opcional)",
              type: "string",
              description:
                'Para onde o card leva. Se vazio, leva pro catálogo. Pode ser uma página do site (ex.: "catalogo.html") ou um endereço completo.',
            }),
          ],
          preview: { select: { title: "nome", media: "imagem" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Novidades (destaques da home)" }) },
});
