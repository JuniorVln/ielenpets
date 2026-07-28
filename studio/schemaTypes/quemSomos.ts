import { defineType, defineField } from "sanity";

export default defineType({
  name: "quemSomos",
  title: "Quem Somos",
  type: "document",
  fields: [
    defineField({ name: "titulo", title: "Título", type: "string" }),
    defineField({
      name: "texto",
      title: "Texto da história",
      type: "array",
      of: [{ type: "block" }],
      description: "Um parágrafo por bloco. Use negrito para destacar.",
    }),
    defineField({
      name: "imagem",
      title: "Imagem",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: { prepare: () => ({ title: "Quem Somos" }) },
});
