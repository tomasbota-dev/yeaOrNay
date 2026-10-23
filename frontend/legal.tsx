import type { Translate } from "./i18n";

// Full supplied policy text. Missing operator details remain explicit placeholders.
const privacy = [
  [
    "Who is responsible for your data?",
    "Quem é responsável pelos teus dados?",
    "YoungAndCapable LLC, of [VALID BUSINESS OR REGISTERED-AGENT ADDRESS REQUIRED], is the controller responsible for personal data processed through Yea or Nay. Contact: [PRIVACY CONTACT EMAIL REQUIRED]. LLC jurisdiction: [STATE / COUNTRY OF FORMATION REQUIRED].",
    "A YoungAndCapable LLC, com sede em [É NECESSÁRIO UM ENDEREÇO COMERCIAL OU DE AGENTE REGISTADO VÁLIDO], é a responsável pelo tratamento dos dados pessoais através do Yea or Nay. Contacto: [É NECESSÁRIO UM E-MAIL DE CONTACTO PARA PRIVACIDADE]. Jurisdição da LLC: [É NECESSÁRIO INDICAR O ESTADO / PAÍS DE CONSTITUIÇÃO].",
  ],
  [
    "What we process and why",
    "Que dados tratamos e porquê",
    "Core account and room processing is needed to provide the service you request. Security processing and optional feedback rely on the publisher’s legitimate interests, subject to applicable law. We do not currently send email, offer password reset, run advertising or use analytics.",
    "O tratamento dos dados essenciais das contas e salas é necessário para prestar o serviço que solicitas. O tratamento para segurança e a opinião facultativa baseiam-se nos interesses legítimos do prestador, nos termos da legislação aplicável. Atualmente, não enviamos e-mails, não disponibilizamos recuperação de palavra-passe, não apresentamos publicidade nem utilizamos ferramentas de análise.",
  ],
  [
    "Cookies and local storage",
    "Cookies e armazenamento local",
    "The service uses an essential, secure, HTTP-only session cookie to keep you signed in. Theme and language choices are stored in your browser’s local storage. They are not used for advertising or cross-site tracking.",
    "O serviço utiliza um cookie de sessão essencial, seguro e apenas acessível por HTTP para manter a sessão iniciada. As preferências de tema e idioma são guardadas no armazenamento local do teu navegador. Não são utilizadas para publicidade nem para acompanhamento entre sites.",
  ],
  [
    "Service providers and international processing",
    "Prestadores de serviços e tratamento internacional",
    "Cloudflare provides the Worker application hosting, database and object storage used by the service. Provider infrastructure may process information in multiple locations. [CONFIRM THE APPLICABLE CLOUDFLARE TERMS, PROCESSING LOCATIONS, AND TRANSFER SAFEGUARDS BEFORE LAUNCH.] We do not sell personal data.",
    "A Cloudflare fornece o alojamento da aplicação Worker, a base de dados e o armazenamento de objetos utilizados pelo serviço. A infraestrutura do prestador pode tratar informações em vários locais. [CONFIRMAR OS TERMOS APLICÁVEIS DA CLOUDFLARE, OS LOCAIS DE TRATAMENTO E AS GARANTIAS DE TRANSFERÊNCIA ANTES DO LANÇAMENTO.] Não vendemos dados pessoais.",
  ],
  [
    "How long we keep data",
    "Durante quanto tempo conservamos os dados",
    "Sessions expire after 30 days and stale login rate-limit records are deleted within 24 hours. Account data is removed after one year without account activity or when you request account deletion. If other people remain in a room you hosted, the host role is transferred to the earliest remaining member; otherwise the room is deleted. Room content (including ideas, votes, comments, membership and uploaded image) is deleted one year after its voting deadline. Feedback is deleted one year after submission. These schedules are enforced by a daily cleanup job. Some operational logs held by Cloudflare may have separate retention periods; confirm the applicable provider settings before launch.",
    "As sessões expiram após 30 dias e os registos desatualizados de limitação de tentativas de início de sessão são eliminados no prazo de 24 horas. Os dados da conta são eliminados após um ano sem atividade na conta ou quando solicitas a eliminação da conta. Se houver outras pessoas numa sala de que eras anfitrião, essa função é transferida para o membro que entrou há mais tempo e ainda permanece na sala; caso contrário, a sala é eliminada. O conteúdo das salas (incluindo ideias, votos, comentários, participação e imagem carregada) é eliminado um ano após o prazo da votação. As opiniões são eliminadas um ano após o envio. Estes prazos são aplicados por uma tarefa diária de limpeza. Alguns registos operacionais conservados pela Cloudflare podem ter prazos de conservação diferentes; confirmar as definições aplicáveis do prestador antes do lançamento.",
  ],
  [
    "Your rights",
    "Os teus direitos",
    "Depending on where you live, you may have rights to access, correct, delete, restrict or receive a copy of personal data, object to some processing, and complain to your data protection authority. Contact [PRIVACY CONTACT EMAIL REQUIRED] to make a request. We will verify the request and respond within the period required by applicable law. EU users may contact their supervisory authority.",
    "Consoante o local onde resides, podes ter o direito de aceder, retificar, eliminar, limitar o tratamento ou receber uma cópia dos dados pessoais, opor-te a determinados tratamentos e apresentar uma reclamação à autoridade de proteção de dados. Para fazer um pedido, contacta [É NECESSÁRIO UM E-MAIL DE CONTACTO PARA PRIVACIDADE]. Verificaremos o pedido e responderemos no prazo exigido pela legislação aplicável. Os utilizadores da UE podem contactar a respetiva autoridade de controlo.",
  ],
  [
    "Age requirement",
    "Idade mínima",
    "Yea or Nay is intended for adults aged 18 or older. Do not create an account if you are under 18. The operator must still assess how the service is presented and used, and comply with applicable child privacy rules.",
    "O Yea or Nay destina-se a adultos com 18 ou mais anos. Não cries uma conta se tiveres menos de 18 anos. O operador tem ainda de avaliar a forma como o serviço é apresentado e utilizado e cumprir as regras aplicáveis à privacidade de menores.",
  ],
  [
    "Changes and contact",
    "Alterações e contacto",
    "We will update this notice when our practices change and show the current date above. Privacy questions: [PRIVACY CONTACT EMAIL REQUIRED].",
    "Atualizaremos este aviso quando as nossas práticas mudarem e indicaremos a data atual acima. Questões de privacidade: [É NECESSÁRIO UM E-MAIL DE CONTACTO PARA PRIVACIDADE].",
  ],
];
const processed = [
  [
    "Account name, email address, password hash and salt, and session records, to create accounts, authenticate users and protect accounts.",
    "Nome da conta, endereço de e-mail, hash e salt da palavra-passe e registos de sessão, para criar contas, autenticar utilizadores e proteger contas.",
  ],
  [
    "Room titles, deadlines, membership, ideas, votes and comments, to operate group decisions.",
    "Títulos e prazos das salas, participação, ideias, votos e comentários, para permitir decisões em grupo.",
  ],
  [
    "Room images selected or uploaded by the room host, to display the room.",
    "Imagens das salas selecionadas ou carregadas pelo anfitrião, para apresentar a sala.",
  ],
  [
    "Profile photos uploaded by account holders, to display their profile and identify them in rooms. Room images and profile photos are publicly accessible to anyone who has their image URL.",
    "Fotografias de perfil carregadas pelos titulares das contas, para apresentar o perfil e identificá-los nas salas. As imagens das salas e as fotografias de perfil são acessíveis publicamente a qualquer pessoa que tenha o respetivo URL.",
  ],
  [
    "Feedback text and rating, when you choose to send feedback, to understand and improve the service.",
    "Texto e classificação da opinião, quando optas por enviar uma opinião, para compreender e melhorar o serviço.",
  ],
  [
    "A one-way hash derived from request IP address and email for login rate limiting, to detect repeated failed login attempts.",
    "Um hash irreversível derivado do endereço IP do pedido e do e-mail, para limitar tentativas de início de sessão e detetar tentativas falhadas repetidas.",
  ],
];
const terms = [
  [
    "Who provides the service?",
    "Quem presta o serviço?",
    "Yea or Nay is provided by YoungAndCapable LLC, at [VALID BUSINESS OR REGISTERED-AGENT ADDRESS REQUIRED]. Contact: [SERVICE CONTACT EMAIL REQUIRED]. Formed in [STATE / COUNTRY REQUIRED].",
    "O Yea or Nay é disponibilizado pela YoungAndCapable LLC, em [É NECESSÁRIO UM ENDEREÇO COMERCIAL OU DE AGENTE REGISTADO VÁLIDO]. Contacto: [É NECESSÁRIO UM E-MAIL DE CONTACTO DO SERVIÇO]. Constituída em [É NECESSÁRIO INDICAR O ESTADO / PAÍS].",
  ],
  [
    "Using Yea or Nay",
    "Utilizar o Yea or Nay",
    "You must provide accurate account details, keep your password private and use the service lawfully. You must be at least 18 years old to use the service.",
    "Deves fornecer dados corretos para a conta, manter a palavra-passe confidencial e utilizar o serviço de forma legal. Tens de ter pelo menos 18 anos para utilizar o serviço.",
  ],
  [
    "Retention and account deletion",
    "Conservação e eliminação da conta",
    "Accounts are removed after one year without account activity or on request. Room content is removed one year after its voting deadline. Feedback is removed one year after it is submitted. See the Privacy notice for details.",
    "As contas são eliminadas após um ano sem atividade na conta ou mediante pedido. O conteúdo das salas é eliminado um ano após o prazo da votação. As opiniões são eliminadas um ano após o envio. Consulta o Aviso de privacidade para mais informações.",
  ],
  [
    "Rooms and user content",
    "Salas e conteúdos dos utilizadores",
    "You keep your rights in ideas, comments and images you submit. You give the service a limited permission to store, display and transmit that content as needed to run the rooms you create or join. Room links and codes let others request to join; only share them with people you intend to invite. Do not upload unlawful, infringing, abusive or harmful content, or content you lack permission to share.",
    "Manténs os teus direitos sobre as ideias, comentários e imagens que envias. Concedes ao serviço uma autorização limitada para armazenar, apresentar e transmitir esses conteúdos na medida necessária ao funcionamento das salas que crias ou em que participas. As ligações e os códigos das salas permitem que outras pessoas peçam para entrar; partilha-os apenas com as pessoas que pretendes convidar. Não carregues conteúdos ilegais, que violem direitos, abusivos ou prejudiciais, nem conteúdos que não tenhas autorização para partilhar.",
  ],
  [
    "Room hosts and reports",
    "Anfitriões e denúncias",
    "The host can end voting and remove members from their room. Hosts and users must not use those controls unlawfully or abusively. To report illegal content, abuse or an account concern, contact [REPORT / SUPPORT EMAIL REQUIRED] and include the room link and relevant content. [DEFINE A REVIEW, RESPONSE, RESTRICTION AND APPEAL PROCESS BEFORE PUBLIC LAUNCH.]",
    "O anfitrião pode terminar a votação e remover membros da sua sala. Os anfitriões e utilizadores não podem usar estes controlos de forma ilegal ou abusiva. Para denunciar conteúdos ilegais, abusos ou problemas com uma conta, contacta [É NECESSÁRIO UM E-MAIL PARA DENÚNCIAS / SUPORTE] e inclui a ligação da sala e os conteúdos relevantes. [DEFINIR UM PROCESSO DE ANÁLISE, RESPOSTA, RESTRIÇÃO E RECURSO ANTES DO LANÇAMENTO PÚBLICO.]",
  ],
  [
    "Service changes and availability",
    "Alterações e disponibilidade do serviço",
    "The service is provided without a promise of uninterrupted availability. We may change or discontinue features and will give notice where required by law. We may restrict access where reasonably needed to protect users, the service or others, and will follow applicable notice and appeal requirements.",
    "O serviço é prestado sem garantia de disponibilidade ininterrupta. Podemos alterar ou descontinuar funcionalidades e comunicaremos essas alterações quando exigido por lei. Podemos restringir o acesso quando tal seja razoavelmente necessário para proteger os utilizadores, o serviço ou terceiros, cumprindo os requisitos aplicáveis de notificação e recurso.",
  ],
  [
    "Liability and governing law",
    "Responsabilidade e lei aplicável",
    "Nothing in these terms limits rights or remedies that cannot legally be limited. Any permitted limits on liability, governing law and dispute venue must be set by the publisher with legal advice: [CHOOSE APPLICABLE TERMS WITHOUT OVERRIDING MANDATORY CONSUMER RIGHTS.]",
    "Nada nestes termos limita direitos ou meios de defesa que não possam ser legalmente limitados. Quaisquer limites de responsabilidade permitidos, a lei aplicável e o foro para litígios devem ser definidos pelo prestador com aconselhamento jurídico: [ESCOLHER TERMOS APLICÁVEIS SEM AFASTAR DIREITOS IMPERATIVOS DOS CONSUMIDORES.]",
  ],
  [
    "Contact and updates",
    "Contacto e atualizações",
    "Questions or reports: [SERVICE CONTACT EMAIL]. We will publish changes to these terms here with an updated date.",
    "Questões ou denúncias: [E-MAIL DE CONTACTO DO SERVIÇO]. Publicaremos aqui as alterações a estes termos com uma data atualizada.",
  ],
];
const privacyDraft = [
  "The publisher name, age policy and retention schedule below reflect the operator’s current choices. This notice is still incomplete: a real service/privacy contact, valid business or registered-agent address, LLC jurisdiction, and verified Cloudflare transfer details are required. Obtain legal review before public launch.",
  "O nome do prestador, a política de idade e os prazos de conservação abaixo refletem as escolhas atuais do operador. Este aviso continua incompleto: são necessários um contacto real do serviço/privacidade, um endereço comercial ou de agente registado válido, a jurisdição da LLC e informações verificadas sobre as transferências da Cloudflare. Obtém uma revisão jurídica antes do lançamento público.",
];
const termsDraft = [
  "Publisher name, age policy and retention schedule below reflect current choices. The business address, formation jurisdiction, service contact, complaint process and governing-law choices still need completion and legal review before public launch.",
  "O nome do prestador, a política de idade e os prazos de conservação abaixo refletem as escolhas atuais. O endereço comercial, a jurisdição de constituição, o contacto do serviço, o processo de reclamação e as opções de lei aplicável ainda precisam de ser preenchidos e revistos juridicamente antes do lançamento público.",
];
const summaries = {
  privacy:
    "Este aviso explica que dados são usados para criar contas e salas, permitir sugestões, votos e comentários e proteger inícios de sessão. A Cloudflare aloja a aplicação, a base de dados e as imagens das salas. As contas sem atividade de início de sessão durante um ano e o conteúdo das salas um ano após o prazo da votação são eliminados por uma tarefa diária. A aplicação destina-se a pessoas com 18 ou mais anos. O endereço, o contacto e a jurisdição da empresa ainda têm de ser preenchidos. Para exercer direitos, contacta [E-MAIL DE PRIVACIDADE].",
  terms:
    "Usa a aplicação de forma legal, mantém os dados da conta seguros e só partilha conteúdos que tens autorização para partilhar. O anfitrião pode terminar a votação e remover membros da sala. Para denunciar conteúdos ou problemas, contacta [E-MAIL DE SUPORTE]. A utilização está limitada a maiores de 18 anos; o conteúdo das salas é eliminado um ano após o prazo de votação. O endereço, a jurisdição e o contacto da empresa ainda têm de ser indicados.",
};

