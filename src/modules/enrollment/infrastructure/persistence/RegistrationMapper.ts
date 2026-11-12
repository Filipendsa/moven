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
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export interface RegistrationPersistenceRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  modality: string;
  mission_id?: string | null;
  amount_cents: number;
  payment_provider: string;
  payment_status: string;
  external_tx_id: string | null;
  terms_accepted_at: string;
  terms_version: string;
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
      amount_cents: registration.amount.amountCents,
      payment_provider: registration.paymentProvider,
      payment_status: registration.paymentStatus,
      external_tx_id: registration.externalTxId || null,
      terms_accepted_at: registration.lgpdConsent.acceptedAt.toISOString(),
      terms_version: registration.lgpdConsent.policyVersion,
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

    const props: RegistrationProps = {
      fullName: row.full_name,
      email: emailResult.value,
      phone: phoneResult.value,
      cpf: cpfResult.value,
      modality: modalityResult.value,
      missionId: row.mission_id || undefined,
      amount: amountResult.value,
      paymentProvider: row.payment_provider as PaymentProvider,
      paymentStatus: row.payment_status as PaymentStatus,
      externalTxId: row.external_tx_id || undefined,
      lgpdConsent: lgpdResult.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return Registration.reconstitute(props, row.id);
  }
}
