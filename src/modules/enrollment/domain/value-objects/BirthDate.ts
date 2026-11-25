import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface BirthDateProps {
  isoDate: string; // YYYY-MM-DD
}

export class BirthDate extends ValueObject<BirthDateProps> {
  private constructor(props: BirthDateProps) {
    super(props);
  }

  get value(): string {
    return this.props.isoDate;
  }

  get formattedPtBr(): string {
    const [year, month, day] = this.props.isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  public getAge(referenceDate: Date = new Date()): number {
    const [yearStr, monthStr, dayStr] = this.props.isoDate.split("-");
    const birthYear = Number(yearStr);
    const birthMonth = Number(monthStr);
    const birthDay = Number(dayStr);

    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth() + 1;
    const refDay = referenceDate.getDate();

    let age = refYear - birthYear;
    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
      age -= 1;
    }
    return Math.max(0, age);
  }

  public isMinor(referenceDate: Date = new Date()): boolean {
    return this.getAge(referenceDate) < 18;
  }

  public requiresGuardian(referenceDate: Date = new Date()): boolean {
    return this.getAge(referenceDate) < 16;
  }

  public static create(rawDate: string): Result<BirthDate, Error> {
    const trimmed = (rawDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return Result.fail(
        new Error("Informe uma data de nascimento válida (AAAA-MM-DD).")
      );
    }

    const [y, m, d] = trimmed.split("-").map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    if (
      parsed.getUTCFullYear() !== y ||
      parsed.getUTCMonth() + 1 !== m ||
      parsed.getUTCDate() !== d
    ) {
      return Result.fail(new Error("Data de nascimento inexistente."));
    }

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;

    if (trimmed > todayIso) {
      return Result.fail(
        new Error("A data de nascimento não pode ser no futuro.")
      );
    }

    const temp = new BirthDate({ isoDate: trimmed });
    const age = temp.getAge(today);
    if (age > 120) {
      return Result.fail(new Error("Data de nascimento inválida."));
    }

    return Result.ok(temp);
  }

  public static createOptional(
    rawDate?: string | null
  ): BirthDate | undefined {
    if (!rawDate) return undefined;
    const clean = rawDate.trim().slice(0, 10);
    const result = this.create(clean);
    return result.success ? result.value : undefined;
  }
}
