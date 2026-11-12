import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

export type ModalityType = "SCHOOL" | "MISSION" | "BOTH";

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
      case "SCHOOL":
        return "Escola de Missões";
      case "MISSION":
        return "Missão Amazonas 2027";
      case "BOTH":
        return "Escola de Missões + Missão Amazonas";
    }
  }

  get includesAmazonasMission(): boolean {
    return this.props.type === "MISSION" || this.props.type === "BOTH";
  }

  public static create(raw: string): Result<EnrollmentModality, Error> {
    const upper = (raw || "").toUpperCase().trim();
    
    // Normalization mapping for backward compatibility if needed
    let resolvedType: ModalityType | null = null;
    if (upper === "SCHOOL" || upper === "ESCOLA") resolvedType = "SCHOOL";
    else if (upper === "MISSION" || upper === "MISSAO") resolvedType = "MISSION";
    else if (upper === "BOTH" || upper === "AMBOS") resolvedType = "BOTH";

    if (!resolvedType) {
      return Result.fail(
        new Error("Invalid modality. Allowed values: SCHOOL, MISSION, BOTH.")
      );
    }

    return Result.ok(new EnrollmentModality({ type: resolvedType }));
  }
}
