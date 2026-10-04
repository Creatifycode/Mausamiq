/// <reference types="vite/client" />

/**
 * Typed access to the Vite environment variables this project reads.
 *
 * `vite/client` already types `import.meta.env`, but only through an index
 * signature, so an undeclared `VITE_*` key would resolve to `any`. Declaring the
 * ones the app actually reads keeps them type-checked.
 *
 * `VITE_API_BASE_URL` is deliberately OPTIONAL: it is absent during local
 * development, where src/services/weatherApi.ts falls back to
 * http://localhost:5000, and set in `.env.production` for the deployed backend.
 *
 * SECURITY: Vite inlines every `VITE_*` value into the client bundle, so nothing
 * declared here may be a secret. These are public values by definition.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
