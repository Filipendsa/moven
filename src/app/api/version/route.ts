import { NextResponse } from "next/server";
import {
  APP_COMMIT,
  APP_VERSION,
  APP_VERSION_LABEL,
} from "@/shared/config/version";

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    commit: APP_COMMIT || null,
    label: APP_VERSION_LABEL,
  });
}
