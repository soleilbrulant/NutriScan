declare module 'lucide-react/dist/esm/icons/*' {
  const content: any;
  export default content;
}

declare module 'lucide-react/dist/cjs/icons/*' {
  const content: any;
  export default content;
}

// The main package exports named React components. Provide a fallback typing
// that allows both named and default imports to work without strict types.
declare module 'lucide-react' {
  import * as React from 'react';

  type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

  const anyExport: { [key: string]: React.FC<IconProps> } & React.FC<IconProps>;
  export = anyExport;
}
