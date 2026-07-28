import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "parceiros",
  title: "Parceiros (logos)",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título da seção",
      type: "string",
      description: 'Aparece na página inicial. Ex.: "Principais parceiros da indústria".',
    }),
    defineField({
      name: "subtitulo",
      title: "Texto abaixo do título",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "logos",
      title: "Logos dos parceiros",
      type: "array",
      description:
        "Adicione uma logo por parceiro. Prefira imagem PNG com fundo transparente. A ordem aqui é a ordem que aparece no site.",
      of: [
        defineArrayMember({
          type: "object",
          name: "parceiro",
          title: "Parceiro",
          fields: [
            defineField({
              name: "nome",
              title: "Nome do parceiro",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "logo",
              title: "Logo",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "site",
              title: "Site do parceiro (opcional)",
              type: "url",
              description: "Se preencher, a logo vira um link.",
            }),
          ],
          preview: { select: { title: "nome", media: "logo" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Parceiros (logos)" }) },
});
