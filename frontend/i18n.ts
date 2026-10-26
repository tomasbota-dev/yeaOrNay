import { useEffect, useState } from "react";

export type Locale = "en-US" | "pt-PT";
export type TranslationParams = Record<string, string | number>;
export type Translate = (english: string, params?: TranslationParams) => string;

export const portuguese: Record<string, string> = {
  "This account or room has reached its capacity. Please remove unused content.": "Esta conta ou sala atingiu o limite de capacidade. Remove conteúdo que já não uses.",
  "Room access or voting status changed. Refresh and try again.": "O acesso à sala ou o estado da votação mudou. Atualiza e tenta novamente.",
  "Room access changed. Refresh and try again.": "O acesso à sala mudou. Atualiza e tenta novamente.",
  "Email changes require verification and are not available yet.": "A alteração do email exige verificação e ainda não está disponível.",
  "Your image changed elsewhere. Please try again.": "A tua imagem foi alterada noutra sessão. Tenta novamente.",
  "Choose a deadline within the next 30 days.": "Escolhe uma data de fim nos próximos 30 dias.",
  "Use JSON for this request.": "Envia este pedido no formato JSON.",
  "Registration is temporarily unavailable. Please try again later.": "O registo está temporariamente indisponível. Tenta novamente mais tarde.",
  "Complete the security check and try again.": "Conclui a verificação de segurança e tenta novamente.",
  "Security check is temporarily unavailable. Please try again.": "A verificação de segurança está temporariamente indisponível. Tenta novamente.",
  "Choose an image no larger than 2048 pixels and 4 megapixels.": "Escolhe uma imagem até 2048 píxeis de largura e altura e 4 megapíxeis.",
  "Service is busy. Please try again shortly.": "O serviço está ocupado. Tenta novamente dentro de momentos.",
  "Too many requests. Please wait and try again.": "Demasiados pedidos. Aguarda e tenta novamente.",
  "Enter your password to confirm this action.": "Introduz a tua palavra-passe para confirmar esta ação.",
  "Verification could not load. Try again.": "Não foi possível carregar a verificação. Tenta novamente.",
  "Account creation is temporarily unavailable. Please try again later.": "A criação de contas está temporariamente indisponível. Tenta novamente mais tarde.",
  "Manage your name and profile photo.": "Gere o teu nome e a tua fotografia de perfil.",
  "Email changes are unavailable until email verification is supported.": "A alteração do email está indisponível enquanto não existir verificação de email.",
  "Confirm your password to delete your account.": "Confirma a tua palavra-passe para eliminar a conta.",
  "Better plans start with a little yes.":
    "Os melhores planos começam com um sim.",
  "Bring everyone into the decision. Then get to the fun part.":
    "Decidam em conjunto. Depois, é só aproveitar.",
  "Your next good plan starts here": "O teu próximo grande plano começa aqui",
  "Welcome back": "Boas-vindas",
  "Make an account": "Criar conta",
  "Good to see you": "Ainda bem que voltaste",
  "Get your people together and pick something fun.":
    "Junta o teu grupo e escolham algo divertido.",
  "Your people and plans are waiting.":
    "O teu grupo e os vossos planos esperam por ti.",
  "Log in": "Entrar",
  "Sign up": "Criar conta",
  "What should we call you?": "Como te devemos chamar?",
  "Your name": "O teu nome",
  "Email address": "Endereço de e-mail",
  Password: "Palavra-passe",
  "At least 10 characters": "Pelo menos 10 caracteres",
  "Create my account": "Criar conta",
  "Log out": "Sair",
  "I confirm that I am 18 or older": "Confirmo que tenho 18 anos ou mais",
  "Please confirm that you are 18 or older to create an account.":
    "Confirma que tens 18 anos ou mais para criares uma conta.",
  "Good plans, made together": "Bons planos, feitos em conjunto",
  "What are we doing?": "O que vamos fazer?",
  "Get everyone’s ideas on the table. Let the group decide.":
    "Partilhem ideias e deixem o grupo decidir.",
  "Join a room": "Entrar numa sala",
  "Start a room": "Criar uma sala",
  "Your next good plan starts here.": "O teu próximo grande plano começa aqui.",
  "Start a room for your group or join with a code from a friend.":
    "Cria uma sala para o teu grupo ou entra com o código de alguém.",
  "Join with a code": "Entrar com um código",
  person: "pessoa",
  people: "pessoas",
  idea: "ideia",
  ideas: "ideias",
  "Jump in ↗": "Entrar ↗",
  "See the result ↗": "Ver resultado ↗",
  "Ongoing decisions": "Decisões em curso",
  "Concluded decisions": "Decisões concluídas",
  "No ongoing decisions. Start a room and bring your people together.": "Sem decisões em curso. Cria uma sala e junta o teu grupo.",
  "No concluded decisions yet. Finished rooms will appear here.": "Ainda não há decisões concluídas. As salas terminadas aparecem aqui.",
  "Your rooms": "As tuas salas",
  "You’ve got an invite!": "Tens um convite!",
  "is ready for you. Join the room to add ideas and cast your vote.":
    "está à tua espera. Entra para sugerir ideias e votar.",
  "Join this room →": "Entrar nesta sala →",
  "Made by": "Criada por",
  Created: "Criada",
  "End voting": "Terminar votação",
  "It’s a tie!": "É um empate!",
  "The group has decided!": "O grupo decidiu!",
  "share the win": "partilham a vitória",
  "won the vote": "venceu a votação",
  "Time to decide": "Tempo para decidir",
  "Voting is closed": "A votação terminou",
  "The plan is picked!": "O plano está escolhido!",
  "Room closed": "Sala encerrada",
  "Cast your votes before time runs out": "Vota antes de o tempo terminar",
  "Go make it happen!": "Agora é só aproveitar!",
  "Thanks for deciding together": "Obrigado por decidirem em conjunto",
  "The idea pile ✨": "Ideias do grupo ✨",
  "Your idea in a few words…": "A tua ideia em poucas palavras…",
  "Your idea": "A tua ideia",
  "Add a little detail (optional)": "Acrescenta um detalhe (opcional)",
  "Idea details": "Detalhes da ideia",
  "＋ Add idea": "＋ Adicionar ideia",
  "The group": "O grupo",
  here: "aqui",
  you: "tu",
  host: "anfitrião",
  "Bring your people in": "Convida o teu grupo",
  "Send this code to your group so they can join the decision.":
    "Envia este código ao grupo para participarem na decisão.",
  Copy: "Copiar",
  "No comments yet. Say the first thing ✦":
    "Ainda não há comentários. Começa tu ✦",
  "Add a comment…": "Escreve um comentário…",
  Send: "Enviar",
  Winner: "Vencedor",
  Hide: "Ocultar",
  Comment: "Comentar",
  "Start the idea pile!": "Dá início às ideias!",
  "What sounds fun? Add the first suggestion below.":
    "O que vos apetece fazer? Deixa a primeira sugestão.",
  "Start a room ✨": "Criar sala ✨",
  "Give your group a question to decide. You can add ideas once it’s open.":
    "Escolhe uma pergunta para o grupo decidir. Depois, podem sugerir ideias.",
  "What are we deciding?": "O que vamos decidir?",
  "Friday night plans, anyone?": "Planos para sexta à noite?",
  "How long should voting last?": "Quanto tempo deve durar a votação?",
  "15 minutes · quick pick": "15 minutos · decisão rápida",
  "30 minutes · just right": "30 minutos · ideal",
  "1 hour · take your time": "1 hora · sem pressa",
  "24 hours · decide tomorrow": "24 horas · decidam amanhã",
  "Maybe later": "Talvez mais tarde",
  "Open the room →": "Abrir sala →",
  "Join your people 👋": "Junta-te ao grupo 👋",
  "Enter the room code your friend shared with you.":
    "Introduz o código da sala que te enviaram.",
  "Room code": "Código da sala",
  Cancel: "Cancelar",
  "Join room →": "Entrar na sala →",
  "Made for making plans ✦": "Feito para combinar planos ✦",
  "Small decisions, big memories.": "Pequenas decisões, grandes memórias.",
  "Switch to dark mode": "Ativar modo escuro",
  "Switch to light mode": "Ativar modo claro",
  "Switch language to Portuguese": "Mudar idioma para português",
  "Switch language to English": "Mudar idioma para inglês",
  "Creating account…": "A criar conta…",
  "Signing in…": "A iniciar sessão…",
  "Support reference": "Referência de suporte",
  "auth.serverSignup":
    "Não foi possível concluir a criação da conta. Se já tentaste criar uma conta, experimenta iniciar sessão; a conta pode ter sido criada. Tenta novamente.",
  "auth.serverLogin":
    "Não foi possível iniciar sessão neste momento. Tenta novamente dentro de instantes.",
  "auth.invalidEmail": "Confirma o endereço de e-mail e tenta novamente.",
  "auth.invalidPassword": "A palavra-passe deve ter entre 10 e 128 caracteres.",
  "auth.missingName": "Introduz o teu nome para criares uma conta.",
  "auth.duplicate":
    "Este e-mail já está registado. Experimenta iniciar sessão.",
  "auth.credentials":
    "O e-mail ou a palavra-passe não correspondem. Confirma os dados e tenta novamente.",
  "auth.rateLimited":
    "Demasiadas tentativas. Aguarda 15 minutos e tenta novamente.",
  "Get started": "Começar",
  "Make the plan.": "Escolham o plano.",
  "Make it together.": "Em conjunto.",
  "The easiest way to decide what to do with your people. Share ideas, vote as a group, and let the winning plan pick itself.":
    "A forma mais simples de decidir o que fazer com o teu grupo. Partilhem ideias, votem e deixem o plano vencedor escolher-se.",
  "Start deciding": "Começar a decidir",
  "One room. Everyone’s ideas. A plan you all picked.":
    "Uma sala. As ideias de todos. Um plano escolhido em conjunto.",
  "TONIGHT?": "HOJE À NOITE?",
  "Noodles and dumplings": "Noodles e dumplings",
  "THE GROUP VOTE": "VOTAÇÃO DO GRUPO",
  "Movie night": "Noite de cinema",
  "A good plan, in three easy steps": "Um bom plano, em três passos simples",
  "From “what should we do?” to “let’s go.”":
    "De «o que fazemos?» a «vamos a isso».",
  "Give your group a question and set a time to decide.":
    "Faz uma pergunta ao grupo e define quando termina a votação.",
  "Share the ideas": "Partilhar ideias",
  "Invite your people to add suggestions and vote.":
    "Convida o teu grupo a sugerir ideias e a votar.",
  "Go do the thing": "Está decidido!",
  "See what wins, then make it happen together.":
    "Descubram o que venceu e ponham o plano em prática.",
  "Make a plan together": "Vamos combinar ✨",
  "Custom date & time": "Data e hora personalizadas",
  "End date and time": "Data e hora de fim",
  "Add a question so your group knows what to decide.":
    "Escreve uma pergunta para o grupo saber o que vai decidir.",
  "Choose an end date and time in the future.":
    "Escolhe uma data e hora futuras para terminar a votação.",
  "Room name is required.": "Indica o que o grupo vai decidir.",
  "Choose one of the available time limits.":
    "Escolhe um dos limites de tempo disponíveis.",
  DECIDING: "A DECIDIR",
  DECIDED: "DECIDIDO",
  "← Your rooms": "← As tuas salas",
  Room: "Sala",
  "(you)": "(tu)",
  "Delete room": "Eliminar sala",
  "Time left to decide": "Tempo restante para decidir",
  Ends: "Termina",
  member: "membro",
  members: "membros",
  "Send this link to your group so they can join the decision.":
    "Envia esta ligação ao grupo para participarem na decisão.",
  "Room link": "Ligação da sala",
  "Copy link": "Copiar ligação",
  "Copy code": "Copiar código",
  Kick: "Expulsar",
  Ban: "Banir",
  "Leave room": "Sair da sala",
  "Leave this room?": "Queres sair desta sala?",
  "You left the room.": "Saíste da sala.",
  "Only the room host can manage members.":
    "Só o anfitrião pode gerir os membros.",
  Feedback: "Opinião",
  "Delete account": "Eliminar conta",
  Privacy: "Privacidade",
  Terms: "Termos",
  "Choose a room image": "Escolhe uma imagem para a sala",
  "Or upload a JPG, PNG, or WebP (max 256 KB)":
    "Ou carrega uma imagem JPG, PNG ou WebP (máx. 256 KB)",
  "3 hours": "3 horas",
  Profile: "Perfil",
  Account: "Conta",
  "Your profile": "O teu perfil",
  "Manage your name, email address, and profile photo.":
    "Gere o teu nome, endereço de e-mail e fotografia de perfil.",
  "Profile photo": "Fotografia de perfil",
  "Choose a JPG, PNG, or WebP image, up to 256 KB.":
    "Escolhe uma imagem JPG, PNG ou WebP até 256 KB.",
  "Upload photo": "Carregar fotografia",
  "Remove photo": "Remover fotografia",
  Name: "Nome",
  "Save changes": "Guardar alterações",
  "Profile updated.": "Perfil atualizado.",
  "Photo updated.": "Fotografia atualizada.",
  "Photo removed.": "Fotografia removida.",
  "Permanently delete your account and personal data.":
    "Eliminar permanentemente a tua conta e os teus dados pessoais.",
  "Choose an image smaller than 256 KB.":
    "Escolhe uma imagem com menos de 256 KB.",
};

