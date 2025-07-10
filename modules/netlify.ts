import { defineNuxtModule } from "@nuxt/kit";
import process from "node:process";

import { NetlifyDev } from "@netlify/dev";
import type { Features } from "@netlify/dev";
import { netlifyCommand } from "@netlify/dev-utils";
import { defineLazyEventHandler, fromNodeMiddleware } from "h3";
import type { ServerResponse } from "node:http";

// Module options TypeScript interface definition
export interface NetlifyModuleOptions extends Features {
  /**
   * Attach a Vite middleware that intercepts requests and handles them in the
   * same way as the Netlify production environment (default: true).
   */
  middleware?: boolean;
}

export default defineNuxtModule<NetlifyModuleOptions>({
  meta: {
    name: "@netlify/nuxt",
    configKey: "netlify",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    middleware: true,
  },
  async setup(options, nuxt) {
    // If we're already running inside the Netlify CLI, there is no need to run
    // the plugin, as the environment will already be configured.
    if (process.env.NETLIFY_DEV || !nuxt.options.dev) {
      return;
    }

    const logger = console;
    const { blobs, edgeFunctions, functions, middleware, redirects } = options;

    let netlifyDev: NetlifyDev | undefined;

    nuxt.hook("nitro:init", async (nitro) => {
      netlifyDev = new NetlifyDev({
        blobs,
        edgeFunctions,
        functions,
        logger,
        redirects,
        serverAddress: null,
        projectRoot: nuxt.options.rootDir,
        staticFiles: {
          ...options.staticFiles,
          directories: nitro.options.publicAssets.map((d) => d.dir),
        },
      });

      await netlifyDev.start();

      nuxt.hook("close", () => {
        netlifyDev?.stop();
      });

      if (!netlifyDev?.siteIsLinked) {
        logger.log(
          `💭 Linking this project to a Netlify site lets you deploy your site, use any environment variables defined on your team and site and much more. Run ${netlifyCommand("npx netlify init")} to get started.`,
        );
      }

      logger.log("Environment loaded");
    });

    if (middleware) {
      nuxt.options.nitro.devHandlers ||= [];
      nuxt.options.nitro.devHandlers.push({
        handler: defineLazyEventHandler(() => {
          logger.log(
            `Middleware loaded. Emulating features: ${netlifyDev?.getEnabledFeatures().join(", ")}.`,
          );
          return fromNodeMiddleware(
            async function netlifyPreMiddleware(nodeReq, nodeRes, next) {
              if (!netlifyDev) {
                return;
              }
              const headers: Record<string, string> = {};
              const result = await netlifyDev.handleAndIntrospectNodeRequest(
                nodeReq,
                {
                  headersCollector: (key, value) => {
                    headers[key] = value;
                  },
                  serverAddress: `http://localhost:${nodeReq.socket.localPort}`,
                },
              );

              const isStaticFile = result?.type === "static";

              // Don't serve static matches. Let the Vite server handle them.
              if (result && !isStaticFile) {
                fromWebResponse(result.response, nodeRes);

                return;
              }

              for (const key in headers) {
                nodeRes.setHeader(key, headers[key] || '');
              }

              next();
            },
          );
        }),
      });
    }
  },
});

const fromWebResponse = async (webRes: Response, res: ServerResponse) => {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  if (webRes.body) {
    const reader = webRes.body.getReader();
    const writer = res;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      writer.write(value);
    }
  }

  res.end();
};
