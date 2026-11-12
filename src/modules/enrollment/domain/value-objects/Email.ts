import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(raw: string): Result<Email, Error> {
    if (!raw || typeof raw !== "string") {
      return Result.fail(new Error("E-mail é obrigatório."));
    }

    const trimmed = raw.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmed)) {
      return Result.fail(new Error("Formato de e-mail inválido."));
    }

    return Result.ok(new Email({ value: trimmed }));
  }
}

