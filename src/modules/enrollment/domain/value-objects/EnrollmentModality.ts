import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

export type ModalityType = "ESCOLA" | "MISSAO" | "AMBOS";

interface EnrollmentModalityProps {
  type: ModalityType;
}

export class EnrollmentModality extends ValueObject<EnrollmentModalityProps> {
  private constructor(props: EnrollmentModalityProps) {
    super(props);
  }

  get type(): ModalityType {
    return this.props.type;
  }

  get title(): string {
    switch (this.props.type) {
      case "ESCOLA":
        return "Escola de Missões";
      case "MISSAO":
        return "Missão Amazonas 2027";
      case "AMBOS":
        return "Escola de Missões + Missão Amazonas";
    }
  }

  get includesAmazonasMission(): boolean {
    return this.props.type === "MISSAO" || this.props.type === "AMBOS";
  }

  public static create(raw: string): Result<EnrollmentModality, Error> {
    const upper = raw?.toUpperCase() as ModalityType;
    if (upper !== "ESCOLA" && upper !== "MISSAO" && upper !== "AMBOS") {
      return Result.fail(
        new Error("Modalidade inválida. Escolha ESCOLA, MISSAO ou AMBOS.")
      );
    }
    return Result.ok(new EnrollmentModality({ type: upper }));
  }
}

