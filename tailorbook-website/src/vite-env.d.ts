/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APK_DOWNLOAD_URL: string
  readonly VITE_FOUNDING_MEMBER_URL: string
  readonly VITE_CONTACT_EMAIL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
