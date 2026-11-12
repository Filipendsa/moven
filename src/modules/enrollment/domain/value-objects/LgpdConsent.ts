import { ValueObject } from "@/shared/domain/ValueObject";
import { Result } from "@/shared/domain/Result";

interface LgpdConsentProps {
  accepted: boolean;
  acceptedAt: Date;
  policyVersion: string;
}

export class LgpdConsent extends ValueObject<LgpdConsentProps> {
  private constructor(props: LgpdConsentProps) {
    super(props);
  }

  get accepted(): boolean {
    return this.props.accepted;
  }

  get acceptedAt(): Date {
    return this.props.acceptedAt;
  }

  get policyVersion(): string {
    return this.props.policyVersion;
  }

  public static create(
    accepted: boolean,
    policyVersion: string = "2026.1",
    acceptedAt?: Date
  ): Result<LgpdConsent, Error> {
    if (!accepted) {
      return Result.fail(
        new Error(
          "É necessário concordar com a Política de Privacidade e Termos de Uso."
        )
      );
    }

    return Result.ok(
      new LgpdConsent({
        accepted: true,
        acceptedAt: acceptedAt || new Date(),
        policyVersion,
      })
    );
  }
}

