/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth client used only to ask an admin for a short-lived Drive upload token — see src/lib/googleUpload.ts. */
  readonly VITE_GOOGLE_UPLOAD_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
