import { defineType, defineField } from "sanity";

export default defineType({
  name: "inicio",
  title: "Página Inicial",
  type: "document",
  fields: [
    defineField({ name: "heroTitulo", title: "Título do topo (hero)", type: "string" }),
    defineField({ name: "heroSubtitulo", title: "Subtítulo do topo", type: "text", rows: 3 }),
    defineField({
      name: "heroImagem",
      title: "Imagem do topo",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: { prepare: () => ({ title: "Página Inicial" }) },
});
