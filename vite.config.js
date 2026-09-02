import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The Measure feature needs the Anthropic API key, which must never reach the
 * browser. `api/measure.js` is the handler: a plain (req, res) function that
 * works as a Vercel/Netlify serverless function in production and, in dev, is
 * mounted here as middleware so `npm run dev` is the only process you run.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.MEASURE_MODEL) process.env.MEASURE_MODEL = env.MEASURE_MODEL;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "measure-api-dev",
        configureServer(server) {
          server.middlewares.use("/api/measure", async (req, res, next) => {
            try {
              // ssrLoadModule keeps the handler (and the Anthropic SDK it pulls
              // in) out of the config bundle — it's loaded at request time.
              const mod = await server.ssrLoadModule("/api/measure.js");
              await mod.default(req, res);
            } catch (err) {
              next(err);
            }
          });
        },
      },
    ],
  };
});
