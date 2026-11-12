import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5">
      <div className="max-w-3xl mx-auto bg-[var(--card)] p-8 sm:p-12 rounded-3xl border border-[var(--terra)]/20 shadow-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-[#8fa66a]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Termos de Uso e Condições Gerais
          </h1>
        </div>

        <p className="text-xs text-[var(--mut)] mb-6">
          MOVEN · Núcleo de Missões · Igreja UNASP-HT · Edição 2026/2027
        </p>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              1. Da Escola de Missões
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>O valor de R$ 170,00 é referente à taxa única de matrícula e inclui a pasta do aluno (livro Passaporte, camiseta, squeeze, caderno, lápis e caneta).</li>
              <li>A certificação exige no mínimo 70% da nota nas atividades, 80% de presença nos encontros quinzenais e a conclusão do curso online Passaporte para a Missão (SVA).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              2. Da Missão Amazonas 2027
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A missão ocorrerá de 19 a 29 de julho de 2027, em parceria com o projeto Salva-Vidas Amazônia (Missão Noroeste).</li>
              <li><strong>Passagens Aéreas:</strong> O trecho São Paulo–Manaus não está incluso no valor de R$ 2.500,00 e é de inteira responsabilidade do voluntário.</li>
              <li><strong>Vagas:</strong> Limitadas estritamente a 28 vagas confirmadas (mediante pagamento), respeitando a capacidade técnica e de segurança da embarcação.</li>
              <li><strong>Pré-requisitos:</strong> Certificação na Escola de Missões, cadastro aprovado no SVA/VividFaith e vacinas obrigatórias em dia (febre amarela e tétano).</li>
              <li><strong>Menores de idade:</strong> Menores de 16 anos devem estar acompanhados dos pais ou responsáveis legais. Participantes de 16 a 17 anos necessitam de autorização por escrito assinada e com firma reconhecida.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              3. Cancelamento e Reembolso
            </h2>
            <p>
              Cancelamentos solicitados com até 60 dias de antecedência do início da expedição
              terão reembolso conforme as políticas de custos fixos já contratados da embarcação e seguro.
              Taxas administrativas de processamento de cartão ou boleto não são reembolsáveis.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

