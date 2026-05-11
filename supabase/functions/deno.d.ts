// Stub declarations so the VS Code TS service stops flagging Deno-specific
// imports and globals in this directory. Real type-checking happens via
// `supabase functions deploy` (which invokes Deno) — these files never run
// in Node.

declare module 'https://deno.land/std@*/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://deno.land/std@*/*' {
  const anyExport: any;
  export = anyExport;
}

declare module 'https://esm.sh/*' {
  const anyExport: any;
  export = anyExport;
  export default anyExport;
}

declare module 'https://*' {
  const anyExport: any;
  export = anyExport;
  export default anyExport;
}

// Subset of the Deno global used by these functions.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
  };
  // Add more members as needed; intentionally narrow to avoid pulling the
  // whole Deno typings surface into our Node-flavoured tsconfig.
};