Object.assign(portuguese, {
  "Close dialog": "Fechar janela",
  "Choose an image": "Escolher imagem",
  "PNG, JPEG or WebP": "PNG, JPEG ou WebP",
  "Create a room.": "Cria uma sala.",
  "Room image": "Imagem da sala",
  "{count} room": "{count} sala",
  "{score} net vote": "Saldo de votos: {score}",
  "ROOM {code} / {count} MEMBER": "SALA {code} / {count} MEMBRO",
  "ON THE TABLE / {count} IDEA": "NA MESA / {count} IDEIA",
  "VOTING CLOSED": "VOTAÇÃO TERMINADA",
  "Could not connect. Check your connection and try again.":
    "Não foi possível estabelecer ligação. Verifica a tua ligação à Internet e tenta novamente.",
  "Privacy notice": "Aviso de privacidade",
  "Terms of service": "Termos de utilização",
  Close: "Fechar",
  Back: "Voltar",
  "Loading…": "A carregar…",
  Loading: "A carregar",
  "In favour": "A favor",
  Against: "Contra",
  "You voted in favour": "Votaste a favor",
  "You voted against": "Votaste contra",
  "Remove vote": "Remover voto",
  "Vote removed": "Voto removido",
  "Vote changed": "Voto alterado",
  "Vote in favour of {title}": "Votar a favor de «{title}»",
  "Vote against {title}": "Votar contra «{title}»",
  "Remove vote in favour of {title}": "Remover voto a favor de «{title}»",
  "Remove vote against {title}": "Remover voto contra «{title}»",
  "Publish idea": "Publicar ideia",
  "Winning idea": "Ideia vencedora",
  "Your vote": "O teu voto",
  "No vote yet": "Ainda não votaste",
  Good: "Boa",
  "Could be better": "Podia ser melhor",
  "Tell us more (optional)": "Conta-nos mais (opcional)",
  "Send feedback": "Enviar opinião",
  "Thanks for the feedback!": "Obrigado pela tua opinião!",
  "Delete your account?": "Queres eliminar a tua conta?",
  "This permanently deletes your account and personal data. Rooms with other members will be handed to another member.":
    "Esta ação elimina permanentemente a tua conta e os teus dados pessoais. As salas com outros membros serão transferidas para outro membro.",
  "Type DELETE to confirm": "Escreve DELETE para confirmar",
  "Confirm deletion": "Confirmar eliminação",
  "Account deleted.": "Conta eliminada.",
  "Room link copied. Invite your people!":
    "Ligação da sala copiada. Convida o teu grupo!",
  "Room code copied. Invite your people!":
    "Código da sala copiado. Convida o teu grupo!",
  "Room code: {code}": "Código da sala: {code}",
  "Room created. {message}": "Sala criada. {message}",
  "Ban this person? They won’t be able to rejoin this room.":
    "Queres banir esta pessoa? Não poderá voltar a entrar nesta sala.",
  "Kick this person? They can rejoin if invited again.":
    "Queres expulsar esta pessoa? Poderá voltar a entrar se receber outro convite.",
  "Member banned from this room.": "Membro banido desta sala.",
  "Member kicked. They can rejoin with an invite.":
    "Membro expulso. Poderá voltar a entrar com um convite.",
  "Delete this room permanently? Its ideas and comments will be removed for everyone.":
    "Queres eliminar esta sala permanentemente? As ideias e os comentários serão eliminados para todos.",
  "Room deleted.": "Sala eliminada.",
  "End voting now and reveal the winning idea?":
    "Queres terminar a votação agora e revelar a ideia vencedora?",
  "That room code has expired or doesn’t exist.":
    "Esse código de sala expirou ou não existe.",
  "Something went wrong. Please try again.":
    "Não foi possível concluir a ação. Tenta novamente.",
  "That message is too long.": "Essa mensagem é demasiado longa.",
  "Please check the form and try again.":
    "Confirma os dados do formulário e tenta novamente.",
  "You need to join this room first.": "Tens de entrar nesta sala primeiro.",
  "Enter a valid email address.": "Introduz um endereço de e-mail válido.",
  "Password must be 10 to 128 characters long.":
    "A palavra-passe deve ter entre 10 e 128 caracteres.",
  "An account with that email already exists. Try logging in.":
    "Já existe uma conta com esse e-mail. Experimenta iniciar sessão.",
  "An account with that email already exists.":
    "Já existe uma conta com esse e-mail.",
  "Too many tries. Please wait 15 minutes and try again.":
    "Demasiadas tentativas. Aguarda 15 minutos e tenta novamente.",
  "Email or password didn’t match. Try again.":
    "O e-mail ou a palavra-passe não correspondem. Tenta novamente.",
  "We couldn’t find a room with that code.":
    "Não encontrámos uma sala com esse código.",
  "Room not found.": "Sala não encontrada.",
  "The host removed you from this room.": "O anfitrião removeu-te desta sala.",
  "The host can’t remove themselves.":
    "O anfitrião não pode remover-se a si próprio.",
  "That person is no longer in this room.":
    "Essa pessoa já não está nesta sala.",
  "The room host cannot leave. Delete the room or transfer it first.":
    "O anfitrião não pode sair da sala. Elimina ou transfere a sala primeiro.",
  "You are not a member of this room.": "Não és membro desta sala.",
  "Only the room host can delete this room.":
    "Só o anfitrião pode eliminar esta sala.",
  "Choose positive or negative feedback.":
    "Escolhe uma opinião positiva ou negativa.",
  "Feedback can be up to 500 characters.":
    "A opinião pode ter até 500 caracteres.",
  "Only the room host can change its image.":
    "Só o anfitrião pode alterar a imagem da sala.",
  "Use a JPG, PNG, or WebP image.": "Usa uma imagem JPG, PNG ou WebP.",
  "Choose an image file.": "Escolhe um ficheiro de imagem.",
  "That file doesn’t look like a supported image.":
    "Esse ficheiro não parece ser uma imagem suportada.",
  "Voting has closed. Take a look at the result!":
    "A votação terminou. Consulta o resultado!",
  "Details can be up to 500 characters.":
    "Os detalhes podem ter até 500 caracteres.",
  "This room has reached its 100 idea limit.":
    "Esta sala atingiu o limite de 100 ideias.",
  "Choose an upvote or a downvote.": "Escolhe um voto a favor ou contra.",
  "Idea not found.": "Ideia não encontrada.",
  "You can’t vote on your own idea.": "Não podes votar na tua própria ideia.",
  "You can’t vote for your own idea": "Não podes votar na tua própria ideia",
  "Voting has closed.": "A votação terminou.",
  "Only the room host can end voting early.":
    "Só o anfitrião pode terminar a votação antes do prazo.",
  "Request origin could not be verified.":
    "Não foi possível verificar a origem do pedido.",
  "Please log in to continue.": "Inicia sessão para continuar.",
  "Not found.": "Não encontrado.",
  "E.G. SUNNY7": "P. EX. SUNNY7",
  "by {name}": "por {name}",
  "{count} idea": "{count} ideia",
  "{count} ideas": "{count} ideias",
  "{count} member": "{count} membro",
  "{count} members": "{count} membros",
  "{count} vote": "{count} voto",
  "{count} votes": "{count} votos",
  "{count} person": "{count} pessoa",
  "{count} people": "{count} pessoas",
  "Room {code}": "Sala {code}",
  "Made by {name} · Created {date}": "Criada por {name} · Criada a {date}",
  "{name} is ready for you. Join the room to add ideas and cast your vote.":
    "A sala {name} está à tua espera. Entra para sugerir ideias e votar.",
  "{ideas} share the win": "{ideas} partilham a vitória",
  "{idea} won the vote": "{idea} venceu a votação",
  "A group choosing a plan together":
    "Um grupo a escolher um plano em conjunto",
  "The easiest way to decide what to do with your people. Share ideas, vote as a group, and let the winning plan pick itself.":
    "A forma mais simples de decidir o que fazer com o teu grupo. Partilhem ideias, votem e descubram o plano mais votado.",
  "Noodles and dumplings": "Massa e pastéis asiáticos",
  Winner: "Ideia vencedora",
  "Room closed": "Sala encerrada",
  "Log in": "Iniciar sessão",
  "Log out": "Terminar sessão",
  "Start a room": "Criar sala",
});

