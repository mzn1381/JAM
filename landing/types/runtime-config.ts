export type RuntimeConfig = {
  iframeSrcDemoB2B?: string;
  iframeSrcDemoB2C?: string;
  apiUrl?: string;
};

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  iframeSrcDemoB2B: "http://localhost:3002/TaskList?mode=demo",
  iframeSrcDemoB2C: "http://localhost:3002/",
  apiUrl: "http://localhost:3000/api",
};
