import { defineType, defineField } from "sanity";

export default defineType({
  name: "contato",
  title: "Contato & Endereço",
  type: "document",
  fields: [
    defineField({ name: "telefone", title: "Telefone", type: "string" }),
    defineField({
      name: "whatsapp",
      title: "WhatsApp (só números, com DDD)",
      type: "string",
      description: "Ex.: 5541995950968",
    }),
    defineField({ name: "email", title: "E-mail", type: "string" }),
    defineField({ name: "endereco", title: "Endereço", type: "string" }),
    defineField({ name: "cidade", title: "Cidade / Estado / CEP", type: "string" }),
    defineField({ name: "horario", title: "Horário de atendimento", type: "text", rows: 3 }),
  ],
  preview: { prepare: () => ({ title: "Contato & Endereço" }) },
});
