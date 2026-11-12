import { Entity } from "@/shared/domain/Entity";
import { Result } from "@/shared/domain/Result";
import { Cpf } from "../value-objects/Cpf";
import { Email } from "../value-objects/Email";
import { BrazilianPhone } from "../value-objects/BrazilianPhone";
import { EnrollmentModality } from "../value-objects/EnrollmentModality";
import { LgpdConsent } from "../value-objects/LgpdConsent";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export type PaymentStatus = "PENDING" | "PAID" | "CANCELED";
export type PaymentProvider = "EVEN3" | "INFINITEPAY";

export interface RegistrationProps {
  fullName: string;
  email: Email;
  phone: BrazilianPhone;
  cpf: Cpf;
  modality: EnrollmentModality;
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

  // Comportamentos e Invariantes de Negócio (Domínio Rico)
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

  // Factory Method para novas inscrições
  public static enroll(params: {
    fullName: string;
    email: Email;
    phone: BrazilianPhone;
    cpf: Cpf;
    modality: EnrollmentModality;
    amount: Money;
    paymentProvider: PaymentProvider;
    lgpdConsent: LgpdConsent;
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
          amount: params.amount,
          paymentProvider: params.paymentProvider,
          paymentStatus: "PENDING",
          lgpdConsent: params.lgpdConsent,
          createdAt: now,
          updatedAt: now,
        },
        params.id
      )
    );
  }

  // Reconstituição a partir do banco de dados (Data Mapper)
  public static reconstitute(
    props: RegistrationProps,
    id: string
  ): Registration {
    return new Registration(props, id);
  }
}

