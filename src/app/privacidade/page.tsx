import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
          <Shield className="w-8 h-8 text-[#8fa66a]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Política de Privacidade e Proteção de Dados (LGPD)
          </h1>
        </div>

        <p className="text-xs text-[var(--mut)] mb-6">
          Última atualização: Versão 2026.1 · MOVEN · Núcleo de Missões · Igreja UNASP-HT
        </p>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              1. Finalidade da Coleta de Dados
            </h2>
            <p>
              O <strong>MOVEN (Núcleo de Missões da Igreja UNASP-HT)</strong> coleta
              seus dados pessoais (<strong>Nome Completo, E-mail, Telefone/WhatsApp e CPF</strong>)
              com a finalidade exclusiva de:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Processar e gerenciar sua inscrição na Escola de Missões e/ou Missão Amazonas 2027;</li>
              <li>Emitir listas de chamada, crachás e certificados de conclusão;</li>
              <li>Viabilizar a contratação de seguro de viagem obrigatório e cadastro no Serviço Voluntário Adventista (SVA / VividFaith);</li>
              <li>Conciliar pagamentos e emitir comprovantes;</li>
              <li>Manter contato pastoral, avisos de aulas e orientações logísticas da missão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              2. Compartilhamento e Não Comercialização
            </h2>
            <p>
              O MOVEN <strong>não comercializa, não aluga e não compartilha</strong> seus dados
              com quaisquer terceiros com fins lucrativos ou publicitários. O compartilhamento ocorre
              estritamente com os órgãos denominacionais necessários (SVA / Associação Paulista Central /
              Missão Noroeste) para fins missionários e seguros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              3. Direitos do Titular (LGPD)
            </h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito
              de solicitar a confirmação da existência de tratamento, acesso, correção de dados incompletos ou
              a eliminação dos dados após a conclusão do projeto missionário, bastando entrar em contato com a
              coordenação através do canal oficial:
            </p>
            <p className="mt-2 font-medium">
              E-mail / Contato: <a href="https://wa.me/5511972246881" className="text-[#8fa66a] underline">+55 11 97224-6881</a> (Henrique / Liderança MOVEN).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              4. Cookies e Segurança da Informação
            </h2>
            <p>
              Utilizamos apenas cookies essenciais para autenticação de sessão e armazenamento de preferências
              de tema. Os dados são protegidos por criptografia e controle de acesso com Row Level Security (RLS)
              no banco de dados PostgreSQL.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

