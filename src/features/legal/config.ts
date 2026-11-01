// Placeholders in brackets must be replaced before publishing.
export const legalEntity = {
  brand: "SocialProof",
  companyName: "[RAZÃO SOCIAL]",
  cnpj: "[CNPJ]",
  address: "[ENDEREÇO COMPLETO]",
  contactEmail: "[contato@dominio.com.br]",
  dpoName: "[NOME DO ENCARREGADO]",
  dpoEmail: "[privacidade@dominio.com.br]",
  forumCity: "[CIDADE/UF]",
  lastUpdated: "31 de outubro de 2026",
} as const;

export const legalDocuments = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/exclusao-de-dados", label: "Exclusão de dados" },
] as const;

export const dataRequestResponseDays = 15;
