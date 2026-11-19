import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // `npm run build` runs OpenNext, which runs the plain Next.js build itself (so it doesn't call itself again).
  buildCommand: "npx next build",
};
