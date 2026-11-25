import {
  Registration,
  RegistrationProps,
  PaymentProvider,
  PaymentStatus,
} from "../../domain/entities/Registration";
import { Cpf } from "../../domain/value-objects/Cpf";
import { Email } from "../../domain/value-objects/Email";
import { BrazilianPhone } from "../../domain/value-objects/BrazilianPhone";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { LgpdConsent } from "../../domain/value-objects/LgpdConsent";
import { ShirtSize } from "../../domain/value-objects/ShirtSize";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export interface RegistrationPersistenceRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  modality: string;
  mission_id?: string | null;
  shirt_size?: string | null;
  amount_cents: number;
  original_amount_cents?: number | null;
  discount_cents?: number | null;
  coupon_id?: string | null;
  coupon_code?: string | null;
  payment_provider: string;
  payment_status: string;
  external_tx_id: string | null;
  terms_accepted_at: string;
  terms_version: string;
  welcome_sent_at?: string | null;
  payment_reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class RegistrationMapper {
  public static toPersistence(
    registration: Registration
  ): RegistrationPersistenceRow {
    return {
      id: registration.id,
      full_name: registration.fullName,
      email: registration.email.value,
      phone: registration.phone.digits,
      cpf: registration.cpf.value,
      modality: registration.modality.type,
      mission_id: registration.missionId || null,
      shirt_size: registration.shirtSize.value,
      amount_cents: registration.amount.amountCents,
      original_amount_cents: registration.originalAmount
        ? registration.originalAmount.amountCents
        : null,
      discount_cents: registration.discountCents,
      coupon_id: registration.couponId || null,
      coupon_code: registration.couponCode || null,
      payment_provider: registration.paymentProvider,
      payment_status: registration.paymentStatus,
      external_tx_id: registration.externalTxId || null,
      terms_accepted_at: registration.lgpdConsent.acceptedAt.toISOString(),
      terms_version: registration.lgpdConsent.policyVersion,
      welcome_sent_at: registration.welcomeSentAt
        ? registration.welcomeSentAt.toISOString()
        : null,
      payment_reminder_sent_at: registration.paymentReminderSentAt
        ? registration.paymentReminderSentAt.toISOString()
        : null,
      created_at: registration.createdAt.toISOString(),
      updated_at: registration.updatedAt.toISOString(),
    };
  }

  public static toDomain(row: RegistrationPersistenceRow): Registration {
    const cpfResult = Cpf.create(row.cpf);
    const emailResult = Email.create(row.email);
    const phoneResult = BrazilianPhone.create(row.phone);
    const modalityResult = EnrollmentModality.create(row.modality);
    const amountResult = Money.fromCents(row.amount_cents);
    const lgpdResult = LgpdConsent.create(
      true,
      row.terms_version,
      new Date(row.terms_accepted_at)
    );

    if (
      !cpfResult.success ||
      !emailResult.success ||
      !phoneResult.success ||
      !modalityResult.success ||
      !amountResult.success ||
      !lgpdResult.success
    ) {
      throw new Error(`Erro ao reconstituir Registration id: ${row.id}`);
    }

    const originalAmountResult =
      row.original_amount_cents !== undefined &&
      row.original_amount_cents !== null
        ? Money.fromCents(row.original_amount_cents)
        : null;

    const props: RegistrationProps = {
      fullName: row.full_name,
      email: emailResult.value,
      phone: phoneResult.value,
      cpf: cpfResult.value,
      modality: modalityResult.value,
      missionId: row.mission_id || undefined,
      shirtSize: ShirtSize.createOrDefault(row.shirt_size, "M"),
      amount: amountResult.value,
      originalAmount:
        originalAmountResult && originalAmountResult.success
          ? originalAmountResult.value
          : undefined,
      discountCents: row.discount_cents ?? 0,
      couponId: row.coupon_id || undefined,
      couponCode: row.coupon_code || undefined,
      paymentProvider: row.payment_provider as PaymentProvider,
      paymentStatus: row.payment_status as PaymentStatus,
      externalTxId: row.external_tx_id || undefined,
      lgpdConsent: lgpdResult.value,
      welcomeSentAt: row.welcome_sent_at
        ? new Date(row.welcome_sent_at)
        : undefined,
      paymentReminderSentAt: row.payment_reminder_sent_at
        ? new Date(row.payment_reminder_sent_at)
        : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return Registration.reconstitute(props, row.id);
  }
}
