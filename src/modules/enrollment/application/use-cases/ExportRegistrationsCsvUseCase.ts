import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { Registration } from "../../domain/entities/Registration";

export class ExportRegistrationsCsvUseCase {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async execute(): Promise<string> {
    const list = await this.registrationRepo.list();

    const headers = [
      "ID",
      "Nome Completo",
      "E-mail",
      "WhatsApp/Telefone",
      "CPF",
      "Modalidade",
      "Valor (R$)",
      "Provedor",
      "Status Pagamento",
      "ID Transacao Externa",
      "Data Inscricao",
      "Aceite LGPD",
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((reg: Registration) => [
      escapeCsv(reg.id),
      escapeCsv(reg.fullName),
      escapeCsv(reg.email.value),
      escapeCsv(reg.phone.formatted),
      escapeCsv(reg.cpf.formatted),
      escapeCsv(reg.modality.title),
      escapeCsv((reg.amount.amountCents / 100).toFixed(2).replace(".", ",")),
      escapeCsv(reg.paymentProvider),
      escapeCsv(reg.paymentStatus),
      escapeCsv(reg.externalTxId || ""),
      escapeCsv(reg.createdAt.toLocaleString("pt-BR")),
      escapeCsv(reg.lgpdConsent.acceptedAt.toLocaleString("pt-BR")),
    ]);

    // Inclui UTF-8 BOM (\uFEFF) para garantir acentuação correta no Microsoft Excel
    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    return csvContent;
  }
}

