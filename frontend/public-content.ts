import type { Language, PageId } from "../shared/seo";

type Guide = {
  title: string;
  description: string;
  heading: string;
  intro: string;
  steps: { heading: string; text: string }[];
  example: { heading: string; ideas: string[]; note: string };
};
type Copy = {
  homeTitle: string; homeDescription: string; category: string;
  examples: string; examplesIntro: string; rulesLink: string;
  home: string; signIn: string; start: string; dashboard: string;
  language: string; theme: string; skip: string; privacy: string; terms: string;
  back: string; exampleLabel: string; accountNote: string; ctaHeading: string;
  guides: Record<Exclude<PageId, "home">, Guide>;
};

export const publicCopy: Record<Language, Copy> = {
  en: {
    homeTitle: "Yea or Nay — Group voting for plans with friends",
    homeDescription: "Decide what to do together. Create a room, share ideas, vote Yea or Nay and see the result at your deadline. For dinners, movie nights and weekend plans.",
    category: "Group voting for plans with friends",
    examples: "One question. A plan together.",
    examplesIntro: "Start with a decision your group actually needs to make. These examples show how to turn a shortlist into a vote.",
    rulesLink: "How voting works", home: "Home", signIn: "Sign in", start: "Make a plan", dashboard: "Your rooms",
    language: "Read this page in Portuguese", theme: "Change colour theme", skip: "Skip to content", privacy: "Privacy", terms: "Terms",
    back: "More ways to make a plan", exampleLabel: "Illustrative example · not a live room",
    accountNote: "An account is needed to create a room and participate. Share your invitation with the people you want to join.",
    ctaHeading: "Put your next question to the group.",
    guides: {
      dinner: {
        title: "Decide where to eat with friends | Yea or Nay",
        description: "Choose a dinner plan together: agree on budget and dietary needs, collect restaurant ideas, and vote before a deadline with Yea or Nay.",
        heading: "Where should we eat? Let the group vote.",
        intro: "A dinner chat can collect twenty suggestions without choosing one. Give the group a short list and a deadline, so everyone knows when the decision will be made.",
        steps: [
          { heading: "Agree on the essentials first", text: "Ask about budget, location, dietary needs and accessibility before voting. A popular option is not useful if someone cannot eat there." },
          { heading: "Create a dinner room", text: "Choose a clear name, such as Friday dinner, and set a deadline early enough to check availability. Share the room invitation in your group chat; everyone joins with an account." },
          { heading: "Add a few realistic options", text: "Members can suggest places and add useful details, such as price range or travel time. Vote Yea or Nay on other members’ suggestions and use comments to clarify questions." },
          { heading: "Check the result, then book", text: "When voting closes, review the result. If options tie, discuss the tied winners. Check the restaurant’s opening hours and availability yourself: Yea or Nay does not make reservations." },
        ],
        example: { heading: "Friday dinner · decide by Thursday evening", ideas: ["Dumplings nearby · vegetarian options", "Pizza in the centre · moderate budget", "Cook together · agree on ingredients"], note: "These are fictional suggestions, not restaurant recommendations. Check dietary needs and availability with the group." },
      },
      "movie-night": {
        title: "Choose a movie with friends | Movie night voting | Yea or Nay",
        description: "Make a movie-night shortlist, compare running times and availability, and vote on what to watch together with Yea or Nay.",
        heading: "Pick a film before movie night starts.",
        intro: "Spend less of the evening scrolling. Collect a few films everyone can access, let friends add suggestions, and close the vote before you meet.",
        steps: [
          { heading: "Set the limits", text: "Agree on a running time, suitable age ratings and the streaming services or discs you can use. Decide whether subtitles work for everyone." },
          { heading: "Make a movie-night room", text: "Set the voting deadline before your planned start time. Share the invitation and ask each person to add one or two films with a short description." },
          { heading: "Vote on the shortlist", text: "Give a Yea or Nay to other members’ ideas. You cannot vote on your own suggestion. Comments can explain concerns without adding more messages to the group chat." },
          { heading: "Review the result together", text: "Check the result when voting ends, resolve any tie, and confirm the film is available. The app helps choose; it does not stream films or verify streaming catalogues." },
        ],
        example: { heading: "Saturday movie night · vote before 18:00", ideas: ["A short comedy · under 100 minutes", "A mystery · subtitles available", "An animated adventure · check age rating"], note: "Use actual film titles in your room and check legal viewing availability. This example does not represent real votes." },
      },
      weekend: {
        title: "Vote on weekend plans with friends | Yea or Nay",
        description: "Choose a weekend activity as a group. Collect practical ideas, compare budget and travel time, and vote on a plan before the weekend.",
        heading: "Turn weekend possibilities into a shared plan.",
        intro: "A walk, a picnic or a day trip? Compare ideas in one room instead of losing them in a busy chat. Start with a time the group can actually make.",
        steps: [
          { heading: "Agree on time and budget", text: "Choose a date outside the app, ask what people can spend, and check transport and accessibility. Yea or Nay votes on ideas; it does not compare calendar availability." },
          { heading: "Create a room with a useful deadline", text: "Close voting early enough to arrange transport or tickets. Share the room code or link with your friends, who will need accounts to participate." },
          { heading: "Suggest practical activities", text: "Add a location, likely cost and a weather backup to each idea. Vote on other members’ suggestions and use comments to ask questions." },
          { heading: "Confirm the chosen plan", text: "When voting ends, check the result and discuss any tied options. Confirm weather, tickets and transport separately, then share the final meeting details." },
        ],
        example: { heading: "Sunday afternoon · decide by Friday", ideas: ["Park picnic · bring food · indoor backup needed", "Coastal walk · check weather and transport", "Museum afternoon · check tickets and access"], note: "These are illustrative activities. The app does not check weather, sell tickets or make bookings." },
      },
      "how-it-works": {
        title: "How group voting works | Yea or Nay",
        description: "Learn how to create a room, invite friends, add ideas and vote Yea or Nay. Understand deadlines, changing votes, scores and tied results.",
        heading: "A room, shared ideas, and a deadline.",
        intro: "Yea or Nay is a group decision board. Members suggest ideas and vote on each other’s suggestions. It is designed for choosing plans, not elections, anonymous surveys or calendar scheduling.",
        steps: [
          { heading: "Create an account and a room", text: "Sign in, name the room and set a future voting deadline. Share its code or invitation link. Other people also need an account and must join before reading the room’s ideas and votes." },
          { heading: "Add ideas and discuss", text: "Members can add suggestions with details and comment on ideas. The host manages the room and can end voting early. Keep sensitive information out of uploaded images: image URLs are publicly accessible to anyone who has the URL." },
          { heading: "Give a Yea or Nay", text: "A Yea adds one to an idea’s score and a Nay subtracts one. You cannot vote on your own idea. While voting is open, you can change your vote or remove it by selecting it again." },
          { heading: "Read the result", text: "Once voting closes, votes cannot be changed. The highest-scoring idea wins; equal top scores can produce multiple winners. The result does not guarantee unanimous agreement. Discuss ties and arrange the actual plan together." },
        ],
        example: { heading: "A simple score example", ideas: ["Idea A · 4 Yea and 1 Nay = score 3", "Idea B · 3 Yea and 0 Nay = score 3", "Idea C · 1 Yea and 2 Nay = score −1"], note: "A and B tie at the highest score. This explains scoring only; it is not a real room or a promise of participation." },
      },
    },
  },
  pt: {
    homeTitle: "Yea or Nay — Votação em grupo para combinar planos",
    homeDescription: "Decidam o que fazer em conjunto. Criem uma sala, partilhem ideias e votem até ao prazo. Para jantares, noites de cinema e planos de fim de semana.",
    category: "Votação em grupo para combinar planos com amigos",
    examples: "Uma pergunta. Um plano em conjunto.",
    examplesIntro: "Começa com uma decisão que o grupo precisa mesmo de tomar. Estes exemplos mostram como transformar sugestões numa votação.",
    rulesLink: "Como funciona a votação", home: "Início", signIn: "Iniciar sessão", start: "Combinar um plano", dashboard: "As tuas salas",
    language: "Ler esta página em inglês", theme: "Alterar o tema de cores", skip: "Saltar para o conteúdo", privacy: "Privacidade", terms: "Termos",
    back: "Mais formas de combinar um plano", exampleLabel: "Exemplo ilustrativo · não é uma sala real",
    accountNote: "É necessária uma conta para criar uma sala e participar. Partilha o convite com as pessoas que queres juntar.",
    ctaHeading: "Leva a próxima pergunta ao grupo.",
    guides: {
      dinner: {
        title: "Escolher onde jantar com amigos | Yea or Nay",
        description: "Escolham o jantar em conjunto: combinem orçamento e necessidades alimentares, juntem sugestões e votem até ao prazo com o Yea or Nay.",
        heading: "Onde vamos jantar? Deixa o grupo votar.",
        intro: "Uma conversa sobre jantar pode juntar vinte sugestões sem escolher nenhuma. Dá ao grupo uma lista curta e um prazo, para todos saberem quando se toma a decisão.",
        steps: [
          { heading: "Combinem primeiro o essencial", text: "Pergunta pelo orçamento, zona, necessidades alimentares e acessibilidade antes de votar. Uma opção popular não serve de muito se alguém não puder comer lá." },
          { heading: "Cria uma sala para o jantar", text: "Escolhe um nome claro, como Jantar de sexta, e um prazo que permita confirmar a disponibilidade. Partilha o convite na conversa do grupo; cada pessoa entra com uma conta." },
          { heading: "Juntem algumas opções realistas", text: "Os membros podem sugerir locais e acrescentar pormenores úteis, como preços ou tempo de viagem. Votem Yea ou Nay nas sugestões dos outros e usem os comentários para esclarecer dúvidas." },
          { heading: "Vejam o resultado e façam a reserva", text: "Quando a votação terminar, consultem o resultado. Se houver empate, conversem sobre as opções vencedoras. Confirmem o horário e a disponibilidade diretamente com o restaurante: o Yea or Nay não faz reservas." },
        ],
        example: { heading: "Jantar de sexta · decidir até quinta à noite", ideas: ["Dumplings perto de casa · opções vegetarianas", "Pizza no centro · orçamento moderado", "Cozinhar em conjunto · combinar ingredientes"], note: "São sugestões fictícias, não recomendações de restaurantes. Confirmem as necessidades alimentares e a disponibilidade com o grupo." },
      },
      "movie-night": {
        title: "Escolher um filme com amigos | Votação para cinema | Yea or Nay",
        description: "Juntem filmes para uma noite de cinema, comparem duração e disponibilidade e votem no que querem ver com o Yea or Nay.",
        heading: "Escolham o filme antes de começar a sessão.",
        intro: "Passem menos tempo a percorrer catálogos. Juntem alguns filmes a que todos tenham acesso, deixem os amigos sugerir e fechem a votação antes de se encontrarem.",
        steps: [
          { heading: "Definam os limites", text: "Combinem uma duração, classificações etárias adequadas e os serviços de streaming ou discos disponíveis. Confirmem se todos podem acompanhar as legendas." },
          { heading: "Criem uma sala para a sessão", text: "Marquem o fim da votação antes da hora prevista para começar. Partilhem o convite e peçam a cada pessoa um ou dois filmes com uma breve descrição." },
          { heading: "Votem nas sugestões", text: "Deem um Yea ou Nay às ideias dos outros membros. Não é possível votar na própria sugestão. Os comentários permitem esclarecer dúvidas sem encher a conversa do grupo." },
          { heading: "Consultem o resultado em conjunto", text: "Vejam o resultado quando a votação terminar, resolvam eventuais empates e confirmem se o filme está disponível. A aplicação ajuda a escolher; não transmite filmes nem verifica catálogos." },
        ],
        example: { heading: "Cinema no sábado · votar antes das 18:00", ideas: ["Uma comédia curta · menos de 100 minutos", "Um mistério · com legendas", "Uma aventura de animação · confirmar classificação etária"], note: "Usem títulos reais na sala e confirmem onde os podem ver legalmente. Este exemplo não representa votos reais." },
      },
      weekend: {
        title: "Votar nos planos de fim de semana com amigos | Yea or Nay",
        description: "Escolham uma atividade de fim de semana em grupo. Juntem ideias práticas, comparem orçamento e deslocações e votem num plano.",
        heading: "Transformem possibilidades num plano de fim de semana.",
        intro: "Um passeio, um piquenique ou uma visita fora da cidade? Comparem ideias numa sala em vez de as perder numa conversa cheia de mensagens. Comecem por uma altura em que todos possam participar.",
        steps: [
          { heading: "Combinem horário e orçamento", text: "Escolham uma data fora da aplicação, perguntem quanto cada pessoa pode gastar e confirmem transportes e acessibilidade. O Yea or Nay permite votar em ideias; não compara calendários." },
          { heading: "Criem uma sala com um prazo útil", text: "Terminem a votação a tempo de organizar transportes ou bilhetes. Partilhem o código ou a ligação com os amigos, que precisam de uma conta para participar." },
          { heading: "Sugiram atividades práticas", text: "Acrescentem local, custo provável e alternativa para mau tempo a cada ideia. Votem nas sugestões dos outros e usem os comentários para fazer perguntas." },
          { heading: "Confirmem o plano escolhido", text: "Quando a votação terminar, vejam o resultado e conversem sobre empates. Confirmem meteorologia, bilhetes e transportes à parte e partilhem o ponto de encontro." },
        ],
        example: { heading: "Domingo à tarde · decidir até sexta", ideas: ["Piquenique no parque · levar comida · prever alternativa interior", "Passeio junto ao mar · confirmar tempo e transportes", "Tarde no museu · confirmar bilhetes e acessos"], note: "São atividades ilustrativas. A aplicação não verifica a meteorologia, vende bilhetes nem faz reservas." },
      },
      "how-it-works": {
        title: "Como funciona a votação em grupo | Yea or Nay",
        description: "Aprende a criar uma sala, convidar amigos, sugerir ideias e votar Yea ou Nay. Conhece os prazos, a alteração de votos, a pontuação e os empates.",
        heading: "Uma sala, ideias partilhadas e um prazo.",
        intro: "O Yea or Nay é um quadro de decisões em grupo. Os membros sugerem ideias e votam nas sugestões dos outros. Serve para combinar planos, não para eleições, inquéritos anónimos ou gestão de calendários.",
        steps: [
          { heading: "Cria uma conta e uma sala", text: "Inicia sessão, dá um nome à sala e define um prazo futuro. Partilha o código ou a ligação do convite. As outras pessoas também precisam de uma conta e de entrar na sala antes de ler as ideias e os votos." },
          { heading: "Juntem ideias e conversem", text: "Os membros podem acrescentar sugestões com pormenores e comentar ideias. O anfitrião gere a sala e pode terminar a votação mais cedo. Evita informação sensível nas imagens: qualquer pessoa com o URL de uma imagem pode aceder-lhe publicamente." },
          { heading: "Dá um Yea ou Nay", text: "Um Yea acrescenta um ponto à ideia e um Nay retira um ponto. Não podes votar na tua própria ideia. Enquanto a votação estiver aberta, podes mudar o voto ou retirá-lo selecionando-o de novo." },
          { heading: "Consulta o resultado", text: "Depois de terminar a votação, os votos deixam de poder ser alterados. Ganha a ideia com maior pontuação; um empate no topo pode dar várias vencedoras. O resultado não garante unanimidade. Conversem sobre os empates e combinem o plano final." },
        ],
        example: { heading: "Um exemplo simples de pontuação", ideas: ["Ideia A · 4 Yea e 1 Nay = 3 pontos", "Ideia B · 3 Yea e 0 Nay = 3 pontos", "Ideia C · 1 Yea e 2 Nay = −1 ponto"], note: "A e B empatam na maior pontuação. Este exemplo explica apenas a contagem; não é uma sala real nem uma promessa de participação." },
      },
    },
  },
};
