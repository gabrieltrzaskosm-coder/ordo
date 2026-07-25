import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade e RGPD — App Pedidos",
};

// NOTA: dados do responsável preenchidos. Documento-modelo — recomenda-se
// revisão jurídica (repartição controlador/subcontratante e transferências).
export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade e Proteção de Dados (RGPD)"
      updated="25 de julho de 2026"
    >
      <P>
        A presente Política explica como a plataforma App Pedidos trata dados
        pessoais, em conformidade com o Regulamento (UE) 2016/679 (RGPD) e demais
        legislação de proteção de dados aplicável em Portugal.
      </P>

      <H2>1. Responsável pelo tratamento</H2>
      <P>
        O responsável pelo tratamento dos dados relativos às contas e ao
        funcionamento da Plataforma é Gabriel Marques Trzaskos (Otium),
        contribuinte n.º 336349106, com domicílio em Rua Nogueira 409, Vila Nova,
        93520-320 — Novo Hamburgo, Brasil, contactável em otium.sap@gmail.com.
      </P>
      <P>
        Relativamente aos dados operacionais de cada Restaurante e dos seus
        Comensais, o Restaurante é o responsável pelo tratamento e a Plataforma
        atua como <strong>subcontratante</strong> (processador), tratando esses
        dados apenas segundo as instruções do Restaurante e para prestar o Serviço.
      </P>

      <H2>2. Que dados tratamos</H2>
      <UL>
        <li>
          <strong>Contas de dono e equipa:</strong> nome, endereço de email, função
          (dono/gestão/cozinha/atendimento) e dados de autenticação.
        </li>
        <li>
          <strong>Dados do Restaurante:</strong> nome do estabelecimento,
          configuração de menu, mesas, plano subscrito e identificadores de
          integração (por exemplo, o identificador da conta Stripe).
        </li>
        <li>
          <strong>Pedidos dos Comensais:</strong> os pedidos são{" "}
          <strong>anónimos</strong> — não pedimos nome, contacto nem registo do
          Comensal. Guardamos os itens pedidos, a mesa e a hora, para efeitos de
          preparação e faturação.
        </li>
        <li>
          <strong>Dados de pagamento:</strong> processados diretamente pela Stripe.
          A Plataforma <strong>não recolhe nem acede a dados de cartão</strong>;
          apenas recebe a confirmação do estado do pagamento.
        </li>
        <li>
          <strong>Dados técnicos:</strong> registos de utilização e de segurança
          (por exemplo, endereços IP e eventos de erro) gerados pela infraestrutura,
          para garantir o funcionamento e a segurança do Serviço.
        </li>
      </UL>

      <H2>3. Finalidades e fundamentos de licitude</H2>
      <UL>
        <li>
          <strong>Prestação do Serviço</strong> (gestão de contas, menus, pedidos e
          pagamentos) — execução de contrato [art. 6.º, n.º 1, al. b) do RGPD].
        </li>
        <li>
          <strong>Cumprimento de obrigações legais</strong> (nomeadamente fiscais e
          contabilísticas) — obrigação jurídica [al. c)].
        </li>
        <li>
          <strong>Segurança, prevenção de fraude e melhoria do Serviço</strong> —
          interesse legítimo [al. f)].
        </li>
        <li>
          <strong>Comunicações e funcionalidades opcionais</strong> — consentimento
          [al. a)], quando aplicável, podendo ser retirado a qualquer momento.
        </li>
      </UL>

      <H2>4. Subcontratantes e entidades que acedem aos dados</H2>
      <P>
        Para prestar o Serviço, recorremos a fornecedores que tratam dados por nossa
        conta, sujeitos a acordos de proteção de dados:
      </P>
      <UL>
        <li>
          <strong>Supabase</strong> — base de dados e autenticação (alojamento na
          União Europeia).
        </li>
        <li>
          <strong>Vercel</strong> — alojamento e execução da aplicação.
        </li>
        <li>
          <strong>Stripe</strong> — processamento de pagamentos.
        </li>
        <li>
          <strong>Resend</strong> — envio de emails transacionais (por exemplo,
          confirmação de conta e recuperação de palavra-passe).
        </li>
        <li>
          <strong>Anthropic</strong> — geração de resumos por inteligência
          artificial, exclusivamente sobre <strong>dados agregados e sem dados
          pessoais</strong> dos Comensais.
        </li>
      </UL>
      <P>
        Sempre que ocorram transferências de dados para fora do Espaço Económico
        Europeu, estas são feitas ao abrigo de salvaguardas adequadas nos termos do
        RGPD (por exemplo, cláusulas contratuais-tipo).
      </P>

      <H2>5. Prazos de conservação</H2>
      <P>
        Conservamos os dados apenas pelo tempo necessário às finalidades para que
        foram recolhidos e ao cumprimento de obrigações legais (designadamente
        prazos fiscais e contabilísticos). Terminada a relação, os dados são
        eliminados ou anonimizados, salvo obrigação legal de conservação.
      </P>

      <H2>6. Os seus direitos (RGPD)</H2>
      <P>
        Enquanto titular dos dados, tem direito a, nos termos da lei:
      </P>
      <UL>
        <li>Aceder aos seus dados e obter informação sobre o seu tratamento;</li>
        <li>Solicitar a retificação de dados inexatos ou incompletos;</li>
        <li>
          Solicitar o apagamento (&quot;direito a ser esquecido&quot;), quando
          aplicável;
        </li>
        <li>Solicitar a limitação do tratamento;</li>
        <li>Opor-se ao tratamento fundado em interesse legítimo;</li>
        <li>Solicitar a portabilidade dos dados que forneceu;</li>
        <li>Retirar o consentimento, sem afetar a licitude do tratamento anterior.</li>
      </UL>
      <P>
        Para exercer estes direitos, contacte otium.sap@gmail.com. Tem ainda o direito de
        apresentar reclamação à autoridade de controlo — em Portugal, a Comissão
        Nacional de Proteção de Dados (CNPD, www.cnpd.pt).
      </P>

      <H2>7. Segurança</H2>
      <P>
        Adotamos medidas técnicas e organizativas adequadas para proteger os dados,
        incluindo o isolamento de dados entre Restaurantes (cada Restaurante só
        acede aos seus próprios dados), controlo de acessos e comunicação cifrada.
        Nenhum sistema é totalmente imune a riscos; em caso de violação de dados que
        implique risco para os titulares, cumpriremos os deveres de comunicação
        previstos no RGPD.
      </P>

      <H2>8. Cookies</H2>
      <P>
        A Plataforma utiliza apenas cookies estritamente necessários ao
        funcionamento (por exemplo, para manter a sessão de utilizadores
        autenticados). Não utilizamos cookies de publicidade nem de rastreio para
        fins de marketing.
      </P>

      <H2>9. Menores</H2>
      <P>
        O Serviço destina-se a profissionais da restauração e não se dirige a
        menores. Os pedidos dos Comensais são anónimos e não implicam a recolha de
        dados de identificação.
      </P>

      <H2>10. Alterações a esta Política</H2>
      <P>
        Esta Política pode ser atualizada. A versão em vigor é a publicada nesta
        página, com indicação da data da última atualização.
      </P>

      <H2>11. Contacto</H2>
      <P>
        Para questões sobre proteção de dados, contacte otium.sap@gmail.com.
      </P>
    </LegalLayout>
  );
}
