import { defineType, defineField } from "sanity";

export default defineType({
  name: "ofertas",
  title: "Ofertas do Mês",
  type: "document",
  fields: [
    defineField({
      name: "ativo",
      title: "Mostrar o download no site",
      type: "boolean",
      initialValue: false,
      description:
        'Ligue depois de subir o PDF. Desligado, a página mostra "Em breve".',
    }),
    defineField({
      name: "arquivo",
      title: "PDF do catálogo promocional",
      type: "file",
      options: { accept: ".pdf" },
      description: "Arraste o PDF aqui. É este arquivo que o cliente baixa.",
    }),
    defineField({
      name: "mes",
      title: "Mês da promoção",
      type: "string",
      description: 'Ex.: "Agosto 2026".',
    }),
    defineField({ name: "titulo", title: "Título da página", type: "string" }),
    defineField({ name: "subtitulo", title: "Subtítulo", type: "text", rows: 2 }),
    defineField({ name: "descricao", title: "Descrição", type: "text", rows: 3 }),
    defineField({
      name: "botao",
      title: "Texto do botão",
      type: "string",
      description: 'Ex.: "Baixar catálogo PDF".',
    }),
  ],
  preview: {
    select: { ativo: "ativo", mes: "mes" },
    prepare: ({ ativo, mes }) => ({
      title: "Ofertas do Mês",
      subtitle: (ativo ? "No ar" : "Oculto") + (mes ? " · " + mes : ""),
    }),
  },
});
