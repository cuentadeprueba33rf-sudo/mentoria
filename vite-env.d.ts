// Reference to vite/client removed to fix "Cannot find type definition file"
// Global process declaration removed to fix "Cannot redeclare block-scoped variable"

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
