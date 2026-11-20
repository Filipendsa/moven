import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

export type ShirtSizeType = "PP" | "P" | "M" | "G" | "GG" | "XG";

export const ALLOWED_SHIRT_SIZES: readonly ShirtSizeType[] = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "XG",
] as const;

interface ShirtSizeProps {
  size: ShirtSizeType;
}

export class ShirtSize extends ValueObject<ShirtSizeProps> {
  private constructor(props: ShirtSizeProps) {
    super(props);
  }

  get value(): ShirtSizeType {
    return this.props.size;
  }

  public static create(raw?: string | null): Result<ShirtSize, Error> {
    const normalized = (raw || "").trim().toUpperCase();

    if (!ALLOWED_SHIRT_SIZES.includes(normalized as ShirtSizeType)) {
      return Result.fail(
        new Error(
          "Tamanho de camisa inválido. Selecione entre PP, P, M, G, GG ou XG."
        )
      );
    }

    return Result.ok(new ShirtSize({ size: normalized as ShirtSizeType }));
  }

  public static createOrDefault(
    raw?: string | null,
    fallback: ShirtSizeType = "M"
  ): ShirtSize {
    const parsed = ShirtSize.create(raw);
    if (parsed.success) {
      return parsed.value;
    }
    return new ShirtSize({ size: fallback });
  }
}
