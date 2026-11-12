import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface MoneyProps {
  amountCents: number;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amountCents(): number {
    return this.props.amountCents;
  }

  get formatted(): string {
    return (this.props.amountCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  public add(other: Money): Money {
    return new Money({
      amountCents: this.props.amountCents + other.amountCents,
    });
  }

  public static fromCents(cents: number): Result<Money, Error> {
    if (typeof cents !== "number" || isNaN(cents) || cents < 0) {
      return Result.fail(new Error("Valor monetário em centavos inválido."));
    }
    return Result.ok(new Money({ amountCents: Math.round(cents) }));
  }

  public static zero(): Money {
    return new Money({ amountCents: 0 });
  }
}

