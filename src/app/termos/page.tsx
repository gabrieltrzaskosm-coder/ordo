import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Termos de Uso — Ordo",
};

// NOTA: dados do prestador preenchidos. Documento-modelo (Brasil) — recomenda-se
// revisão jurídica, sobretudo a parte fiscal (NFC-e) e o foro aplicável.
export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Uso" updated="29 de agosto de 2026">
      <P>
        Estes Termos de Uso (&quot;Termos&quot;) regulam o acesso e o uso da
        plataforma Ordo (&quot;Plataforma&quot; ou &quot;Serviço&quot;),
        disponibilizada por Gabriel Marques Trzaskos (Otium), com endereço em Rua
        Nogueira 409, Vila Nova, 93520-320 — Novo Hamburgo/RS (&quot;nós&quot;,
        &quot;Prestador&quot;). Ao criar uma conta ou usar o Serviço, o usuário
        declara ter lido, compreendido e aceitado estes Termos.
      </P>

      <H2>1. Definições</H2>
      <UL>
        <li>
          <strong>Plataforma:</strong> o aplicativo web de pedidos e pagamento por
          QR code para restaurantes.
        </li>
        <li>
          <strong>Restaurante:</strong> o estabelecimento que contrata o Serviço e
          o utiliza para receber pedidos e pagamentos.
        </li>
        <li>
          <strong>Cliente:</strong> o consumidor final do Restaurante que consulta o
          cardápio, faz pedidos e realiza o pagamento diretamente ao Restaurante.
        </li>
        <li>
          <strong>Conta:</strong> o cadastro de acesso do Restaurante e de sua
          equipe (dono, gestão, cozinha, atendente).
        </li>
      </UL>

      <H2>2. Objeto</H2>
      <P>
        A Plataforma é uma ferramenta de software que permite ao Restaurante
        publicar um cardápio, receber pedidos das mesas por QR code e apoiar o
        atendimento e a cobrança manual. O Prestador fornece o software; não é
        parte na relação de compra e venda entre o Restaurante e o Cliente, nem
        vendedor dos alimentos.
      </P>

      <H2>3. Cadastro e conta</H2>
      <UL>
        <li>
          Quem cria a conta declara ter capacidade legal e poderes para representar
          o Restaurante.
        </li>
        <li>
          As credenciais de acesso são pessoais e sigilosas. O Restaurante é
          responsável por toda atividade em sua Conta e pela gestão dos acessos de
          sua equipe.
        </li>
        <li>
          O usuário se compromete a fornecer informações verdadeiras, atuais e
          completas, e a mantê-las atualizadas.
        </li>
      </UL>

      <H2>4. Planos</H2>
      <P>
        O Serviço é oferecido em planos (Basic, Pro e Max) com funcionalidades
        distintas. As condições de contratação de cada plano são as informadas ao
        Restaurante no momento da adesão. O Prestador pode atribuir, alterar ou
        suspender o plano de um Restaurante nos termos acordados. A contratação do
        Serviço é independente dos pagamentos feitos pelos Clientes ao Restaurante.
      </P>

      <H2>5. Pagamentos dos clientes</H2>
      <UL>
        <li>
          No fluxo atual, o pagamento é combinado e recebido diretamente pelo
          Restaurante na mesa. A Plataforma não recebe nem retém os valores da
          venda de alimentos.
        </li>
        <li>
          O Restaurante é o vendedor e o responsável tributário pela operação,
          inclusive pelas obrigações fiscais, emissão de documento fiscal quando
          exigível e recolhimento dos tributos aplicáveis.
        </li>
        <li>
          A disponibilização de pagamentos depende da aceitação, pelo Restaurante,
          dos termos da instituição de pagamento e da conclusão do respectivo
          cadastro.
        </li>
      </UL>

      <H2>6. Obrigações do Restaurante</H2>
      <UL>
        <li>
          Cumprir toda a legislação aplicável à sua atividade (tributária,
          sanitária, defesa do consumidor, informação de alérgenos, entre outras).
        </li>
        <li>
          Garantir a exatidão do cardápio, preços, tributos e informações
          apresentadas aos Clientes.
        </li>
        <li>
          Cumprir suas obrigações fiscais perante os órgãos competentes, quando
          aplicáveis.
        </li>
        <li>
          Tratar os dados de seus Clientes conforme a legislação de proteção de
          dados (ver Política de Privacidade).
        </li>
      </UL>

      <H2>7. Uso aceitável</H2>
      <P>É proibido usar o Serviço para:</P>
      <UL>
        <li>Fins ilícitos, fraudulentos ou que violem direitos de terceiros;</li>
        <li>Tentar acessar indevidamente contas, dados ou sistemas de terceiros;</li>
        <li>
          Interferir no funcionamento, na segurança ou na integridade da Plataforma;
        </li>
        <li>
          Introduzir código malicioso ou fazer engenharia reversa não autorizada.
        </li>
      </UL>

      <H2>8. Propriedade intelectual</H2>
      <P>
        O software, a marca, o design e demais elementos da Plataforma são de
        propriedade do Prestador ou de seus licenciadores. Estes Termos não conferem
        qualquer direito de propriedade sobre a Plataforma, apenas um direito de uso
        limitado, não exclusivo e revogável durante a vigência da contratação. O
        conteúdo enviado pelo Restaurante (cardápio, imagens) permanece de sua
        propriedade, que concede ao Prestador uma licença para hospedá-lo e exibi-lo
        no âmbito do Serviço.
      </P>

      <H2>9. Disponibilidade e ausência de garantias</H2>
      <P>
        O Prestador envida esforços razoáveis para manter o Serviço disponível, mas
        não garante funcionamento ininterrupto ou isento de erros. O Serviço é
        fornecido &quot;no estado em que se encontra&quot;. Poderão ocorrer
        interrupções para manutenção, atualizações ou por causas alheias ao
        Prestador.
      </P>

      <H2>10. Limitação de responsabilidade</H2>
      <P>
        Na máxima extensão permitida em lei, o Prestador não responde por lucros
        cessantes, perda de dados, danos indiretos ou consequenciais decorrentes do
        uso ou da impossibilidade de uso do Serviço. Nada nestes Termos exclui
        responsabilidades que não possam ser legalmente afastadas, inclusive as
        previstas no Código de Defesa do Consumidor.
      </P>

      <H2>11. Suspensão e rescisão</H2>
      <P>
        O Restaurante pode encerrar o uso a qualquer momento. O Prestador pode
        suspender ou encerrar o acesso em caso de descumprimento destes Termos, falta
        de pagamento ou uso indevido. A rescisão não afeta as obrigações vencidas até
        a data.
      </P>

      <H2>12. Alterações dos Termos</H2>
      <P>
        O Prestador pode alterar estes Termos, informando os usuários por meios
        razoáveis. O uso continuado após a entrada em vigor das alterações implica a
        sua aceitação.
      </P>

      <H2>13. Lei aplicável e foro</H2>
      <P>
        Estes Termos são regidos pela lei brasileira. Fica eleito o foro da comarca
        de Novo Hamburgo/RS para dirimir controvérsias, sem prejuízo dos direitos do
        consumidor previstos no Código de Defesa do Consumidor, inclusive quanto ao
        foro de seu domicílio.
      </P>

      <H2>14. Contato</H2>
      <P>
        Para qualquer questão relativa a estes Termos, fale conosco pelo e-mail
        otium.sap@gmail.com.
      </P>
    </LegalLayout>
  );
}
