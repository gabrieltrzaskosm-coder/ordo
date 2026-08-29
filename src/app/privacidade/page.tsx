import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade e LGPD — Ordo",
};

// NOTA: dados do responsável preenchidos. Documento-modelo (Brasil/LGPD) —
// recomenda-se revisão jurídica (papel controlador/operador e transferências).
export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade e Proteção de Dados (LGPD)"
      updated="29 de agosto de 2026"
    >
      <P>
        A presente Política explica como a plataforma Ordo trata dados
        pessoais, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção
        de Dados Pessoais — LGPD), as normas da Autoridade Nacional de Proteção de
        Dados (ANPD) e demais legislação aplicável no Brasil.
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
        <strong>operadora</strong>, tratando esses dados apenas conforme as
        instruções do Restaurante e para prestar o Serviço. O Restaurante deve
        disponibilizar informações próprias aos seus clientes quando atuar como
        controlador desses dados.
      </P>

      <H2>2. Quais dados tratamos</H2>
      <UL>
        <li>
          <strong>Contas de dono e equipe:</strong> nome, e-mail, função
          (dono/gestão/cozinha/atendente) e dados de autenticação.
        </li>
        <li>
          <strong>Dados do Restaurante:</strong> nome do estabelecimento,
          configuração de cardápio, mesas, plano contratado e identificadores de
          integração (por exemplo, o identificador de recebedor no meio de
          pagamento).
        </li>
        <li>
          <strong>Pedidos dos Clientes:</strong> o cliente pode informar um nome para
          identificação operacional. Guardamos esse nome, os itens pedidos, a mesa,
          observações e o horário para preparo, atendimento, cobrança manual e
          histórico do Restaurante.
        </li>
        <li>
          <strong>Dados de pagamento:</strong> no fluxo atual, o pagamento é manual
          na mesa. A Plataforma registra apenas valor, método informado, status e
          horário; não coleta dados completos de cartão.
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
          pedidos e pagamentos) — execução de contrato ou de procedimentos
          preliminares [art. 7º, V, da LGPD].
        </li>
        <li>
          <strong>Cumprimento de obrigações legais</strong> (inclusive fiscais e
          contábeis) — obrigação legal [art. 7.º, II].
        </li>
        <li>
          <strong>Segurança, prevenção à fraude e melhoria do Serviço</strong> —
          legítimo interesse, observados os direitos e as legítimas expectativas
          dos titulares [art. 7º, IX, da LGPD].
        </li>
        <li>
          <strong>Comunicações e funcionalidades opcionais</strong> — consentimento
          [art. 7º, I, da LGPD], quando aplicável, podendo ser revogado a qualquer
          momento.
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
          <strong>Anthropic</strong> — geração de resumos por inteligência
          artificial, exclusivamente sobre <strong>dados agregados</strong>, sem
          envio do nome ou de outras informações identificáveis dos Clientes.
        </li>
      </UL>
      <P>
        Alguns fornecedores podem tratar dados fora do Brasil. Quando houver
        transferência internacional, ela será realizada somente nas hipóteses e
        com as garantias previstas no art. 33 da LGPD e na regulamentação da ANPD.
      </P>

      <H2>5. Prazos de conservação</H2>
      <P>
        Conservamos os dados pelo tempo necessário às finalidades informadas, à
        prestação de contas e ao cumprimento de obrigações legais. Ao terminar a
        relação, eliminamos ou anonimizamos os dados quando não houver base legal
        para mantê-los, sem prejuízo de guarda necessária para exercício regular de
        direitos, prevenção a fraudes ou obrigações legais.
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
        <li>Solicitar a portabilidade dos dados, observada a regulamentação da ANPD;</li>
        <li>
          Ser informado sobre com quem compartilhamos os dados e sobre a
          possibilidade de não fornecer consentimento;
        </li>
        <li>Revogar o consentimento, quando esta for a base do tratamento;</li>
        <li>Opor-se ao tratamento realizado em determinadas hipóteses legais;</li>
        <li>Solicitar revisão de decisões tomadas unicamente com base em tratamento
          automatizado que afetem seus interesses, quando aplicável;</li>
        <li>Peticionar perante a ANPD e os órgãos de defesa do consumidor.</li>
      </UL>
      <P>
        Para exercer esses direitos, contate otium.sap@gmail.com. O pedido poderá
        exigir confirmação de identidade para evitar acesso indevido. Responderemos
        nos prazos previstos na LGPD e nas normas da ANPD. Você também pode
        apresentar petição à Autoridade Nacional de Proteção de Dados (ANPD).
      </P>

      <H2>7. Segurança</H2>
      <P>
        Adotamos medidas técnicas e administrativas compatíveis com os riscos do
        tratamento, incluindo controle de acesso, isolamento entre Restaurantes,
        validação de entradas, limitação de abuso e comunicação criptografada.
        Nenhum sistema é totalmente imune a riscos. Incidentes confirmados que
        possam acarretar risco ou dano relevante serão avaliados e, quando exigido,
        comunicados à ANPD e aos titulares conforme a LGPD e o Regulamento de
        Comunicação de Incidente de Segurança da ANPD, inclusive no prazo
        regulamentar aplicável.
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
        menores. Não solicitamos intencionalmente dados de crianças ou adolescentes;
        caso o Restaurante trate esses dados no contexto de um pedido, deverá
        observar as regras específicas da LGPD.
      </P>

      <H2>10. Alterações a esta Política</H2>
      <P>
        Esta Política pode ser atualizada. A versão em vigor é a publicada nesta
        página, com indicação da data da última atualização.
      </P>

      <H2>11. Contato</H2>
      <P>
        Para questões sobre proteção de dados e exercício de direitos, contate
        otium.sap@gmail.com. Esse endereço é também o canal de contato do
        encarregado pelo tratamento de dados, quando aplicável.
      </P>
    </LegalLayout>
  );
}
