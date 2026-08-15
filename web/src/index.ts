import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 3000,
  reusePort: true,
  routes: {
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
