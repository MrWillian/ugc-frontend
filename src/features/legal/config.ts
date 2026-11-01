// Placeholders in brackets must be replaced before publishing.
export const legalEntity = {
  brand: "SocialProof",
  companyName: "SocialProof",
  cnpj: "[CNPJ]",
  address: "Centro, Boquira - Bahia, Brasil",
  contactEmail: "williansoares.dev@gmail.com",
  dpoName: "Willian Marciel",
  dpoEmail: "williansoares.dev@gmail.com",
  forumCity: "Boquira/BA",
  lastUpdated: "31 de outubro de 2026",
} as const;

export const legalDocuments = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/exclusao-de-dados", label: "Exclusão de dados" },
] as const;

export const dataRequestResponseDays = 15;
