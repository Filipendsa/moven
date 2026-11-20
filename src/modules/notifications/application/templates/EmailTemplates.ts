import { Locale } from "@/i18n/config";
import {
  PaymentReminderPayload,
  WelcomeNotificationPayload,
} from "../../domain/ports/INotificationGateway";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailLayout(title: string, bodyHtml: string, footerNote: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f5f0e6;font-family:Arial,Helvetica,sans-serif;color:#1b2822;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d9d0be;">
    <div style="background:#072119;color:#e9e1d0;padding:24px 28px;border-bottom:3px solid #8fa66a;">
      <div style="font-size:20px;font-weight:bold;letter-spacing:1.5px;color:#8fa66a;">MOVEN</div>
      <div style="font-size:13px;color:#cfc9b8;margin-top:4px;">${escapeHtml(title)}</div>
    </div>
    <div style="padding:28px;font-size:14px;line-height:1.6;">
      ${bodyHtml}
    </div>
    <div style="background:#f9f6ef;padding:16px 28px;font-size:12px;color:#66706a;border-top:1px solid #e6dfd1;">
      ${escapeHtml(footerNote)}
    </div>
  </div>
</body>
</html>`;
}

const WELCOME_COPY: Record<
  Locale,
  {
    header: string;
    subject: string;
    greeting: (name: string) => string;
    intro: string;
    waitlistNote: string;
    pendingNote: string;
    protocolLabel: string;
    modalityLabel: string;
    shirtLabel: string;
    amountLabel: string;
    paymentLabel: string;
    pixLabel: string;
    cardLabel: string;
    ctaLabel: string;
    accessHint: string;
    footer: string;
  }
> = {
  pt: {
    header: "Núcleo de Missões · Igreja UNASP-HT",
    subject: "Bem-vindo(a) ao MOVEN! Sua inscrição foi registrada",
    greeting: (name) => `Olá, ${name}!`,
    intro:
      "Seja muito bem-vindo(a) ao MOVEN! Ficamos muito felizes com o seu passo em direção à missão.",
    waitlistNote:
      "Sua inscrição foi registrada na Lista de Espera. Assim que novas vagas forem liberadas, nossa liderança entrará em contato.",
    pendingNote:
      "Seu pré-cadastro foi registrado e está aguardando a confirmação do pagamento.",
    protocolLabel: "Protocolo",
    modalityLabel: "Modalidade",
    shirtLabel: "Camisa",
    amountLabel: "Valor",
    paymentLabel: "Pagamento",
    pixLabel: "Pix Direto",
    cardLabel: "Cartão / Parcelado",
    ctaLabel: "Acessar Área do Missionário",
    accessHint:
      "Para entrar na Área do Missionário, utilize seu e-mail cadastrado e os 4 últimos dígitos do seu CPF.",
    footer: "MOVEN · Movidos pelo amor. Enviados para servir.",
  },
  en: {
    header: "Mission Hub · UNASP-HT Church",
    subject: "Welcome to MOVEN! Your enrollment has been registered",
    greeting: (name) => `Hello, ${name}!`,
    intro:
      "Welcome to MOVEN! We are excited about your step toward serving in missions.",
    waitlistNote:
      "Your enrollment has been placed on the Waitlist. Our leadership will contact you as soon as spots open.",
    pendingNote:
      "Your pre-registration is saved and awaiting payment confirmation.",
    protocolLabel: "Protocol",
    modalityLabel: "Modality",
    shirtLabel: "T-Shirt",
    amountLabel: "Amount",
    paymentLabel: "Payment",
    pixLabel: "Direct Pix",
    cardLabel: "Card / Installments",
    ctaLabel: "Open Missionary Area",
    accessHint:
      "To sign in to the Missionary Area, enter your registered email and the last 4 digits of your CPF.",
    footer: "MOVEN · Moved by love. Sent to serve.",
  },
  es: {
    header: "Núcleo de Misiones · Iglesia UNASP-HT",
    subject: "¡Bienvenido(a) a MOVEN! Tu inscripción fue registrada",
    greeting: (name) => `¡Hola, ${name}!`,
    intro:
      "¡Bienvenido(a) a MOVEN! Nos alegra mucho tu paso hacia el servicio misionero.",
    waitlistNote:
      "Tu inscripción fue registrada en la Lista de Espera. En cuanto se liberen cupos, nuestro liderazgo se pondrá en contacto.",
    pendingNote:
      "Tu prerregistro fue guardado y está esperando la confirmación del pago.",
    protocolLabel: "Protocolo",
    modalityLabel: "Modalidad",
    shirtLabel: "Camiseta",
    amountLabel: "Valor",
    paymentLabel: "Pago",
    pixLabel: "Pix Directo",
    cardLabel: "Tarjeta / Cuotas",
    ctaLabel: "Ingresar al Área del Misionero",
    accessHint:
      "Para ingresar al Área del Misionero, usa tu correo registrado y los últimos 4 dígitos de tu CPF.",
    footer: "MOVEN · Movidos por el amor. Enviados para servir.",
  },
};

const REMINDER_COPY: Record<
  Locale,
  {
    header: string;
    subject: string;
    greeting: (name: string) => string;
    intro: string;
    details: string;
    ctaLabel: string;
    whatsappLabel: string;
    alreadyPaidHint: string;
    footer: string;
  }
> = {
  pt: {
    header: "Lembrete de Pagamento · MOVEN",
    subject: "Lembrete MOVEN: sua inscrição aguarda confirmação de pagamento",
    greeting: (name) => `Olá, ${name}!`,
    intro:
      "Passando para lembrar com carinho que sua inscrição no MOVEN foi feita há 7 dias e ainda consta como pendente de pagamento.",
    details:
      "Acesse a Área do Missionário (com seu e-mail e os 4 últimos dígitos do CPF) para visualizar os dados do Pix/Cartão ou ajustar sua inscrição.",
    ctaLabel: "Acessar Área do Missionário",
    whatsappLabel: "Enviar Comprovante no WhatsApp",
    alreadyPaidHint:
      "Caso já tenha realizado o pagamento, envie o comprovante pelo botão acima para confirmarmos sua vaga.",
    footer: "MOVEN · Movidos pelo amor. Enviados para servir.",
  },
  en: {
    header: "Payment Reminder · MOVEN",
    subject: "MOVEN Reminder: your enrollment is awaiting payment confirmation",
    greeting: (name) => `Hello, ${name}!`,
    intro:
      "This is a friendly reminder that your MOVEN enrollment was submitted 7 days ago and is still awaiting payment confirmation.",
    details:
      "Open the Missionary Area (with your email and the last 4 digits of your CPF) to view your Pix/Card details or manage your enrollment.",
    ctaLabel: "Open Missionary Area",
    whatsappLabel: "Send Receipt on WhatsApp",
    alreadyPaidHint:
      "If you have already paid, please send your receipt using the button above so we can confirm your spot.",
    footer: "MOVEN · Moved by love. Sent to serve.",
  },
  es: {
    header: "Recordatorio de Pago · MOVEN",
    subject: "Recordatorio MOVEN: tu inscripción espera confirmación de pago",
    greeting: (name) => `¡Hola, ${name}!`,
    intro:
      "Te recordamos con cariño que tu inscripción en MOVEN se realizó hace 7 días y aún figura pendiente de pago.",
    details:
      "Ingresa al Área del Misionero (con tu correo y los 4 últimos dígitos de tu CPF) para ver los datos de Pix/Tarjeta o gestionar tu inscripción.",
    ctaLabel: "Ingresar al Área del Misionero",
    whatsappLabel: "Enviar Comprobante por WhatsApp",
    alreadyPaidHint:
      "Si ya realizaste el pago, envía tu comprobante con el botón de arriba para confirmar tu lugar.",
    footer: "MOVEN · Movidos por el amor. Enviados para servir.",
  },
};

export function buildWelcomeEmail(
  payload: WelcomeNotificationPayload
): RenderedEmail {
  const locale = payload.locale || "pt";
  const c = WELCOME_COPY[locale] || WELCOME_COPY.pt;
  const firstName = payload.fullName.split(" ")[0] || payload.fullName;
  const paymentMethodLabel =
    payload.paymentMethod === "PIX" ? c.pixLabel : c.cardLabel;
  const modalityDisplay = payload.missionTitle
    ? `${payload.modalityTitle} (${payload.missionTitle})`
    : payload.modalityTitle;

  const statusLine = payload.isWaitlist ? c.waitlistNote : c.pendingNote;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;font-weight:bold;">${escapeHtml(c.greeting(firstName))}</p>
    <p style="margin:0 0 12px;">${escapeHtml(c.intro)}</p>
    <p style="margin:0 0 18px;">${escapeHtml(statusLine)}</p>
    <div style="background:#f5f0e6;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #e0d7c5;">
      <p style="margin:4px 0;"><strong>${escapeHtml(c.protocolLabel)}:</strong> #${escapeHtml(payload.protocol)}</p>
      <p style="margin:4px 0;"><strong>${escapeHtml(c.modalityLabel)}:</strong> ${escapeHtml(modalityDisplay)}</p>
      <p style="margin:4px 0;"><strong>${escapeHtml(c.shirtLabel)}:</strong> ${escapeHtml(payload.shirtSize)}</p>
      <p style="margin:4px 0;"><strong>${escapeHtml(c.amountLabel)}:</strong> ${escapeHtml(payload.amountFormatted)}</p>
      <p style="margin:4px 0;"><strong>${escapeHtml(c.paymentLabel)}:</strong> ${escapeHtml(paymentMethodLabel)}</p>
    </div>
    <p style="margin:0 0 16px;">
      <a href="${escapeHtml(payload.missionaryAreaUrl)}" style="display:inline-block;background:#8fa66a;color:#072119;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">
        ${escapeHtml(c.ctaLabel)}
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:#66706a;">${escapeHtml(c.accessHint)}</p>
  `;

  const text = [
    c.greeting(firstName),
    c.intro,
    statusLine,
    `${c.protocolLabel}: #${payload.protocol}`,
    `${c.modalityLabel}: ${modalityDisplay}`,
    `${c.shirtLabel}: ${payload.shirtSize}`,
    `${c.amountLabel}: ${payload.amountFormatted}`,
    `${c.paymentLabel}: ${paymentMethodLabel}`,
    `${c.ctaLabel}: ${payload.missionaryAreaUrl}`,
    c.accessHint,
  ].join("\n\n");

  return {
    subject: c.subject,
    html: wrapEmailLayout(c.header, bodyHtml, c.footer),
    text,
  };
}

