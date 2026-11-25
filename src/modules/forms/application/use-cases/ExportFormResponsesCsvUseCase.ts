import { Form } from "../../domain/entities/Form";
import { FormResponseRecord } from "../../domain/entities/FormTypes";

export class ExportFormResponsesCsvUseCase {
  static execute(form: Form, responses: FormResponseRecord[]): string {
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const headers = [
      "ID Resposta",
      "Data/Hora Envio",
      "Idioma",
      ...form.questions.map((q) => q.title),
    ];

    const rows = responses.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.submittedAt.toLocaleString("pt-BR")),
      escapeCsv(r.locale),
      ...form.questions.map((q) => {
        const val = r.answers[q.id];
        if (Array.isArray(val)) return escapeCsv(val.join(", "));
        return escapeCsv(val ?? "");
      }),
    ]);

    return (
      "\uFEFF" +
      [headers.map(escapeCsv).join(";"), ...rows.map((r) => r.join(";"))].join(
        "\r\n"
      )
    );
  }
}
