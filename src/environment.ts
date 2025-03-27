import { z } from "zod";
import { type IAgentRuntime } from "@elizaos/core";

// Define the schema for plugin config
export const puppeteerConfigSchema = z.object({
    PROXY_SERVER: z.string().optional().nullable(),
    USER_AGENT: z.string().optional().nullable(),
    HEADLESS: z.boolean().default(true),
    STEALTH_MODE: z.boolean().default(true)
});

export type PuppeteerConfig = z.infer<typeof puppeteerConfigSchema>;

// Helper function to get settings with validation
export function getPuppeteerConfig(runtime: IAgentRuntime): PuppeteerConfig {
    // Get settings from runtime
    const proxyServer = runtime.getSetting("PROXY_SERVER");
    const userAgent = runtime.getSetting("USER_AGENT");
    const headless = runtime.getSetting("HEADLESS") !== "false";
    const stealthMode = runtime.getSetting("STEALTH_MODE") !== "false";

    // Parse and validate config
    return puppeteerConfigSchema.parse({
        PROXY_SERVER: proxyServer || undefined,
        USER_AGENT: userAgent || undefined,
        HEADLESS: headless,
        STEALTH_MODE: stealthMode
    });
}
