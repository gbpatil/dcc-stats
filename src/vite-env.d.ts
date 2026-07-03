/// <reference types="vite/client" />

// Strongly-typed environment variables (augments Vite's ImportMetaEnv).
// These are PUBLIC, client-safe values — data is protected by Supabase RLS.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [className: string]: string };
  export default classes;
}
