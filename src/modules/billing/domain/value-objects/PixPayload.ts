import { ValueObject } from "@/shared/domain/ValueObject";

interface PixPayloadProps {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  description: string;
  txId: string;
  copyPasteCode: string;
}

export class PixPayload extends ValueObject<PixPayloadProps> {
  private constructor(props: PixPayloadProps) {
    super(props);
  }

  get copyPasteCode(): string {
    return this.props.copyPasteCode;
  }

  get description(): string {
    return this.props.description;
  }

  private static sanitizeAscii(text: string, maxLen: number): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s.%/-]/g, "")
      .trim()
      .slice(0, maxLen);
  }

  private static tlv(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  }

  private static crc16(payload: string): string {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  public static create(params: {
    pixKey: string;
    amountCents: number;
    description: string;
    txId: string;
    merchantName?: string;
    merchantCity?: string;
  }): PixPayload {
    const cleanKey = params.pixKey.trim();
    const merchantName = this.sanitizeAscii(
      params.merchantName || "MOVEN UNASP HT",
      25
    ).toUpperCase();
    const merchantCity = this.sanitizeAscii(
      params.merchantCity || "HORTOLANDIA",
      15
    ).toUpperCase();
    const cleanDesc = this.sanitizeAscii(params.description, 50);
    const cleanTxId =
      params.txId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "MOVEN";

    const amountStr = (params.amountCents / 100).toFixed(2);

    const merchantAccountInfo = [
      this.tlv("00", "br.gov.bcb.pix"),
      this.tlv("01", cleanKey),
      cleanDesc ? this.tlv("02", cleanDesc) : "",
    ].join("");

    const additionalData = this.tlv("05", cleanTxId);

    const payloadWithoutCrc =
      [
        this.tlv("00", "01"),
        this.tlv("26", merchantAccountInfo),
        this.tlv("52", "0000"),
        this.tlv("53", "986"),
        params.amountCents > 0 ? this.tlv("54", amountStr) : "",
        this.tlv("58", "BR"),
        this.tlv("59", merchantName),
        this.tlv("60", merchantCity),
        this.tlv("62", additionalData),
      ].join("") + "6304";

    const checksum = this.crc16(payloadWithoutCrc);
    const copyPasteCode = `${payloadWithoutCrc}${checksum}`;

    return new PixPayload({
      pixKey: cleanKey,
      merchantName,
      merchantCity,
      amountCents: params.amountCents,
      description: params.description,
      txId: cleanTxId,
      copyPasteCode,
    });
  }
}

