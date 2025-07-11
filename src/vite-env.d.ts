/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_ACCESS_KEY_ID: string
  readonly VITE_AWS_SECRET_ACCESS_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENSEARCH_DOMAIN: string
  readonly VITE_OPENSEARCH_REGION: string
  readonly VITE_OPENSEARCH_USERNAME: string
  readonly VITE_OPENSEARCH_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}