Object.assign(portuguese, {
  "Room image (optional)": "Imagem da sala (opcional)",
  "JPG, PNG or WebP, up to 256 KB.": "JPG, PNG ou WebP, até 256 KB.",
  "Room image preview": "Pré-visualização da imagem da sala",
  "Terms of service — Yea or Nay": "Termos de utilização — Yea or Nay",
  "Privacy notice — Yea or Nay": "Aviso de privacidade — Yea or Nay",
  "Yea or Nay — Good people. One good plan.":
    "Yea or Nay — Boa companhia. Um bom plano.",
  "Yea or Nay home": "Página inicial do Yea or Nay",
  "Main navigation": "Navegação principal",
  "The idea": "A ideia",
  "Change language": "Mudar idioma",
  "Sign in": "Iniciar sessão",
  "Get together": "Juntar o grupo",
  "Getting things ready…": "A preparar tudo…",
  "Let’s try that again.": "Vamos tentar de novo.",
  "Try again": "Tentar novamente",
  "There’s room for you.": "Há lugar para ti.",
  "Good plans start with good company.":
    "Os bons planos começam com boa companhia.",
  "Sign in or create an account to join room {code}.":
    "Inicia sessão ou cria uma conta para entrar na sala {code}.",
  "Sign in to join": "Iniciar sessão para entrar",
  "Create an account": "Criar conta",
  "Your room is open, but the image could not be uploaded.":
    "A sala está aberta, mas não foi possível carregar a imagem.",
  "Your room is open. Bring your people in.":
    "A sala está aberta. Convida o teu grupo.",
  "Profile photo updated.": "Fotografia de perfil atualizada.",
  "This permanently deletes your account and personal data. This cannot be undone.":
    "Esta ação elimina permanentemente a tua conta e os teus dados pessoais. Não pode ser anulada.",
  "Your account has been deleted.": "A tua conta foi eliminada.",
  "Your corner of the group chat": "O teu cantinho do grupo",
  "Hey, {name}.": "Olá, {name}.",
  "What’s the plan?": "Qual é o plano?",
  "A few good ideas. Your favourite people. Let’s decide.":
    "Algumas boas ideias. O teu grupo de sempre. Vamos decidir.",
  "Create a room": "Criar sala",
  "Loading your rooms…": "A carregar as tuas salas…",
  "Your first good plan": "O teu primeiro bom plano",
  "Every plan starts with a question.":
    "Todos os planos começam com uma pergunta.",
  "Create a room or join your people with an invite code.":
    "Cria uma sala ou junta-te ao teu grupo com um código de convite.",
  "Create your first room": "Criar a tua primeira sala",
  "IN THE WORKS": "A COMBINAR",
  "GOOD CALLS": "BOAS ESCOLHAS",
  "{count} rooms": "{count} salas",
  "Voting open": "Votação aberta",
  Decided: "Decidido",
  "{members} people / {ideas} ideas": "{members} pessoas / {ideas} ideias",
  OPEN: "ABERTA",
  RESULT: "RESULTADO",
  "Plans start with a question.": "Os planos começam com uma pergunta.",
  "You don’t need the perfect idea. Open a room and let everyone bring something to the table.":
    "Não precisas da ideia perfeita. Abre uma sala e deixa cada pessoa dar a sua sugestão.",
  "Opening your room…": "A abrir a tua sala…",
  "You’ve got an invite.": "Tens um convite.",
  "Join the room to add ideas and have your say.":
    "Entra na sala para sugerir ideias e dar a tua opinião.",
  "You’re in. Bring an idea.": "Já estás no grupo. Traz uma ideia.",
  "Join this room": "Entrar nesta sala",
  "All your rooms": "Todas as tuas salas",
  "ROOM {code} / {count} MEMBERS": "SALA {code} / {count} MEMBROS",
  "Created by {name}": "Criada por {name}",
  "VOTING OPEN": "VOTAÇÃO ABERTA",
  "{time} left": "Faltam {time}",
  "Ends {date}": "Termina a {date}",
  "The group has decided ↗": "O grupo decidiu ↗",
  "The room is closed.": "A sala está encerrada.",
  "Good call. Now send the “see you there” message.":
    "Boa escolha. Agora é só combinar o encontro.",
  "Thanks for deciding together.": "Obrigado por decidirem em conjunto.",
  "Give your idea a title.": "Dá um título à tua ideia.",
  "Your idea is on the table.": "A tua ideia já está na mesa.",
  "Bring an idea to the table.": "Traz uma ideia para a mesa.",
  "What would you love to do?": "O que te apetece fazer?",
  "The place, the time, the little details… (optional)":
    "O local, a hora, os pequenos detalhes… (opcional)",
  "Everyone can suggest. Everyone can vote.":
    "Todos podem sugerir. Todos podem votar.",
  "Posting…": "A publicar…",
  "Post idea": "Publicar ideia",
  "ON THE TABLE / {count} IDEAS": "NA MESA / {count} IDEIAS",
  "YEA = +1 · NAY = −1": "A FAVOR = +1 · CONTRA = −1",
  "Be the first to put an idea out there.": "Partilha a primeira ideia.",
  "A place, a plan, a possibility. What have you got?":
    "Um lugar, um plano, uma possibilidade. Qual é a tua sugestão?",
  "No ideas were added to this room.":
    "Não foram adicionadas ideias a esta sala.",
  "YOUR IDEA": "A TUA IDEIA",
  "IDEA BY {name}": "IDEIA DE {name}",
  Yea: "A favor",
  Nay: "Contra",
  "Your idea · others can vote": "A tua ideia · os outros podem votar",
  "Your vote · tap again to remove": "O teu voto · toca novamente para remover",
  "What do you think?": "O que achas?",
  "{score} net votes": "Saldo de votos: {score}",
  "Hide comments": "Ocultar comentários",
  "Comments ({count})": "Comentários ({count})",
  "No comments yet. Start the conversation.":
    "Ainda não há comentários. Começa a conversa.",
  "Write a comment before sending.": "Escreve um comentário antes de enviar.",
  "Your comment": "O teu comentário",
  "Good company.": "Boa companhia.",
  You: "Tu",
  Host: "Anfitrião",
  "Manage {name}": "Gerir {name}",
  "Remove {name}?": "Queres remover {name}?",
  "They can join again with the room code.":
    "Esta pessoa pode voltar a entrar com o código da sala.",
  "Remove member": "Remover membro",
  Remove: "Remover",
  "Ban {name}?": "Queres banir {name}?",
  "They will no longer be able to join this room.":
    "Esta pessoa deixará de poder entrar nesta sala.",
  "Ban member": "Banir membro",
  "Room for your people.": "Há lugar para o teu grupo.",
  "Share the code. Bring the group into the decision.":
    "Partilha o código. Junta o grupo à decisão.",
  "Invite link copied.": "Ligação de convite copiada.",
  "Could not copy automatically. Select the invite link below.":
    "Não foi possível copiar automaticamente. Seleciona a ligação de convite abaixo.",
  "Copy invite link": "Copiar ligação de convite",
  "Invite link": "Ligação de convite",
  "Room code copied.": "Código da sala copiado.",
  "Copy room code": "Copiar código da sala",
  "Host controls": "Controlos do anfitrião",
  "Your room": "A tua sala",
  "Keep the conversation moving.": "Mantém a conversa a fluir.",
  "End voting?": "Queres terminar a votação?",
  "The current scores will decide the result. Voting cannot be reopened.":
    "As pontuações atuais vão determinar o resultado. A votação não pode ser reaberta.",
  "Change room image": "Alterar imagem da sala",
  "Room image updated.": "Imagem da sala atualizada.",
  "Delete this room?": "Queres eliminar esta sala?",
  "All ideas, votes and comments in this room will be permanently deleted.":
    "Todas as ideias, votos e comentários desta sala serão eliminados permanentemente.",
  "You can join again with the room code unless the host has removed your access.":
    "Podes voltar a entrar com o código da sala, a menos que o anfitrião tenha removido o teu acesso.",
  "Couldn’t open this room.": "Não foi possível abrir esta sala.",
  "Back to your rooms": "Voltar às tuas salas",
  "This page took a different turn.": "Esta página seguiu outro caminho.",
  "Back home": "Voltar ao início",
  "Dismiss error": "Fechar mensagem de erro",
  "Less back-and-forth.": "Menos indecisão.",
  "More getting together.": "Mais encontros.",
  "Yea or Nay / Good plans, made together":
    "Yea or Nay / Bons planos, feitos em conjunto",
  "Bring your people together.": "Junta o teu grupo.",
  "How’s it going?": "Como está a correr?",
  "Thanks for helping make Yea or Nay better.":
    "Obrigado por ajudares a melhorar o Yea or Nay.",
  "Working…": "A processar…",
  "Tell us your name.": "Indica o teu nome.",
  "A little less “whatever”.": "Menos «tanto faz».",
  "Your people. Your plans.": "O teu grupo. Os teus planos.",
  "Your next": "O teu próximo",
  "good plan": "bom plano",
  "starts here.": "começa aqui.",
  "Good to": "Que bom",
  "have you": "ter-te",
  "back.": "de volta.",
  "Bring your people together. Put every idea on the table. Find your next “let’s do it”.":
    "Junta o teu grupo. Ponham as ideias na mesa. Descubram o próximo «vamos a isso».",
  "The ideas are on the table. Come back into the conversation.":
    "As ideias estão na mesa. Volta à conversa.",
  "THE GROUP HAS DECIDED": "O GRUPO DECIDIU",
  "Less “you choose”.": "Menos «escolhe tu».",
  "More “see you there”.": "Mais «até já».",
  "YEA, LET’S GO.": "SIM, VAMOS A ISSO.",
  "GOOD PEOPLE. ONE GOOD PLAN.": "BOA COMPANHIA. UM BOM PLANO.",
  "01 / MAKE YOURSELF AT HOME": "01 / ESTÁS EM CASA",
  "01 / COME ON IN": "01 / ENTRA",
  "Back to the idea": "Voltar à ideia",
  "Join the conversation.": "Junta-te à conversa.",
  "Sign in.": "Inicia sessão.",
  "A place for your people to make up their minds.":
    "Um lugar para o teu grupo se decidir.",
  "Your rooms are right where you left them.":
    "As tuas salas estão onde as deixaste.",
  "Your room invitation will be waiting after you sign in.":
    "O convite para a sala estará à tua espera depois de iniciares sessão.",
  "you@example.com": "tu@exemplo.pt",
  "Your password": "A tua palavra-passe",
  Show: "Mostrar",
  "I confirm that I am 18 or older.": "Confirmo que tenho 18 anos ou mais.",
  "Already part of the group?": "Já fazes parte do grupo?",
  "New around here?": "É a tua primeira vez por aqui?",
  "One question. Everyone’s ideas.": "Uma pergunta. As ideias de todos.",
  "Start with": "Começa com",
  "a what if.": "um «e se».",
  "Give your group something to decide. They’ll bring the ideas.":
    "Dá ao grupo uma decisão para tomar. As ideias vêm a seguir.",
  "THE NEXT GOOD PLAN": "O PRÓXIMO BOM PLANO",
  "Your people.": "O teu grupo.",
  "Your possibilities.": "As tuas possibilidades.",
  "A room for ideas, a little yea or nay, and a decision you made together.":
    "Uma sala para ideias, votos a favor ou contra e uma decisão tomada em conjunto.",
  "Give your room a question.": "Dá uma pergunta à tua sala.",
  "Friday night. What’s the move?": "Sexta à noite. Qual é o plano?",
  "Give your room a question. Up to 70 characters.":
    "Dá uma pergunta à sala. Até 70 caracteres.",
  "Voting ends": "Fim da votação",
  "Choose a date and time in the future.": "Escolhe uma data e hora futuras.",
  "Opening…": "A abrir…",
  "Open the room": "Abrir sala",
  "Your profile.": "O teu perfil.",
  "Saving…": "A guardar…",
  "Enter the room code your friend shared.":
    "Introduz o código da sala que te enviaram.",
  "Joining…": "A entrar…",
  "Join room": "Entrar na sala",
  "Tell us what works and what could be better.":
    "Diz-nos o que funciona e o que pode melhorar.",
  "Your experience": "A tua experiência",
  "Anything else? (optional)": "Mais alguma coisa? (opcional)",
  "Sending…": "A enviar…",
  "For the group chat that never decides.": "Para o grupo que nunca se decide.",
  "Good people.": "Boa companhia.",
  "One good plan.": "Um bom plano.",
  "Bring your group’s ideas together, vote on your favourites, and make a plan.":
    "Junta as ideias do grupo, vota nas tuas preferidas e combinem um plano.",
  "Make a plan": "Combinar um plano",
  "See how it works": "Ver como funciona",
  "IDEAS → VOTES → ACTUAL PLANS": "IDEIAS → VOTOS → PLANOS A SÉRIO",
  "Scroll. See how a plan comes together.": "Desliza. Vê como nasce um plano.",
  "A group turning ideas into a plan":
    "Um grupo a transformar ideias num plano",
  "01 / SOFIA ADDS AN IDEA": "01 / A SOFIA SUGERE UMA IDEIA",
  "02 / EVERYONE HAS A SAY": "02 / TODOS TÊM UMA PALAVRA A DIZER",
  "03 / THE GROUP HAS DECIDED": "03 / O GRUPO DECIDIU",
  "Dumplings?": "Pastéis asiáticos?",
  "Absolutely dumplings.": "Sem dúvida.",
  YEA: "A FAVOR",
  NAY: "CONTRA",
  "02 / THE GROUP VOTES": "02 / O GRUPO VOTA",
  "Film under the stars.": "Cinema sob as estrelas.",
  "Meet you at 8.": "Até às 8.",
  "Turn all those “maybe”s into a plan.": "Transformem os «talvez» num plano.",
  "Less organising. More living.": "Menos organização. Mais momentos.",
  "A room for your ideas.": "Uma sala para as tuas ideias.",
  "A reason to get out.": "Um motivo para sair.",
  "01 / GET TOGETHER": "01 / JUNTA O GRUPO",
  "Open the question.": "Lança a pergunta.",
  "Friday night? Your next trip? Start a room, set a deadline, and send the link.":
    "Sexta à noite? A próxima viagem? Cria uma sala, define um prazo e envia a ligação.",
  "02 / PUT IT OUT THERE": "02 / PARTILHA A IDEIA",
  "Every idea gets a say.": "Todas as ideias contam.",
  "Add a suggestion. Give a yea to what you love and a nay to what you don’t.":
    "Deixa uma sugestão. Vota a favor do que gostas e contra o que não te convence.",
  "03 / MAKE IT HAPPEN": "03 / PÕE O PLANO EM PRÁTICA",
  "There’s your plan.": "Está escolhido o plano.",
  "When time is up, see what the group picked. The next part is yours.":
    "Quando o tempo terminar, descobre a escolha do grupo. O resto é convosco.",
  "01 Add an idea": "01 Sugere uma ideia",
  "02 Vote together": "02 Votem em conjunto",
  "03 Make the plan": "03 Combinem o plano",
  "15 minutes": "15 minutos",
  "30 minutes": "30 minutos",
  "1 hour": "1 hora",
  "24 hours": "24 horas",
  "Custom date & time": "Data e hora personalizadas",
});

