export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Phase 19 — IONOS AI Model Hub
  ionosApiKey: process.env.IONOS_API_KEY ?? "",
  ionosApiUrl: process.env.IONOS_API_URL ?? "https://openai.inference.de-txl.ionos.com",
  // Phase 21 — Agent Dispatch
  asioneCoordApi: process.env.ASIONE ?? "",
  // Phase 23 — GitHub Audit
  githubToken: process.env.GITHUB_TOKEN ?? "",
};
