import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade e LGPD — App Pedidos",
};

// NOTA: dados do responsável preenchidos. Documento-modelo (Brasil/LGPD) —
// recomenda-se revisão jurídica (papel controlador/operador e transferências).
export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade e Proteção de Dados (LGPD)"
      updated="25 de julho de 2026"
    >
      <P>
        A presente Política explica como a plataforma App Pedidos trata dados
        pessoais, em conformidade com a Lei n.º 13.709/2018 (Lei Geral de Proteção
        de Dados — LGPD) e demais legislação aplicável no Brasil.
      </P>

      <H2>1. Controlador dos dados</H2>
      <P>
        O controlador dos dados relativos às contas e ao funcionamento da
        Plataforma é Gabriel Marques Trzaskos (Otium), CNPJ/CPF conforme cadastro,
        com endereço em Rua Nogueira 409, Vila Nova, 93520-320 — Novo Hamburgo/RS,
        contato em otium.sap@gmail.com.
      </P>
      <P>
        Em relação aos dados operacionais de cada Restaurante e de seus Clientes, o
        Restaurante é o controlador e a Plataforma atua como{" "}
        <strong>operador</strong>, tratando esses dados apenas conforme as
        instruções do Restaurante e para prestar o Serviço.
      </P>

      <H2>2. Quais dados tratamos</H2>
      <UL>
        <li>
          <strong>Contas de dono e equipe:</strong> nome, e-mail, função
          (dono/gestão/cozinha/garçom) e dados de autenticação.
        </li>
        <li>
          <strong>Dados do Restaurante:</strong> nome do estabelecimento,
          configuração de cardápio, mesas, plano contratado e identificadores de
          integração (por exemplo, o identificador de recebedor no meio de
          pagamento).
        </li>
        <li>
          <strong>Pedidos dos Clientes:</strong> os pedidos são{" "}
          <strong>anônimos</strong> — não pedimos nome, contato nem cadastro do
          Cliente. Guardamos os itens pedidos, a mesa e o horário, para preparo e
          faturamento.
        </li>
        <li>
          <strong>Dados de pagamento:</strong> processados diretamente pelo meio de
          pagamento (Pix/cartão). A Plataforma{" "}
          <strong>não coleta nem acessa dados de cartão</strong>; apenas recebe a
          confirmação do status do pagamento.
        </li>
        <li>
          <strong>Dados técnicos:</strong> registros de uso e de segurança (por
          exemplo, endereços IP e eventos de erro) gerados pela infraestrutura,
          para garantir o funcionamento e a segurança do Serviço.
        </li>
      </UL>

      <H2>3. Finalidades e bases legais</H2>
      <UL>
        <li>
          <strong>Prestação do Serviço</strong> (gestão de contas, cardápios,
          pedidos e pagamentos) — execução de contrato [art. 7.º, V, da LGPD].
        </li>
        <li>
          <strong>Cumprimento de obrigações legais</strong> (inclusive fiscais e
          contábeis) — obrigação legal [art. 7.º, II].
        </li>
        <li>
          <strong>Segurança, prevenção à fraude e melhoria do Serviço</strong> —
          legítimo interesse [art. 7.º, IX].
        </li>
        <li>
          <strong>Comunicações e funcionalidades opcionais</strong> — consentimento
          [art. 7.º, I], quando aplicável, podendo ser revogado a qualquer momento.
        </li>
      </UL>

      <H2>4. Operadores e terceiros que acessam os dados</H2>
      <P>
        Para prestar o Serviço, contamos com fornecedores que tratam dados por nossa
        conta, sujeitos a acordos de proteção de dados:
      </P>
      <UL>
        <li>
          <strong>Supabase</strong> — banco de dados e autenticação.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem e execução do aplicativo.
        </li>
        <li>
          <strong>Pagar.me</strong> — processamento de pagamentos (Pix e cartão).
        </li>
        <li>
          <strong>Resend</strong> — envio de e-mails transacionais (por exemplo,
          confirmação de conta e recuperação de senha).
        </li>
        <li>
          <strong>Anthropic</strong> — geração de resumos por inteligência
          artificial, exclusivamente sobre <strong>dados agregados e sem dados
          pessoais</strong> dos Clientes.
        </li>
      </UL>
      <P>
        Quando houver transferência internacional de dados, ela é feita com as
        garantias exigidas pela LGPD (art. 33).
      </P>

      <H2>5. Prazos de conservação</H2>
      <P>
        Conservamos os dados apenas pelo tempo necessário às finalidades para as
        quais foram coletados e ao cumprimento de obrigações legais (inclusive
        prazos fiscais e contábeis). Encerrada a relação, os dados são eliminados ou
        anonimizados, salvo obrigação legal de guarda.
      </P>

      <H2>6. Seus direitos (LGPD)</H2>
      <P>
        Como titular dos dados, você tem direito, nos termos da lei, a:
      </P>
      <UL>
        <li>Confirmar a existência de tratamento e acessar seus dados;</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>
          Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou
          tratados em desconformidade com a lei;
        </li>
        <li>Solicitar a portabilidade dos dados;</li>
        <li>
          Ser informado sobre com quem compartilhamos os dados e sobre a
          possibilidade de não fornecer consentimento;
        </li>
        <li>Revogar o consentimento, quando esta for a base do tratamento.</li>
      </UL>
      <P>
        Para exercer esses direitos, contate otium.sap@gmail.com. Você também pode
        apresentar reclamação à autoridade de controle — no Brasil, a Autoridade
        Nacional de Proteção de Dados (ANPD, gov.br/anpd).
      </P>

      <H2>7. Segurança</H2>
      <P>
        Adotamos medidas técnicas e organizacionais adequadas para proteger os
        dados, incluindo o isolamento de dados entre Restaurantes (cada Restaurante
        só acessa os próprios dados), controle de acesso e comunicação criptografada.
        Nenhum sistema é totalmente imune a riscos; em caso de incidente de segurança
        que possa acarretar risco relevante aos titulares, cumpriremos os deveres de
        comunicação previstos na LGPD.
      </P>

      <H2>8. Cookies</H2>
      <P>
        A Plataforma utiliza apenas cookies estritamente necessários ao
        funcionamento (por exemplo, para manter a sessão de usuários autenticados).
        Não utilizamos cookies de publicidade nem de rastreamento para marketing.
      </P>

      <H2>9. Menores</H2>
      <P>
        O Serviço destina-se a profissionais de restaurante e não é dirigido a
        menores. Os pedidos dos Clientes são anônimos e não implicam coleta de dados
        de identificação.
      </P>

      <H2>10. Alterações a esta Política</H2>
      <P>
        Esta Política pode ser atualizada. A versão em vigor é a publicada nesta
        página, com indicação da data da última atualização.
      </P>

      <H2>11. Contato</H2>
      <P>
        Para questões sobre proteção de dados, contate otium.sap@gmail.com.
      </P>
    </LegalLayout>
  );
}