const fieldNames: Record<string, string> = {
  Email: "O e-mail",
  Name: "O nome",
  "Room name": "O nome da sala",
  "Room code": "O código da sala",
  Member: "O membro",
  Idea: "A ideia",
  Comment: "O comentário",
};
for (const [field, translated] of Object.entries(fieldNames)) {
  portuguese[`${field} is required.`] =
    `${translated} é obrigatório${field === "Idea" ? "a" : ""}.`;
  portuguese[`${field} must be between 1 and {max} characters.`] =
    `${translated} deve ter entre 1 e {max} caracteres.`;
}
portuguese["Idea is required."] = "A ideia é obrigatória.";

export function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && /^pt(?:-|$)/i.test(value)
    ? "pt-PT"
    : "en-US";
}
function initialLocale(): Locale {
  if (typeof location !== "undefined") {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested === "pt-PT" || requested === "en-US") return requested;
  }
  try {
    const saved = localStorage.getItem("yn_locale");
    if (saved) return normalizeLocale(saved);
  } catch {
    /* Storage may be unavailable. */
  }
  return typeof navigator === "undefined"
    ? "en-US"
    : navigator.languages?.some((language) => /^pt(?:-|$)/i.test(language))
      ? "pt-PT"
      : "en-US";
}
export function translate(
  locale: string,
  english: string,
  params: TranslationParams = {},
): string {
  let text =
    normalizeLocale(locale) === "pt-PT" ? portuguese[english] : english;
  if (!text && normalizeLocale(locale) === "pt-PT") {
    const fieldLimit = english.match(
      /^(Email|Name|Room name|Room code|Member|Idea|Comment) must be between 1 and (\d+) characters\.$/,
    );
    if (fieldLimit)
      return `${fieldNames[fieldLimit[1]]} deve ter entre 1 e ${fieldLimit[2]} caracteres.`;
  }
  text ||= english;
  return text.replace(
    /\{([A-Za-z][A-Za-z0-9_]*)\}/g,
    (placeholder, key: string) =>
      Object.hasOwn(params, key) ? String(params[key]) : placeholder,
  );
}
export function translateError(error: unknown, locale: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const translated = translate(locale, message);
  return normalizeLocale(locale) === "pt-PT" &&
    translated === message &&
    !Object.hasOwn(portuguese, message)
    ? translate(locale, "Something went wrong. Please try again.")
    : translated ||
        translate(locale, "Something went wrong. Please try again.");
}
export function useI18n() {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  const setLocale = (value: string) => updateLocale(normalizeLocale(value));
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem("yn_locale", locale);
    } catch {
      /* Keep the current session preference. */
    }
  }, [locale]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "yn_locale")
        updateLocale(normalizeLocale(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const t: Translate = (english, params) => translate(locale, english, params);
  return {
    locale,
    setLocale,
    t,
    toggleLocale: () => setLocale(locale === "pt-PT" ? "en-US" : "pt-PT"),
  };
}
