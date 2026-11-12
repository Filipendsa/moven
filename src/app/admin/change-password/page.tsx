"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldAlert, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabaseBrowser } from "@/shared/infrastructure/supabase/client";

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstAccess = searchParams.get("first_access") === "true";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        const { error } = await supabaseBrowser.auth.updateUser({
          password: newPassword,
          data: {
            password_changed: true,
          },
        });

        if (error) {
          throw error;
        }
      }

      sessionStorage.setItem("moven_password_changed", "true");
      setSuccessMessage("Senha alterada com sucesso! Redirecionando para o painel...");

      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar senha. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center py-12 px-5">
      <div className="max-w-md w-full bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl">
        {!isFirstAccess && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </Link>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-[#8fa66a]/20 text-[#8fa66a]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">
              {isFirstAccess ? "Definir Nova Senha" : "Alterar Senha"}
            </h1>
            <p className="text-xs text-[var(--mut)]">
              Painel de Gestão · MOVEN
            </p>
          </div>
        </div>

        {isFirstAccess && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Primeiro acesso detectado:</strong> Como sua conta foi criada pela coordenação com uma senha provisória, por segurança é obrigatório cadastrar uma nova senha pessoal para continuar.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Nova Senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Confirmar Nova Senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#072119] text-[#e9e1d0] font-heading font-semibold py-3 rounded-full hover:bg-[var(--terra)] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando Nova Senha...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-[#8fa66a]" />
                Salvar Nova Senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8fa66a]" />
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
