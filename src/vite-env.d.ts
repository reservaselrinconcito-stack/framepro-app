/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_VERSION_CHECK_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
