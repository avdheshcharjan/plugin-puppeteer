import { Service } from "@elizaos/core";
import { Browser, Page } from "puppeteer";

export interface IPuppeteerService extends Service {
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
  scrapeWithSelectors(url: string, selectors: Record<string, string>, options?: ScrapeOptions): Promise<Record<string, string | string[]>>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getBrowser(): Promise<Browser>;
  getPage(): Promise<Page>;
}

export interface ScrapeOptions {
  timeout?: number;
  waitForSelector?: string;
  proxy?: string;
  userAgent?: string;
  stealth?: boolean;
}

export interface SearchOptions {
  engine?: "google" | "bing" | "duckduckgo";
  numResults?: number;
  timeout?: number;
  proxy?: string;
}

export interface ScrapeResult {
  title: string;
  description: string;
  content: string;
  url: string;
  timestamp: string;
}

export interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
} 