import type { Metadata } from "next";
import Link from "next/link";
import { dataRequestResponseDays, legalEntity } from "@/features/legal/config";
import { LegalDocument, LegalSection, MailLink } from "@/features/legal/components/LegalDocument";

export const metadata: Metadata = {
  title: "Exclusão de dados · SocialProof",
  description:
    "Como solicitar a exclusão dos seus dados no SocialProof, seja você Cliente ou Criador do Instagram.",
};

export default function DataDeletionPage() {
  const { brand, dpoEmail } = legalEntity;

  return (
    <LegalDocument
      intro={
        <p>
          Você pode pedir a exclusão dos seus dados do {brand} a qualquer momento. Veja abaixo
          o passo a passo para o seu caso. Os pedidos são feitos por e-mail e atendidos
          manualmente pelo nosso Encarregado. Mais detalhes sobre como tratamos dados estão na{" "}
          <Link className="font-medium text-primary hover:underline" href="/privacidade">
            Política de Privacidade
          </Link>
          .
        </p>
      }
      title="Instruções para exclusão de dados"
    >
      <LegalSection id="cliente" title="1. Se você é Cliente (tem uma conta no painel)">
        <ol>
          <li>
            Envie um e-mail para <MailLink email={dpoEmail} /> a partir do e-mail cadastrado
            na sua conta, com o assunto &quot;Exclusão de conta&quot;.
          </li>
          <li>Informe o nome da empresa e o subdomínio da conta.</li>
          <li>
            Confirmaremos o pedido e excluiremos a conta, as campanhas, os widgets, as
            publicações coletadas, os registros de consentimento e o token de acesso ao
            Instagram.
          </li>
        </ol>
        <p>
          Para encerrar também as cobranças, cancele a assinatura antes ou peça o
          cancelamento no mesmo e-mail.
        </p>
      </LegalSection>

      <LegalSection id="criador" title="2. Se você é Criador do Instagram">
        <p>
          Se uma publicação sua foi coletada por uma campanha de um Cliente do {brand}, você
          pode pedir a remoção dela e dos dados associados:
        </p>
        <ol>
          <li>
            Envie um e-mail para <MailLink email={dpoEmail} /> com o assunto &quot;Remoção de
            conteúdo&quot;.
          </li>
          <li>
            Informe o seu nome de usuário do Instagram (@usuario) e, se possível, o link das
            publicações.
          </li>
          <li>
            Retiraremos as publicações dos widgets, apagaremos a mídia, o nome de usuário e os
            registros de consentimento, e avisaremos os Clientes responsáveis.
          </li>
        </ol>
        <p>
          Guardamos apenas o identificador de cada publicação removida, marcado como
          bloqueado, para que ela não seja coletada de novo enquanto a campanha continuar
          ativa.
        </p>
        <p>
          Se você autorizou a exibição de uma publicação pelo link de consentimento e mudou de
          ideia, o mesmo pedido revoga a autorização.
        </p>
      </LegalSection>

      <LegalSection id="meta" title="3. Remover o acesso do app pelo Instagram ou Facebook">
        <p>
          Clientes que conectaram uma conta do Instagram também podem revogar o acesso do{" "}
          {brand} diretamente na Meta:
        </p>
        <ol>
          <li>
            No Instagram, acesse <strong>Configurações e privacidade</strong> &gt;{" "}
            <strong>Apps e sites</strong>, ou, no Facebook, <strong>Configurações</strong>{" "}
            &gt; <strong>Integrações comerciais</strong>.
          </li>
          <li>
            Encontre o {brand} na lista e selecione <strong>Remover</strong>.
          </li>
        </ol>
        <p>
          Revogar o acesso interrompe novas coletas, mas não apaga os dados já armazenados.
          Para isso, siga também o passo 1.
        </p>
      </LegalSection>

      <LegalSection id="prazos" title="4. Prazos e dados mantidos por terceiros">
        <ul>
          <li>Respondemos aos pedidos em até {dataRequestResponseDays} dias.</li>
          <li>Após a confirmação, a exclusão no nosso banco de dados é concluída em até 30 dias.</li>
          <li>
            Cópias de segurança do banco de dados são eliminadas conforme o ciclo de retenção
            do nosso provedor de hospedagem.
          </li>
          <li>
            O histórico de pagamentos fica com a Stripe, que o mantém conforme a própria
            política de retenção e as obrigações legais dela.
          </li>
        </ul>
      </LegalSection>
    </LegalDocument>
  );
}
