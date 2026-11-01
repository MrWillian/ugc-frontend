import type { Metadata } from "next";
import Link from "next/link";
import { legalEntity } from "@/features/legal/config";
import { LegalDocument, LegalSection, MailLink } from "@/features/legal/components/LegalDocument";

export const metadata: Metadata = {
  title: "Termos de Uso · SocialProof",
  description:
    "Condições para uso da plataforma SocialProof de coleta, moderação e exibição de conteúdo gerado por usuários.",
};

export default function TermsPage() {
  const { brand, companyName, controllerName, address, contactEmail, forumCity } = legalEntity;

  return (
    <LegalDocument
      intro={
        <p>
          Estes Termos de Uso regulam o acesso e o uso da plataforma {companyName}, mantida
          por {controllerName}, pessoa física, com endereço em {address}. Ao criar uma conta ou utilizar a plataforma, você declara que leu, entendeu e concorda com
          estes Termos e com a nossa{" "}
          <Link className="font-medium text-primary hover:underline" href="/privacidade">
            Política de Privacidade
          </Link>
          .
        </p>
      }
      title="Termos de Uso"
    >
      <LegalSection id="definicoes" title="1. Definições">
        <ul>
          <li>
            <strong>Plataforma:</strong> o painel web, as APIs e os widgets incorporáveis
            disponibilizados pelo {brand}.
          </li>
          <li>
            <strong>Cliente:</strong> a pessoa jurídica ou física que cria uma conta e
            contrata a Plataforma para coletar e exibir conteúdo.
          </li>
          <li>
            <strong>Criador:</strong> o titular de uma conta do Instagram que publicou um
            conteúdo coletado pela Plataforma.
          </li>
          <li>
            <strong>Conteúdo gerado por usuários (UGC):</strong> fotos, vídeos, legendas e
            demais informações publicadas por Criadores.
          </li>
          <li>
            <strong>Widget:</strong> o código que o Cliente insere em seu site para exibir
            conteúdos aprovados.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="servico" title="2. Descrição do serviço">
        <p>A Plataforma permite que o Cliente:</p>
        <ul>
          <li>crie campanhas baseadas em hashtags;</li>
          <li>
            conecte uma conta profissional do Instagram por meio do login oficial da Meta
            para coletar publicações públicas relacionadas às campanhas;
          </li>
          <li>modere as publicações coletadas, aprovando ou rejeitando cada uma;</li>
          <li>
            solicite ao Criador, por meio de um link de consentimento, autorização para
            exibir o conteúdo;
          </li>
          <li>
            exiba em seus próprios sites, por meio de widgets, somente os conteúdos
            aprovados e autorizados pelos Criadores.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="conta" title="3. Cadastro e conta">
        <ul>
          <li>
            O Cliente deve fornecer informações verdadeiras, completas e atualizadas no
            cadastro, e ter capacidade legal para contratar.
          </li>
          <li>
            O Cliente é responsável pela confidencialidade de suas credenciais e por todas
            as atividades realizadas em sua conta.
          </li>
          <li>
            Qualquer uso não autorizado da conta deve ser comunicado imediatamente pelo
            e-mail <MailLink email={contactEmail} />.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="planos" title="4. Planos, pagamento e limites">
        <ul>
          <li>
            A Plataforma oferece um plano gratuito, com os limites do plano inicial. Limites
            maiores dependem da contratação de um plano pago.
          </li>
          <li>
            Os pagamentos são processados pela Stripe. O {brand} não armazena os dados
            completos do cartão de crédito.
          </li>
          <li>
            Cada plano tem limites próprios, como o número de campanhas ativas e de widgets.
            Ao atingir um limite, a criação de novos itens fica bloqueada até a mudança de
            plano.
          </li>
          <li>
            O Cliente pode cancelar a assinatura a qualquer momento. O cancelamento tem
            efeito imediato: a conta volta na hora aos limites do plano inicial e as
            cobranças futuras são interrompidas. Não há reembolso proporcional do período já
            pago, salvo quando exigido por lei.
          </li>
          <li>
            Os preços podem ser reajustados mediante aviso prévio de pelo menos 30 dias.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="obrigacoes" title="5. Obrigações do Cliente">
        <p>Ao usar a Plataforma, o Cliente se compromete a:</p>
        <ul>
          <li>
            exibir conteúdos de Criadores somente após obter o consentimento expresso deles,
            utilizando o link de consentimento da Plataforma ou outro meio válido;
          </li>
          <li>
            respeitar a decisão do Criador que recusar ou revogar o consentimento, removendo
            o conteúdo de seus canais;
          </li>
          <li>
            não utilizar os conteúdos para fins ilícitos, difamatórios, discriminatórios ou
            que violem direitos de terceiros;
          </li>
          <li>
            cumprir a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Código de
            Defesa do Consumidor e a legislação de direitos autorais e de imagem;
          </li>
          <li>
            cumprir os Termos de Uso e as políticas da Meta e do Instagram, incluindo os
            Termos da Plataforma Meta;
          </li>
          <li>
            não tentar burlar limites técnicos, acessar dados de outros Clientes ou fazer
            engenharia reversa da Plataforma.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="meta" title="6. Integração com a Meta e o Instagram">
        <ul>
          <li>
            A conexão com o Instagram é feita pelo login oficial da Meta. O Cliente pode
            revogar o acesso a qualquer momento nas configurações da sua conta do
            Instagram ou do Facebook.
          </li>
          <li>
            Os dados obtidos pela API da Meta são usados exclusivamente para prestar o
            serviço descrito nestes Termos, conforme a nossa Política de Privacidade.
          </li>
          <li>
            O funcionamento da coleta depende da disponibilidade e das regras da API da
            Meta, que podem mudar sem aviso. O {brand} não se responsabiliza por
            indisponibilidades ou restrições impostas pela Meta.
          </li>
          <li>
            O {brand} não é afiliado, patrocinado nem endossado pela Meta Platforms, Inc.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="propriedade" title="7. Propriedade intelectual">
        <ul>
          <li>
            A Plataforma, sua marca, código, layout e documentação pertencem ao {brand} e
            são protegidos pela legislação de propriedade intelectual. O Cliente recebe
            apenas uma licença de uso limitada, não exclusiva e intransferível durante a
            vigência da assinatura.
          </li>
          <li>
            Os conteúdos dos Criadores continuam pertencendo aos próprios Criadores. A
            Plataforma apenas intermedeia a solicitação de autorização de uso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilidade" title="8. Limitação de responsabilidade">
        <ul>
          <li>
            A Plataforma é fornecida &quot;no estado em que se encontra&quot;. Empregamos
            esforços razoáveis para mantê-la disponível e segura, mas não garantimos
            funcionamento ininterrupto ou livre de erros.
          </li>
          <li>
            O Cliente é o único responsável pela forma como utiliza e exibe os conteúdos dos
            Criadores em seus canais.
          </li>
          <li>
            Na máxima extensão permitida pela lei, a responsabilidade total do {brand} fica
            limitada ao valor pago pelo Cliente nos 12 meses anteriores ao evento que deu
            origem à reclamação.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="encerramento" title="9. Suspensão e encerramento">
        <ul>
          <li>
            O {brand} pode suspender ou encerrar contas que violem estes Termos, a
            legislação ou as políticas da Meta, mediante notificação sempre que possível.
          </li>
          <li>
            O Cliente pode encerrar sua conta a qualquer momento, conforme as instruções da
            página de{" "}
            <Link className="font-medium text-primary hover:underline" href="/exclusao-de-dados">
              exclusão de dados
            </Link>
            .
          </li>
          <li>
            Após o encerramento, os dados são eliminados ou anonimizados conforme a Política
            de Privacidade, ressalvadas as hipóteses de guarda obrigatória previstas em lei.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="alteracoes" title="10. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Alterações relevantes serão
          comunicadas por e-mail ou na própria Plataforma com antecedência mínima de 15
          dias. O uso continuado após a vigência das alterações representa concordância com
          a nova versão.
        </p>
      </LegalSection>

      <LegalSection id="foro" title="11. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito
          o foro da comarca de {forumCity} para dirimir quaisquer controvérsias, ressalvado o
          direito do consumidor de ajuizar ação no foro de seu domicílio.
        </p>
      </LegalSection>

      <LegalSection id="contato" title="12. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para <MailLink email={contactEmail} />
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
