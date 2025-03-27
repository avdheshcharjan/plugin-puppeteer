import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import puppeteer, { Browser, Page } from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";
import { IPuppeteerService, ScrapeOptions, SearchOptions, ScrapeResult, SearchResult } from "../types";

export class PuppeteerService extends Service implements IPuppeteerService {
  private browser: Browser | null = null;
  private static _instance: PuppeteerService | null = null;
  protected runtime: IAgentRuntime | null = null;

  static get serviceType(): ServiceType {
    return ServiceType.BROWSER;
  }

  public static getInstance<T extends Service>(): T {
    if (!PuppeteerService._instance) {
      PuppeteerService._instance = new PuppeteerService();
    }
    return PuppeteerService._instance as unknown as T;
  }

  public static register(runtime: IAgentRuntime): void {
    const instance = PuppeteerService.getInstance<PuppeteerService>();
    runtime.registerService(instance);
  }

  public static async initialize(runtime: IAgentRuntime): Promise<void> {
    const instance = PuppeteerService.getInstance<PuppeteerService>();
    await instance.initialize(runtime);
  }

  public override async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    const stealth = runtime.getSetting("puppeteer.stealth") === "true";

    if (stealth) {
      const puppeteerExtra = require("puppeteer-extra");
      puppeteerExtra.use(StealthPlugin());
      this.browser = await puppeteerExtra.launch({
        headless: true,
        args: ["--no-sandbox"],
      });
    } else {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
      });
    }
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      await this.initialize(this.runtime!);
    }
    return this.browser!;
  }

  async getPage(): Promise<Page> {
    const browser = await this.getBrowser();
    return await browser.newPage();
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const page = await this.getPage();
    try {
      if (options.proxy) {
        await page.setExtraHTTPHeaders({ 'Proxy-Authorization': options.proxy });
      }
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }

      await page.goto(url, { 
        waitUntil: "networkidle0",
        timeout: options.timeout || 30000
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector);
      }

      const content = await page.content();
      const $ = cheerio.load(content);

      const result: ScrapeResult = {
        title: $("title").text() || $("h1").first().text() || "",
        description: $('meta[name="description"]').attr("content") || "",
        content: $("body").text(),
        url: url,
        timestamp: new Date().toISOString()
      };

      return result;
    } finally {
      await page.close();
    }
  }

  async scrapeWithSelectors(
    url: string, 
    selectors: Record<string, string>, 
    options: ScrapeOptions = {}
  ): Promise<Record<string, string | string[]>> {
    const page = await this.getPage();
    try {
      if (options.proxy) {
        await page.setExtraHTTPHeaders({ 'Proxy-Authorization': options.proxy });
      }
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }

      await page.goto(url, { 
        waitUntil: "networkidle0",
        timeout: options.timeout || 30000
      });

      const content = await page.content();
      const $ = cheerio.load(content);
      const result: Record<string, string | string[]> = {};

      for (const [key, selector] of Object.entries(selectors)) {
        const elements = $(selector);
        if (elements.length === 1) {
          result[key] = elements.text().trim();
        } else if (elements.length > 1) {
          result[key] = elements.map((_, el) => $(el).text().trim()).get();
        } else {
          result[key] = "";
        }
      }

      return result;
    } finally {
      await page.close();
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const engine = options.engine || "google";
    const numResults = options.numResults || 10;
    const searchUrls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
    };

    const page = await this.getPage();
    try {
      if (options.proxy) {
        await page.setExtraHTTPHeaders({ 'Proxy-Authorization': options.proxy });
      }

      await page.goto(searchUrls[engine], {
        waitUntil: "networkidle0",
        timeout: options.timeout || 30000
      });

      const results: SearchResult[] = [];
      const content = await page.content();
      const $ = cheerio.load(content);

      switch (engine) {
        case "google":
          $("div.g").slice(0, numResults).each((_, el) => {
            const title = $(el).find("h3").text();
            const url = $(el).find("a").first().attr("href") || "";
            const description = $(el).find(".VwiC3b").text();
            if (title && url) {
              results.push({ title, url, description, source: "google" });
            }
          });
          break;

        case "bing":
          $("li.b_algo").slice(0, numResults).each((_, el) => {
            const title = $(el).find("h2").text();
            const url = $(el).find("a").first().attr("href") || "";
            const description = $(el).find(".b_caption p").text();
            if (title && url) {
              results.push({ title, url, description, source: "bing" });
            }
          });
          break;

        case "duckduckgo":
          $("div.result").slice(0, numResults).each((_, el) => {
            const title = $(el).find("h2").text();
            const url = $(el).find("a.result__url").attr("href") || "";
            const description = $(el).find(".result__snippet").text();
            if (title && url) {
              results.push({ title, url, description, source: "duckduckgo" });
            }
          });
          break;
      }

      return results;
    } finally {
      await page.close();
    }
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public async getPageContent(
    url: string,
    runtime: IAgentRuntime
  ): Promise<{ title: string; description: string; bodyContent: string }> {
    if (!this.browser) {
      await this.initialize(runtime);
    }

    const page = await this.browser!.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    const content = await page.content();
    await page.close();

    const $ = cheerio.load(content);
    const title = $("title").text() || "";
    const description = $('meta[name="description"]').attr("content") || "";
    const bodyContent = $("body").text() || "";

    return { title, description, bodyContent };
  }
} 