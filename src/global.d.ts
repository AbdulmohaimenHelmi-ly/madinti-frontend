// Global type declarations for custom HTML elements used in this project.

declare namespace JSX {
  interface IntrinsicElements {
    "altcha-widget": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        challengeurl?: string;
        name?: string;
        hidefooter?: boolean | string;
        floating?: string;
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
}
