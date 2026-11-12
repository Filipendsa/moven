"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function EnrollmentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialModality = searchParams.get("modalidade")?.toUpperCase() || "ESCOLA";

  const [modality, setModality] = useState(
    ["ESCOLA", "MISSAO", "AMBOS"].includes(initialModality)
      ? initialModality
      : "ESCOLA"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Máscaras de entrada (Clean UX)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    } else if (v.length > 6) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    } else if (v.length > 3) {
      v = `${v.slice(0, 3)}.${v.slice(3)}`;
    }
    setCpf(v);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    setPhone(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage("Você precisa concordar com os Termos de Uso e Política de Privacidade.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          cpf,
          modality,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar inscrição.");
      }

      // Redirecionamento inteligente
      const checkout = data.checkout;
      if (checkout.isMultipleStep) {
        // Modo AMBOS no Even3: direciona para página de instruções com os dois botões
        router.push(
          `/inscricao/sucesso?order_id=${data.registrationId}&multi=true&escola_url=${encodeURIComponent(
            checkout.checkoutUrl
          )}&missao_url=${encodeURIComponent(checkout.extraCheckoutUrl || "")}`
        );
      } else {
        // Redireciona diretamente para o Even3 ou InfinitePay
        window.location.href = checkout.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
          Central de Inscrições · MOVEN
        </h1>
        <p className="text-sm text-[var(--mut)] mb-6">
          Preencha seus dados para garantir sua vaga na Escola e na Missão Amazonas 2027.
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seleção de Modalidade */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Escolha a Modalidade:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <label
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "ESCOLA"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="modality"
                    value="ESCOLA"
                    checked={modality === "ESCOLA"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a]"
                  />
                  <div>
                    <div className="font-semibold text-sm sm:text-base">
                      Escola de Missões
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      8 encontros quinzenais + kit do aluno
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a]">
                  R$ 168,42
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "MISSAO"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="modality"
                    value="MISSAO"
                    checked={modality === "MISSAO"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a]"
                  />
                  <div>
                    <div className="font-semibold text-sm sm:text-base">
                      Missão Amazonas 2027
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      10 dias de barco (limite 28 vagas)
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a]">
                  R$ 2.463,16
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "AMBOS"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="modality"
                    value="AMBOS"
                    checked={modality === "AMBOS"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a]"
                  />
                  <div>
                    <div className="font-semibold text-sm sm:text-base">
                      Escola + Missão Amazonas (Combo)
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      Formação completa + Viagem missionária
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a]">
                  R$ 2.631,58
                </div>
              </label>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Gabriel Santos Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          {/* Telefone e CPF em duas colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="text"
                required
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
          </div>

          {/* Aceite LGPD */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 accent-[#8fa66a] w-4 h-4 rounded"
              />
              <span className="text-xs text-[var(--mut)] leading-relaxed">
                Li e concordo com os{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  className="text-[#8fa66a] underline hover:text-[var(--ink)]"
                >
                  Termos de Uso
                </Link>{" "}
                e com o tratamento dos meus dados conforme a{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  className="text-[#8fa66a] underline hover:text-[var(--ink)]"
                >
                  Política de Privacidade (LGPD)
                </Link>{" "}
                do MOVEN / Igreja UNASP-HT.
              </span>
            </label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando Inscrição...
              </>
            ) : (
              <>
                <span>Continuar para Pagamento</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

