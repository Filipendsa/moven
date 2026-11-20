export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0.0";

export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT?.trim() || "";

export const APP_VERSION_LABEL = APP_COMMIT
  ? `v${APP_VERSION} (${APP_COMMIT})`
  : `v${APP_VERSION}`;
