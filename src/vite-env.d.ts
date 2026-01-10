/// <reference types="vite/client" />

// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [className: string]: string };
  export default classes;
}
