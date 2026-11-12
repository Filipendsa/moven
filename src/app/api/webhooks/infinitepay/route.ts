import { NextResponse } from "next/server";
import { ConfirmRegistrationPaymentUseCase } from "@/modules/enrollment/application/use-cases/ConfirmRegistrationPaymentUseCase";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";

const registrationRepo = new SupabaseRegistrationRepository();
const confirmPaymentUseCase = new ConfirmRegistrationPaymentUseCase(
  registrationRepo
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // InfinitePay Webhook Payload Structure
    // Exemplo comum: { order_id: "...", status: "paid" | "approved", transaction_id: "..." }
    const orderId = payload.order_id || payload.data?.order_id;
    const status = (payload.status || payload.data?.status || "").toLowerCase();
    const txId = payload.transaction_id || payload.id || payload.data?.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "order_id não fornecido no webhook." },
        { status: 400 }
      );
    }

    if (
      status === "paid" ||
      status === "approved" ||
      status === "succeeded" ||
      status === "completed"
    ) {
      const result = await confirmPaymentUseCase.execute({
        registrationId: orderId,
        externalTxId: txId,
      });

      if (!result.success) {
        console.error("Falha ao confirmar pagamento via webhook:", result.error);
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Pagamento confirmado com sucesso." });
    }

    return NextResponse.json({
      received: true,
      message: `Status ${status} registrado sem baixa de pagamento.`,
    });
  } catch (err: any) {
    console.error("Webhook InfinitePay error:", err);
    return NextResponse.json(
      { error: "Erro interno no processamento do webhook." },
      { status: 500 }
    );
  }
}

