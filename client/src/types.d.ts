declare module '@markdown-ui/react' {
  export interface MarkdownUIProps {
    html: string;
  }
  export const MarkdownUI: React.FC<MarkdownUIProps>;
}