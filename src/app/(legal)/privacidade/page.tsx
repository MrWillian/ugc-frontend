import type { Metadata } from "next";
import Link from "next/link";
import { dataRequestResponseDays, legalEntity } from "@/features/legal/config";
import { LegalDocument, LegalSection, MailLink } from "@/features/legal/components/LegalDocument";

export const metadata: Metadata = {
  title: "Política de Privacidade · SocialProof",
  description:
    "Como o SocialProof coleta, usa, compartilha e protege dados pessoais, em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  const { brand, companyName, cnpj, address, dpoName, dpoEmail } = legalEntity;

  return (
    <LegalDocument
      intro={
        <p>
          Esta Política de Privacidade explica como o {brand}, operado por {companyName}{" "}
          (CNPJ {cnpj}), trata dados pessoais na Plataforma, em conformidade com a Lei Geral
          de Proteção de Dados Pessoais (Lei nº 13.709/2018, &quot;LGPD&quot;) e com o Marco
          Civil da Internet (Lei nº 12.965/2014). Ela se aplica aos Clientes que usam a
          Plataforma, aos Criadores cujos conteúdos são coletados e aos visitantes dos
          nossos sites.
        </p>
      }
      title="Política de Privacidade"
    >
      <LegalSection id="papeis" title="1. Quem é responsável pelos seus dados">
        <ul>
          <li>
            <strong>Dados dos Clientes</strong> (cadastro, conta e pagamento): o {brand} é o{" "}
            <strong>controlador</strong>, ou seja, decide como e por que esses dados são
            tratados.
          </li>
          <li>
            <strong>Dados dos Criadores</strong> (publicações coletadas para as campanhas):
            o Cliente que criou a campanha é o <strong>controlador</strong>, e o {brand}{" "}
            atua como <strong>operador</strong>, tratando os dados em nome e conforme as
            instruções do Cliente. Pedidos de Criadores podem ser enviados diretamente a nós,
            e nós os encaminharemos ao Cliente responsável quando necessário.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="dados" title="2. Quais dados tratamos">
        <p>
          <strong>Clientes e usuários do painel</strong>
        </p>
        <ul>
          <li>nome, e-mail, nome da empresa, subdomínio e senha (armazenada de forma criptografada);</li>
          <li>
            dados da conta profissional do Instagram conectada: identificador, nome de
            usuário e token de acesso concedido pelo login da Meta;
          </li>
          <li>
            dados de assinatura e cobrança: plano, histórico de pagamentos e identificadores
            da Stripe. Os dados completos do cartão são tratados apenas pela Stripe;
          </li>
          <li>
            registros de acesso: endereço IP, data e hora, navegador e páginas acessadas.
          </li>
        </ul>
        <p>
          <strong>Criadores do Instagram</strong>
        </p>
        <ul>
          <li>
            dados públicos das publicações que usam a hashtag de uma campanha: nome de
            usuário, foto ou vídeo, legenda, link e data da publicação;
          </li>
          <li>
            registro do consentimento: decisão (autorizado ou recusado), data e hora, canal
            pelo qual o link foi enviado e, quando informado, o e-mail do Criador.
          </li>
        </ul>
        <p>
          Não coletamos intencionalmente dados pessoais sensíveis nem dados de menores de 18
          anos. Se identificarmos esse tipo de dado, ele será eliminado.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="3. Para que usamos os dados e com qual base legal">
        <ul>
          <li>
            <strong>Criar e manter a conta, prestar o serviço e dar suporte:</strong>{" "}
            execução de contrato (art. 7º, V, da LGPD).
          </li>
          <li>
            <strong>Coletar publicações públicas para as campanhas do Cliente e permitir a
            moderação:</strong> legítimo interesse do Cliente (art. 7º, IX), limitado a
            conteúdos tornados públicos pelo próprio Criador (art. 7º, § 4º).
          </li>
          <li>
            <strong>Exibir o conteúdo do Criador nos widgets do Cliente:</strong>{" "}
            consentimento do Criador (art. 7º, I), obtido pelo link de consentimento. Sem
            essa autorização, o conteúdo não é exibido.
          </li>
          <li>
            <strong>Processar pagamentos e emitir documentos fiscais:</strong> execução de
            contrato e cumprimento de obrigação legal (art. 7º, II e V).
          </li>
          <li>
            <strong>Guardar registros de acesso:</strong> cumprimento de obrigação legal
            (art. 15 do Marco Civil da Internet).
          </li>
          <li>
            <strong>Prevenir fraudes e garantir a segurança da Plataforma:</strong> legítimo
            interesse (art. 7º, IX).
          </li>
          <li>
            <strong>Exercer direitos em processos judiciais ou administrativos:</strong>{" "}
            art. 7º, VI.
          </li>
        </ul>
        <p>
          Os dados obtidos pela API da Meta são usados apenas para as finalidades acima. Não
          vendemos dados pessoais nem os usamos para publicidade de terceiros.
        </p>
      </LegalSection>

      <LegalSection id="compartilhamento" title="4. Com quem compartilhamos">
        <ul>
          <li>
            <strong>Meta Platforms (Instagram):</strong> para autenticar a conta do Cliente e
            obter as publicações das campanhas.
          </li>
          <li>
            <strong>Stripe:</strong> para processar pagamentos e assinaturas.
          </li>
          <li>
            <strong>Provedores de infraestrutura</strong> (hospedagem, banco de dados, envio de
            e-mails): para operar a Plataforma, sob contratos que exigem confidencialidade e
            segurança.
          </li>
          <li>
            <strong>Visitantes dos sites dos Clientes:</strong> os conteúdos autorizados pelos
            Criadores ficam públicos nos widgets.
          </li>
          <li>
            <strong>Autoridades públicas:</strong> quando exigido por lei ou ordem judicial.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="transferencia" title="5. Transferência internacional">
        <p>
          Alguns fornecedores, como a Meta e a Stripe, armazenam dados fora do Brasil. Essas
          transferências seguem o art. 33 da LGPD e se apoiam em cláusulas contratuais e nas
          garantias oferecidas por esses fornecedores.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="6. Por quanto tempo guardamos os dados">
        <ul>
          <li>
            <strong>Dados da conta do Cliente:</strong> enquanto a conta estiver ativa. Após o
            encerramento, são eliminados ou anonimizados em até 90 dias.
          </li>
          <li>
            <strong>Publicações de Criadores:</strong> enquanto a campanha do Cliente
            existir, ou até o Criador recusar o consentimento ou pedir a remoção.
          </li>
          <li>
            <strong>Registros de consentimento:</strong> pelo tempo necessário para comprovar
            a autorização ou a recusa.
          </li>
          <li>
            <strong>Registros de acesso:</strong> 6 meses, conforme o Marco Civil da
            Internet.
          </li>
          <li>
            <strong>Dados fiscais e de cobrança:</strong> pelo prazo exigido pela legislação
            tributária, de até 5 anos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="direitos" title="7. Seus direitos como titular">
        <p>Nos termos do art. 18 da LGPD, você pode solicitar a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados;</li>
          <li>acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>portabilidade dos dados a outro fornecedor;</li>
          <li>eliminação dos dados tratados com base no consentimento;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>informação sobre a possibilidade de não consentir e suas consequências;</li>
          <li>revogação do consentimento;</li>
          <li>revisão de decisões tomadas unicamente com base em tratamento automatizado.</li>
        </ul>
        <p>
          Para exercer esses direitos, escreva para <MailLink email={dpoEmail} /> com o
          assunto &quot;Direitos LGPD&quot;. Responderemos em até {dataRequestResponseDays}{" "}
          dias. Para confirmar a sua identidade, poderemos pedir informações adicionais.
          Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados
          (ANPD) em{" "}
          <a
            className="font-medium text-primary hover:underline"
            href="https://www.gov.br/anpd"
            rel="noopener noreferrer"
            target="_blank"
          >
            gov.br/anpd
          </a>
          .
        </p>
        <p>
          Instruções específicas para excluir dados estão na página de{" "}
          <Link className="font-medium text-primary hover:underline" href="/exclusao-de-dados">
            exclusão de dados
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="8. Segurança">
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados, como conexão
          criptografada (HTTPS), senhas armazenadas com criptografia, cookies de sessão
          protegidos, controle de acesso por conta e isolamento entre os dados de cada
          Cliente. Em caso de incidente de segurança que possa causar risco ou dano relevante
          aos titulares, comunicaremos a ANPD e os titulares afetados, conforme o art. 48 da
          LGPD.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="9. Cookies e armazenamento local">
        <ul>
          <li>
            <strong>Cookie de sessão (essencial):</strong> mantém você conectado ao painel.
            Sem ele, a Plataforma não funciona.
          </li>
          <li>
            <strong>Armazenamento local do navegador:</strong> guarda preferências de
            interface, como o tema claro ou escuro e o estado do menu lateral.
          </li>
        </ul>
        <p>
          Não usamos cookies de publicidade nem de rastreamento. Se isso mudar, pediremos o
          seu consentimento antes de ativá-los.
        </p>
      </LegalSection>

      <LegalSection id="encarregado" title="10. Encarregado pelo tratamento de dados (DPO)">
        <p>
          Nosso Encarregado, nos termos do art. 41 da LGPD, é {dpoName}, que pode ser
          contatado pelo e-mail <MailLink email={dpoEmail} /> ou pelo endereço {address}.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="11. Alterações desta Política">
        <p>
          Esta Política pode ser atualizada para refletir mudanças na Plataforma ou na
          legislação. A data da última atualização aparece no topo da página, e alterações
          relevantes serão comunicadas aos Clientes por e-mail ou na Plataforma.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
