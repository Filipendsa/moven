"use client";

import {
  BookOpen,
  Anchor,
  Clock,
  CheckCircle2,
  Download,
  MessageCircle,
  KeyRound,
  Star,
} from "lucide-react";

export default function AdminTutorialPanel() {
  const steps = [
    {
      icon: Star,
      title: "1. Como Cadastrar e Destacar uma Nova Missão",
      color: "text-[#8fa66a] bg-[#8fa66a]/20",
      items: [
        "Acesse a aba \"Missões\" no topo deste painel e clique em \"Cadastrar Nova Missão\".",
        "Preencha Título (ex: Missão Sertão 2028), Localidade, Datas, Valor em Reais e o Link de checkout do Even3 (enquanto estiver usando o Even3).",
        "Defina as Vagas Mínimas (ex: 28) e o Limite para Lista de Espera.",
        "Marque \"Colocar em Destaque na Página Inicial\" se ela for a expedição principal do momento — ou clique em \"Destacar na Home\" a qualquer momento na lista de missões.",
        "Todas as missões marcadas como \"Visível para o público\" aparecem automaticamente na seção Missões & Expedições da página inicial para divulgação.",
      ],
    },
    {
      icon: Clock,
      title: "2. Como Funciona a Lista de Espera Automática",
      color: "text-amber-600 bg-amber-500/20",
      items: [
        "O mínimo de vagas para fechar a missão (ex: 28 na Missão Amazonas) é contado apenas pelas inscrições com status \"Pago\".",
        "Assim que as 28 vagas confirmadas são preenchidas, se a opção \"Habilitar Lista de Espera\" estiver marcada, o sistema muda automaticamente o botão do site para \"Entrar na Lista de Espera\".",
        "Quem se inscrever pela Lista de Espera fica salvo com o status roxo/âmbar \"Lista de Espera\" sem ser cobrado na hora.",
        "Quando novas vagas forem abertas (ex: segundo barco ou desistência), vá na aba \"Inscritos\", filtre por \"Lista de Espera\", chame a pessoa no WhatsApp e clique em \"Liberar Vaga\" ou \"Confirmar Pagamento\".",
      ],
    },
    {
      icon: CheckCircle2,
      title: "3. Conciliação de Pagamentos (Even3 vs InfinitePay)",
      color: "text-emerald-600 bg-emerald-500/20",
      items: [
        "Enquanto o pagamento estiver configurado no modo Even3, todo inscrito nasce no sistema com status \"Pendente\" e é redirecionado para pagar lá.",
        "Após conferir o pagamento no painel do Even3, encontre a pessoa na aba \"Inscritos\" (buscando por Nome, CPF ou E-mail) e clique em \"Confirmar Pagamento\". Isso atualiza a contagem oficial de vagas.",
        "Quando o InfinitePay for ativado na Vercel (NEXT_PUBLIC_PAYMENT_MODE=INFINITEPAY), os pagamentos aprovados mudarão de \"Pendente\" para \"Pago\" automaticamente via Webhook.",
      ],
    },
    {
      icon: MessageCircle,
      title: "4. WhatsApp Direto e Exportação para Excel (CSV)",
      color: "text-sky-600 bg-sky-500/20",
      items: [
        "Na última coluna da tabela de Inscritos, clique no ícone verde do WhatsApp para abrir uma conversa direta já com uma mensagem pronta citando o nome da pessoa e a modalidade escolhida.",
        "No topo direito do painel, clique em \"Exportar CSV\" para baixar a planilha completa com Nome, E-mail, WhatsApp, CPF, Status e Data de Aceite LGPD já formatada para abrir sem erros de acentuação no Excel.",
      ],
    },
    {
      icon: KeyRound,
      title: "5. Segurança e Alteração de Senha",
      color: "text-[var(--terra)] bg-[var(--terra)]/20",
      items: [
        "Todo novo líder cadastrado com senha provisória é obrigado a criar uma senha pessoal logo no primeiro login.",
        "Você pode trocar sua senha a qualquer momento clicando no botão \"Alterar Senha\" no cabeçalho superior.",
        "Os dados sensíveis (CPF, telefone e e-mail) são protegidos por Row Level Security (RLS) no Supabase em conformidade com a LGPD.",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#072119] text-[#e9e1d0] p-6 sm:p-8 rounded-3xl border border-[#8fa66a]/30 flex items-start gap-4">
        <div className="p-3 bg-[#8fa66a]/20 text-[#8fa66a] rounded-2xl flex-shrink-0">
          <BookOpen className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading mb-1">
            Guia Rápido da Liderança · MOVEN
          </h2>
          <p className="text-sm text-[#d5cfbf] leading-relaxed">
            Tutorial prático de como gerenciar inscrições, lançar novas missões, controlar a lista de espera e conciliar pagamentos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--terra)]/20 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${step.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-heading text-[var(--ink)]">
                  {step.title}
                </h3>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--ink)]/90 leading-relaxed">
                {step.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--terra)]/20 flex items-center justify-between flex-wrap gap-3 text-xs text-[var(--mut)]">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-[#8fa66a]" />
          <span>MOVEN · Núcleo de Missões · Igreja UNASP-HT</span>
        </div>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-[#8fa66a]" />
          <span>Dúvidas técnicas? Suporte Yesode (yesode.com)</span>
        </div>
      </div>
    </div>
  );
}
