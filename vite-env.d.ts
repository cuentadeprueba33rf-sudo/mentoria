// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Add process definition for compatibility with the app's use of process.env
declare var process: {
  env: {
    [key: string]: string | undefined
  }
}
