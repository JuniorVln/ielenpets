import type { StructureResolver } from "sanity/structure";

// Menu do painel: Produtos como lista normal; páginas como documentos únicos.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Conteúdo")
    .items([
      S.documentTypeListItem("produto").title("Produtos"),
      S.divider(),
      S.listItem()
        .title("Página Inicial")
        .id("inicio")
        .child(S.document().schemaType("inicio").documentId("inicio")),
      S.listItem()
        .title("Quem Somos")
        .id("quemSomos")
        .child(S.document().schemaType("quemSomos").documentId("quemSomos")),
      S.listItem()
        .title("Contato & Endereço")
        .id("contato")
        .child(S.document().schemaType("contato").documentId("contato")),
    ]);
