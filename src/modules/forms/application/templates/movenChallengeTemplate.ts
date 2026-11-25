import {
  FormQuestion,
  FormSettings,
} from "../../domain/entities/FormTypes";

export function buildMovenChallengeTemplate(): {
  title: string;
  description: string;
  questions: FormQuestion[];
  settings: FormSettings;
} {
  return {
    title: "Desafio Escola de Missões Moven",
    description:
      "Responda às perguntas iniciais e descubra alguns fatos sobre a Escola de Missões Moven!",
    questions: [
      {
        id: "q_nome",
        type: "SHORT_TEXT",
        title: "Seu nome completo",
        required: true,
      },
      {
        id: "q_telefone",
        type: "PHONE",
        title: "Seu WhatsApp / Telefone",
        required: true,
      },
      {
        id: "q_1",
        type: "MULTIPLE_CHOICE",
        title:
          'Pergunta 1 — Quando você ouve "Escola de Missões", o que vem à sua mente?',
        required: true,
        options: [
          "A) Um programa que organiza viagens missionárias.",
          "B) Um curso destinado a pastores e líderes religiosos.",
          "C) Uma escola que oferece aulas e capacitações para preparar missionários.",
          "D) Um grupo que realiza ações sociais e evangelísticas.",
          "E) Não sei dizer.",
        ],
      },
      {
        id: "q_2",
        type: "MULTIPLE_CHOICE",
        title:
          "Pergunta 2 — Você já tinha ouvido falar da Escola de Missões Moven?",
        required: true,
        options: [
          "A) Sim, conheço a proposta da escola.",
          "B) Sim, mas ainda tenho algumas dúvidas.",
          "C) Já ouvi o nome, mas não sei exatamente o que é.",
          "D) Não, é a primeira vez que ouço falar.",
        ],
      },
      {
        id: "q_3",
        type: "CHECKBOXES",
        title:
          "Pergunta 3 — O que você mais gostaria de entender sobre a Moven?",
        description: "Pode marcar mais de uma opção.",
        required: false,
        options: [
          "Quem pode participar.",
          "Como funcionam as aulas e capacitações.",
          "Quais assuntos são ensinados.",
          "Se é necessário ter experiência missionária.",
          "Se a escola envolve viagens missionárias.",
          "Como participar da próxima turma.",
        ],
        allowOther: true,
      },
      {
        id: "sec_2",
        type: "SECTION_BREAK",
        title:
          "Seção 2 — Agora chegou a hora de descobrir alguns fatos sobre a Escola de Missões Moven!",
        description:
          "Será que tudo o que você ouviu sobre ela é verdade? Escolha suas respostas e descubra mais sobre nossa proposta de formação missionária.",
        required: false,
      },
      {
        id: "q_4_quiz",
        type: "MULTIPLE_CHOICE",
        title:
          "A Escola de Missões Moven existe apenas para organizar viagens missionárias.",
        required: true,
        options: ["A) Verdadeiro", "B) Falso"],
        isQuiz: true,
        correctOption: "B) Falso",
        explanation:
          "A Moven é uma escola de formação missionária! Seu propósito é preparar e capacitar pessoas por meio de aulas e experiências de aprendizado. A missão vai muito além de uma viagem.",
        lockOnSelect: true,
      },
      {
        id: "q_5_quiz",
        type: "MULTIPLE_CHOICE",
        title:
          "Somente membros da Igreja Adventista podem participar da Escola de Missões Moven.",
        required: true,
        options: ["A) Verdadeiro", "B) Falso"],
        isQuiz: true,
        correctOption: "B) Falso",
        explanation:
          "A Moven é aberta a todos! Não é necessário ser membro da Igreja Adventista para participar. A escola recebe pessoas interessadas em aprender e se preparar para a missão.",
        lockOnSelect: true,
      },
      {
        id: "q_6_quiz",
        type: "MULTIPLE_CHOICE",
        title:
          "A Escola de Missões Moven é destinada exclusivamente aos jovens.",
        required: true,
        options: ["A) Verdadeiro", "B) Falso"],
        isQuiz: true,
        correctOption: "B) Falso",
        explanation:
          "Missão não é uma questão de idade! A Moven foi criada para oferecer formação a pessoas de diferentes idades que desejam se preparar para servir.",
        lockOnSelect: true,
      },
      {
        id: "q_7_quiz",
        type: "MULTIPLE_CHOICE",
        title:
          "É preciso já ter experiência missionária para começar a formação na Moven.",
        required: true,
        options: ["A) Verdadeiro", "B) Falso"],
        isQuiz: true,
        correctOption: "B) Falso",
        explanation:
          "Ninguém precisa chegar sabendo tudo! A Escola de Missões existe justamente para ensinar, desenvolver habilidades e preparar pessoas para atuar na missão.",
        lockOnSelect: true,
      },
      {
        id: "q_8_quiz",
        type: "MULTIPLE_CHOICE",
        title: "Qual é o principal propósito da Escola de Missões Moven?",
        required: true,
        options: [
          "A) Organizar viagens missionárias para outros países.",
          "B) Formar e capacitar pessoas para servir na missão.",
          "C) Preparar exclusivamente futuros pastores.",
          "D) Reunir voluntários apenas para eventos da igreja.",
        ],
        isQuiz: true,
        correctOption: "B) Formar e capacitar pessoas para servir na missão.",
        explanation:
          "A Moven nasceu com o propósito de preparar pessoas para a missão. Por meio de aulas e capacitações, buscamos desenvolver conhecimentos e habilidades que contribuam para um serviço missionário mais consciente e preparado.",
        lockOnSelect: true,
      },
      {
        id: "sec_3",
        type: "SECTION_BREAK",
        title: "Seção 3 — E você, faz parte dessa missão?",
        description: "",
        required: false,
      },
      {
        id: "q_9",
        type: "MULTIPLE_CHOICE",
        title:
          "Pergunta 9 — Depois de conhecer um pouco mais sobre a Moven, qual destas frases mais combina com você?",
        required: true,
        options: [
          "A) Quero conhecer melhor e saber como participar!",
          "B) Achei interessante, mas ainda tenho dúvidas.",
          "C) Gostei da proposta, mas não penso em participar agora.",
          "D) No momento, não tenho interesse.",
        ],
      },
    ],
    settings: {
      limitOnePerDevice: false,
      maxResponses: null,
      closesAt: null,
      thankYouMessage:
        "A missão começa com preparação!\nObrigado por participar do nosso desafio!\n\nAgora você já conhece um pouco mais sobre a Escola de Missões Moven.\n\nAprender. Preparar. Servir.\n\nEscola de Missões Moven",
    },
  };
}
