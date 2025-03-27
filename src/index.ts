import { type Plugin } from "@elizaos/core";
import { puppeteerWebSearch } from "./actions/webSearch";
import { PuppeteerService } from "./services/puppeteerService";

// Export individual components for selective importing
export { puppeteerWebSearch } from "./actions/webSearch";
export { PuppeteerService, ServiceType } from "./services/puppeteerService";
export * from "./types";

// Create a service instance
const puppeteerService = new PuppeteerService();

// Export the plugin object as default export
export const puppeteerPlugin: Plugin = {
    name: "plugin-puppeteer",
    description: "A plugin that provides web search capabilities and automation using Puppeteer",
    actions: [puppeteerWebSearch],
    services: [puppeteerService]
};

export default puppeteerPlugin; 