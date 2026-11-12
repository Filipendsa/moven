import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface BrazilianPhoneProps {
  digits: string; // Ex: "5511972246881" ou "11972246881"
}

export class BrazilianPhone extends ValueObject<BrazilianPhoneProps> {
  private constructor(props: BrazilianPhoneProps) {
    super(props);
  }

  get digits(): string {
    return this.props.digits;
  }

  get formatted(): string {
    const raw = this.props.digits.startsWith("55")
      ? this.props.digits.slice(2)
      : this.props.digits;

    if (raw.length === 11) {
      return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    if (raw.length === 10) {
      return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    }
    return raw;
  }

  get internationalDigits(): string {
    return this.props.digits.startsWith("55")
      ? this.props.digits
      : `55${this.props.digits}`;
  }

  public toWhatsAppUrl(customMessage?: string): string {
    const baseUrl = `https://wa.me/${this.internationalDigits}`;
    if (!customMessage) return baseUrl;
    return `${baseUrl}?text=${encodeURIComponent(customMessage)}`;
  }

  public static create(raw: string): Result<BrazilianPhone, Error> {
    if (!raw || typeof raw !== "string") {
      return Result.fail(new Error("Telefone/WhatsApp é obrigatório."));
    }

    let clean = raw.replace(/\D/g, "");

    // Se vier sem DDI Brasil, mas com DDD + 8 ou 9 dígitos
    if (clean.length === 10 || clean.length === 11) {
      clean = `55${clean}`;
    }

    // Com DDI 55: deve ter 12 (fixo) ou 13 (celular) dígitos
    if (clean.length !== 12 && clean.length !== 13) {
      return Result.fail(
        new Error("Telefone/WhatsApp inválido. Deve incluir DDD e número.")
      );
    }

    return Result.ok(new BrazilianPhone({ digits: clean }));
  }
}