export function buildPaymentReminderEmail(
  payload: PaymentReminderPayload
): RenderedEmail {
  const locale = payload.locale || "pt";
  const c = REMINDER_COPY[locale] || REMINDER_COPY.pt;
  const firstName = payload.fullName.split(" ")[0] || payload.fullName;
  const modalityDisplay = payload.missionTitle
    ? `${payload.modalityTitle} (${payload.missionTitle})`
    : payload.modalityTitle;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;font-weight:bold;">${escapeHtml(c.greeting(firstName))}</p>
    <p style="margin:0 0 12px;">${escapeHtml(c.intro)}</p>
    <div style="background:#f5f0e6;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #e0d7c5;">
      <p style="margin:4px 0;"><strong>Protocolo:</strong> #${escapeHtml(payload.protocol)}</p>
      <p style="margin:4px 0;"><strong>Modalidade:</strong> ${escapeHtml(modalityDisplay)}</p>
      <p style="margin:4px 0;"><strong>Valor:</strong> ${escapeHtml(payload.amountFormatted)}</p>
    </div>
    <p style="margin:0 0 18px;">${escapeHtml(c.details)}</p>
    <div style="margin-bottom:16px;">
      <a href="${escapeHtml(payload.missionaryAreaUrl)}" style="display:inline-block;background:#8fa66a;color:#072119;font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:999px;margin-right:8px;margin-bottom:8px;">
        ${escapeHtml(c.ctaLabel)}
      </a>
      <a href="${escapeHtml(payload.receiptWhatsappUrl)}" style="display:inline-block;background:#072119;color:#e9e1d0;font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:999px;margin-bottom:8px;">
        ${escapeHtml(c.whatsappLabel)}
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#66706a;">${escapeHtml(c.alreadyPaidHint)}</p>
  `;

  const text = [
    c.greeting(firstName),
    c.intro,
    `Protocolo: #${payload.protocol} | ${modalityDisplay} | ${payload.amountFormatted}`,
    c.details,
    `${c.ctaLabel}: ${payload.missionaryAreaUrl}`,
    `${c.whatsappLabel}: ${payload.receiptWhatsappUrl}`,
    c.alreadyPaidHint,
  ].join("\n\n");

  return {
    subject: c.subject,
    html: wrapEmailLayout(c.header, bodyHtml, c.footer),
    text,
  };
}
