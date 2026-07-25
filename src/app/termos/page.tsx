import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Termos de Utilização — App Pedidos",
};

// NOTA: dados do prestador preenchidos. Documento-modelo — recomenda-se revisão
// jurídica, sobretudo a lei/foro aplicável (prestador no Brasil, serviço em PT).
export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Utilização" updated="25 de julho de 2026">
      <P>
        Os presentes Termos de Utilização (&quot;Termos&quot;) regulam o acesso e
        a utilização da plataforma App Pedidos (&quot;Plataforma&quot; ou
        &quot;Serviço&quot;), disponibilizada por Gabriel Marques Trzaskos
        (Otium), contribuinte n.º 336349106, com domicílio em Rua Nogueira 409,
        Vila Nova, 93520-320 — Novo Hamburgo, Brasil (&quot;nós&quot;,
        &quot;Prestador&quot;). Ao criar uma conta ou utilizar o Serviço, o
        utilizador declara ter lido, compreendido e aceite estes Termos.
      </P>

      <H2>1. Definições</H2>
      <UL>
        <li>
          <strong>Plataforma:</strong> a aplicação web de pedidos e pagamento por
          código QR para restauração.
        </li>
        <li>
          <strong>Restaurante:</strong> o estabelecimento que subscreve o Serviço
          e o utiliza para receber pedidos e pagamentos.
        </li>
        <li>
          <strong>Comensal:</strong> o cliente final do Restaurante que consulta
          o menu, faz pedidos e paga através da Plataforma.
        </li>
        <li>
          <strong>Conta:</strong> o registo de acesso do Restaurante e da sua
          equipa (dono, gestão, cozinha, atendimento).
        </li>
      </UL>

      <H2>2. Objeto e âmbito</H2>
      <P>
        A Plataforma é uma ferramenta de software que permite ao Restaurante
        publicar um menu, receber pedidos das mesas por código QR e disponibilizar
        pagamento eletrónico aos Comensais. O Prestador fornece o software; não é
        parte na relação de compra e venda entre o Restaurante e o Comensal, nem
        vendedor dos bens alimentares.
      </P>

      <H2>3. Registo e conta</H2>
      <UL>
        <li>
          O utilizador que cria a conta declara ter capacidade legal e poderes
          para vincular o Restaurante.
        </li>
        <li>
          As credenciais de acesso são pessoais e confidenciais. O Restaurante é
          responsável por toda a atividade realizada na sua Conta e pela gestão
          dos acessos da sua equipa.
        </li>
        <li>
          O utilizador compromete-se a fornecer informação verdadeira, atual e
          completa, e a mantê-la atualizada.
        </li>
      </UL>

      <H2>4. Planos e mensalidade</H2>
      <P>
        O Serviço é disponibilizado em planos (Basic, Pro e Max) com
        funcionalidades distintas. Os preços, condições e método de cobrança da
        mensalidade são os comunicados ao Restaurante no momento da adesão. O
        Prestador pode atribuir, alterar ou suspender o plano de um Restaurante nos
        termos acordados. A cobrança da mensalidade é independente dos pagamentos
        efetuados pelos Comensais.
      </P>

      <H2>5. Pagamentos dos comensais</H2>
      <UL>
        <li>
          Os pagamentos dos Comensais são processados através da Stripe, ao abrigo
          do modelo Stripe Connect. O valor é transferido{" "}
          <strong>diretamente para a conta do Restaurante</strong>; o Prestador
          não retém nem detém os fundos dos Comensais.
        </li>
        <li>
          O Restaurante é o vendedor e o responsável fiscal pela transação,
          incluindo a emissão de fatura/documento fiscal exigível e a aplicação
          correta do IVA.
        </li>
        <li>
          A disponibilização de pagamentos depende da aceitação, pelo Restaurante,
          dos termos da Stripe e da conclusão da verificação da respetiva conta.
        </li>
      </UL>

      <H2>6. Obrigações do Restaurante</H2>
      <UL>
        <li>
          Cumprir toda a legislação aplicável à sua atividade (fiscal, alimentar,
          defesa do consumidor, rotulagem de alergénios, entre outras).
        </li>
        <li>
          Assegurar a exatidão do menu, preços, impostos e informação apresentada
          aos Comensais.
        </li>
        <li>
          Cumprir as suas obrigações de faturação certificada perante a
          Autoridade Tributária, quando aplicáveis.
        </li>
        <li>
          Tratar os dados dos seus Comensais em conformidade com a lei de proteção
          de dados (ver Política de Privacidade).
        </li>
      </UL>

      <H2>7. Utilização aceitável</H2>
      <P>É proibido utilizar o Serviço para:</P>
      <UL>
        <li>
          Fins ilícitos, fraudulentos ou que violem direitos de terceiros;
        </li>
        <li>
          Tentar aceder indevidamente a contas, dados ou sistemas de outrem;
        </li>
        <li>
          Interferir com o funcionamento, a segurança ou a integridade da
          Plataforma;
        </li>
        <li>
          Introduzir código malicioso ou realizar engenharia inversa não
          autorizada.
        </li>
      </UL>

      <H2>8. Propriedade intelectual</H2>
      <P>
        O software, a marca, o design e demais elementos da Plataforma são
        propriedade do Prestador ou dos seus licenciadores. Estes Termos não
        conferem qualquer direito de propriedade sobre a Plataforma, apenas um
        direito de utilização limitado, não exclusivo e revogável durante a
        vigência da subscrição. O conteúdo carregado pelo Restaurante (menu,
        imagens) permanece propriedade do Restaurante, que concede ao Prestador
        uma licença para o alojar e apresentar no âmbito do Serviço.
      </P>

      <H2>9. Disponibilidade e ausência de garantias</H2>
      <P>
        O Prestador envida esforços razoáveis para manter o Serviço disponível,
        mas não garante funcionamento ininterrupto ou isento de erros. O Serviço é
        fornecido &quot;tal como está&quot;. Poderão ocorrer interrupções para
        manutenção, atualizações ou por causas alheias ao Prestador.
      </P>

      <H2>10. Limitação de responsabilidade</H2>
      <P>
        Na medida máxima permitida por lei, o Prestador não é responsável por
        lucros cessantes, perda de dados, danos indiretos ou consequenciais
        decorrentes da utilização ou impossibilidade de utilização do Serviço. Nada
        nestes Termos exclui responsabilidades que não possam ser legalmente
        excluídas.
      </P>

      <H2>11. Suspensão e cessação</H2>
      <P>
        O Restaurante pode cessar a utilização a qualquer momento. O Prestador pode
        suspender ou cessar o acesso em caso de incumprimento destes Termos, de
        falta de pagamento ou de uso indevido. A cessação não afeta as obrigações
        vencidas até essa data.
      </P>

      <H2>12. Alterações aos Termos</H2>
      <P>
        O Prestador pode alterar estes Termos, informando os utilizadores por meios
        razoáveis. A continuação da utilização após a entrada em vigor das
        alterações implica a sua aceitação.
      </P>

      <H2>13. Lei aplicável e foro</H2>
      <P>
        Estes Termos regem-se pela lei portuguesa, por o Serviço se destinar a
        estabelecimentos em Portugal. Para a resolução de litígios são competentes
        os tribunais portugueses, sem prejuízo dos direitos imperativos do
        consumidor e do recurso a mecanismos de resolução alternativa de litígios.
      </P>

      <H2>14. Contactos</H2>
      <P>
        Para qualquer questão relativa a estes Termos, contacte-nos através de
        otium.sap@gmail.com.
      </P>
    </LegalLayout>
  );
}