export function LegalPage({
  kind,
  t,
  locale,
}: {
  kind: "privacy" | "terms";
  t: Translate;
  locale: string;
}) {
  const pt = locale === "pt-PT",
    rows = kind === "privacy" ? privacy : terms;
  return (
    <main className="page legal legal-page">
      <header className="legal-heading">
        <p className="eyebrow">
          {pt ? "Informações do serviço" : "Service information"}
        </p>
        <h1>{t(kind === "privacy" ? "Privacy notice" : "Terms of service")}</h1>
      </header>
      <aside className="legal-draft" role="note">
        <strong>
          {pt
            ? "Versão preliminar — não está pronta para utilização pública."
            : "Launch draft — not ready for public use."}
        </strong>
        <p>{(kind === "privacy" ? privacyDraft : termsDraft)[pt ? 1 : 0]}</p>
      </aside>
      <p>
        <strong>
          {pt
            ? "Última atualização: 21 de outubro de 2026"
            : "Last updated: 21 October 2026"}
        </strong>
      </p>
      <div className="legal-content">
        {rows.map((row, index) => (
          <section key={row[0]}>
            <h2>{row[pt ? 1 : 0]}</h2>
            {kind === "privacy" && index === 1 && (
              <ul>
                {processed.map((item) => (
                  <li key={item[0]}>{item[pt ? 1 : 0]}</li>
                ))}
              </ul>
            )}
            <p>{row[pt ? 3 : 2]}</p>
            {kind === "terms" && index === 2 && (
              <a href="/privacy">{t("Privacy notice")} →</a>
            )}
          </section>
        ))}
      </div>
      <hr />
      <p lang="pt-PT">
        <strong>Resumo em português: </strong>
        {summaries[kind]}
      </p>
    </main>
  );
}
