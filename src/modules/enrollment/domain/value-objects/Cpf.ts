import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface CpfProps {
  value: string; // 11 dígitos limpos
}

export class Cpf extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get formatted(): string {
    const v = this.props.value;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`;
  }

  public static create(raw: string): Result<Cpf, Error> {
    if (!raw || typeof raw !== "string") {
      return Result.fail(new Error("CPF é obrigatório."));
    }

    const clean = raw.replace(/\D/g, "");

    if (clean.length !== 11) {
      return Result.fail(new Error("CPF deve conter exatamente 11 dígitos."));
    }

    // Rejeita sequências repetidas conhecidas (111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(clean)) {
      return Result.fail(new Error("CPF inválido (dígitos repetidos)."));
    }

    // Validação do 1º dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    const digit1 = rest === 10 || rest === 11 ? 0 : rest;

    if (digit1 !== parseInt(clean.charAt(9), 10)) {
      return Result.fail(new Error("CPF com dígito verificador inválido."));
    }

    // Validação do 2º dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rest = 11 - (sum % 11);
    const digit2 = rest === 10 || rest === 11 ? 0 : rest;

    if (digit2 !== parseInt(clean.charAt(10), 10)) {
      return Result.fail(new Error("CPF com dígito verificador inválido."));
    }

    return Result.ok(new Cpf({ value: clean }));
  }
}

