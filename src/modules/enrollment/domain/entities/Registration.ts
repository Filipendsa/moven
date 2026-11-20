import { Entity } from "@/shared/domain/Entity";
import { Result } from "@/shared/domain/Result";
import { Cpf } from "../value-objects/Cpf";
import { Email } from "../value-objects/Email";
import { BrazilianPhone } from "../value-objects/BrazilianPhone";
import { EnrollmentModality } from "../value-objects/EnrollmentModality";
import { LgpdConsent } from "../value-objects/LgpdConsent";
import { ShirtSize } from "../value-objects/ShirtSize";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export type PaymentStatus = "PENDING" | "PAID" | "WAITLIST" | "CANCELED";
export type PaymentProvider = "EVEN3" | "INFINITEPAY" | "PIX";

export interface RegistrationProps {
  fullName: string;
  email: Email;
  phone: BrazilianPhone;
  cpf: Cpf;
  modality: EnrollmentModality;
  missionId?: string;
  shirtSize: ShirtSize;
  amount: Money;
  paymentProvider: PaymentProvider;
  paymentStatus: PaymentStatus;
  externalTxId?: string;
  lgpdConsent: LgpdConsent;
  createdAt: Date;
  updatedAt: Date;
}

export class Registration extends Entity<RegistrationProps> {
  private constructor(props: RegistrationProps, id?: string) {
    super(props, id);
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): BrazilianPhone {
    return this.props.phone;
  }

  get cpf(): Cpf {
    return this.props.cpf;
  }

  get modality(): EnrollmentModality {
    return this.props.modality;
  }

  get missionId(): string | undefined {
    return this.props.missionId;
  }

  get shirtSize(): ShirtSize {
    return this.props.shirtSize;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get paymentProvider(): PaymentProvider {
    return this.props.paymentProvider;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  get externalTxId(): string | undefined {
    return this.props.externalTxId;
  }

  get lgpdConsent(): LgpdConsent {
    return this.props.lgpdConsent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isPaid(): boolean {
    return this.props.paymentStatus === "PAID";
  }

  get isPending(): boolean {
    return this.props.paymentStatus === "PENDING";
  }

  get isWaitlist(): boolean {
    return this.props.paymentStatus === "WAITLIST";
  }

  public confirmPayment(externalTxId?: string): Result<void, Error> {
    if (this.props.paymentStatus === "CANCELED") {
      return Result.fail(
        new Error("Não é possível confirmar pagamento de uma inscrição cancelada.")
      );
    }

    this.props.paymentStatus = "PAID";
    if (externalTxId) {
      this.props.externalTxId = externalTxId;
    }
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public promoteFromWaitlist(): Result<void, Error> {
    if (this.props.paymentStatus !== "WAITLIST") {
      return Result.fail(
        new Error("Apenas inscrições na lista de espera podem ser promovidas.")
      );
    }
    this.props.paymentStatus = "PENDING";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public markAsPending(): Result<void, Error> {
    this.props.paymentStatus = "PENDING";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public cancel(): Result<void, Error> {
    this.props.paymentStatus = "CANCELED";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public cancelByParticipant(): Result<void, Error> {
    if (this.props.paymentStatus === "PAID") {
      return Result.fail(
        new Error(
          "Inscrição já paga só pode ser cancelada através do sistema administrativo."
        )
      );
    }
    if (this.props.paymentStatus === "CANCELED") {
      return Result.fail(new Error("Esta inscrição já está cancelada."));
    }
    this.props.paymentStatus = "CANCELED";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public changeEnrollmentSelection(params: {
    modality: EnrollmentModality;
    missionId?: string;
    amount: Money;
    nextStatus: "PENDING" | "WAITLIST";
  }): Result<void, Error> {
    if (this.props.paymentStatus === "PAID") {
      return Result.fail(
        new Error(
          "Inscrição já paga só pode ser alterada ou cancelada através do sistema administrativo."
        )
      );
    }
    if (this.props.paymentStatus === "CANCELED") {
      return Result.fail(
        new Error("Não é possível alterar uma inscrição cancelada.")
      );
    }

    this.props.modality = params.modality;
    this.props.missionId = params.modality.includesAmazonasMission
      ? params.missionId
      : undefined;
    this.props.amount = params.amount;
    this.props.paymentStatus = params.nextStatus;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public adminUpdateEnrollment(params: {
    modality?: EnrollmentModality;
    missionId?: string;
    amount?: Money;
    shirtSize?: ShirtSize;
    status?: PaymentStatus;
  }): Result<void, Error> {
    if (params.modality) {
      this.props.modality = params.modality;
      this.props.missionId = params.modality.includesAmazonasMission
        ? params.missionId
        : undefined;
    } else if (params.missionId !== undefined && this.props.modality.includesAmazonasMission) {
      this.props.missionId = params.missionId || undefined;
    }

    if (params.amount) {
      this.props.amount = params.amount;
    }

    if (params.shirtSize) {
      this.props.shirtSize = params.shirtSize;
    }

    if (params.status) {
      this.props.paymentStatus = params.status;
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public changeShirtSize(newSize: ShirtSize): Result<void, Error> {
    if (this.props.paymentStatus === "CANCELED") {
      return Result.fail(
        new Error("Não é possível alterar a camisa de uma inscrição cancelada.")
      );
    }
    this.props.shirtSize = newSize;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public static enroll(params: {
    fullName: string;
    email: Email;
    phone: BrazilianPhone;
    cpf: Cpf;
    modality: EnrollmentModality;
    missionId?: string;
    shirtSize: ShirtSize;
    amount: Money;
    paymentProvider: PaymentProvider;
    lgpdConsent: LgpdConsent;
    initialStatus?: "PENDING" | "WAITLIST";
    id?: string;
  }): Result<Registration, Error> {
    if (!params.fullName || params.fullName.trim().length < 3) {
      return Result.fail(
        new Error("Nome completo deve ter pelo menos 3 caracteres.")
      );
    }

    const now = new Date();

    return Result.ok(
      new Registration(
        {
          fullName: params.fullName.trim(),
          email: params.email,
          phone: params.phone,
          cpf: params.cpf,
          modality: params.modality,
          missionId: params.missionId,
          shirtSize: params.shirtSize,
          amount: params.amount,
          paymentProvider: params.paymentProvider,
          paymentStatus: params.initialStatus || "PENDING",
          lgpdConsent: params.lgpdConsent,
          createdAt: now,
          updatedAt: now,
        },
        params.id
      )
    );
  }

  public static reconstitute(
    props: RegistrationProps,
    id: string
  ): Registration {
    return new Registration(props, id);
  }
}
