import { type IAgentRuntime, elizaLogger, type Service, ServiceType as CoreServiceType } from "@elizaos/core";
import * as puppeteer from "puppeteer";
import { getPuppeteerConfig } from "../environment";
import { existsSync } from "fs";

const MAC_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIN_CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const LINUX_CHROME_PATHS = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable"
];

function getChromePath(): string | undefined {
    // Check for macOS Chrome
    if (process.platform === "darwin" && existsSync(MAC_CHROME_PATH)) {
        return MAC_CHROME_PATH;
    }
    
    // Check for Windows Chrome
    if (process.platform === "win32" && existsSync(WIN_CHROME_PATH)) {
        return WIN_CHROME_PATH;
    }
    
    // Check for Linux Chrome
    if (process.platform === "linux") {
        for (const path of LINUX_CHROME_PATHS) {
            if (existsSync(path)) {
                return path;
            }
        }
    }
    
    // No system Chrome found
    return undefined;
}

export interface SearchResult {
    title: string;
    url: string;
    description: string;
}

export const ServiceType = {
    PUPPETEER: "PUPPETEER_SERVICE" as CoreServiceType
};

export class PuppeteerService implements Service {
    serviceType: CoreServiceType = ServiceType.PUPPETEER;
    private browser: puppeteer.Browser | null = null;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        if (!this.browser) {
            try {
                elizaLogger.info("Initializing Puppeteer browser");
                
                // Get validated config
                const config = getPuppeteerConfig(runtime);
                
                const args = [
                    "--no-sandbox", 
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--disable-gpu",
                    "--window-size=1920,1080",
                    "--disable-blink-features=AutomationControlled" // Hide automation
                ];
                
                if (config.PROXY_SERVER) {
                    args.push(`--proxy-server=${config.PROXY_SERVER}`);
                }
                
                // Try to use system Chrome first
                const chromePath = getChromePath();
                if (chromePath) {
                    elizaLogger.info(`Using system Chrome at: ${chromePath}`);
                }
                
                // Initialize the browser with config
                this.browser = await puppeteer.launch({
                    headless: config.HEADLESS ? "new" : false,
                    executablePath: chromePath, // Will use bundled Chromium if undefined
                    args
                });
                
                // Apply user agent if provided
                const userAgent = config.USER_AGENT || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
                const pages = await this.browser.pages();
                for (const page of pages) {
                    await page.setUserAgent(userAgent);
                }
                
                elizaLogger.info("Puppeteer browser initialized successfully");
            } catch (error) {
                elizaLogger.error("Failed to initialize Puppeteer browser:", error);
                throw error;
            }
        }
    }

    async search(query: string): Promise<SearchResult[]> {
        if (!this.browser) {
            throw new Error("Browser not initialized. Call initialize() first.");
        }

        let page: puppeteer.Page | null = null;
        
        try {
            page = await this.browser.newPage();
            
            // Set a realistic viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Set a realistic user agent
            await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
            
            // Add advanced browser fingerprinting evasion
            await page.evaluateOnNewDocument(() => {
                // Overwrite the navigator properties
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                
                // Override permissions API to avoid detection
                // @ts-ignore - we're manipulating browser objects which TypeScript doesn't know about
                const originalQuery = window.navigator.permissions.query;
                // @ts-ignore
                window.navigator.permissions.query = (parameters: any) => {
                    // Return "prompt" for common permissions checks used in bot detection
                    if (parameters.name === 'notifications' || 
                        parameters.name === 'midi' || 
                        // @ts-ignore - intentionally checking for these permission types
                        parameters.name === 'camera' || 
                        // @ts-ignore
                        parameters.name === 'microphone' || 
                        parameters.name === 'geolocation' || 
                        // @ts-ignore
                        parameters.name === 'clipboard-read' || 
                        // @ts-ignore
                        parameters.name === 'clipboard-write') {
                        return Promise.resolve({ state: 'prompt' });
                    }
                    return originalQuery(parameters);
                };
            });
            
            elizaLogger.info(`Navigating to Google to search for: ${query}`);
            
            // Go directly to search results page instead of navigating to Google home first
            const encodedQuery = encodeURIComponent(query);
            const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
            
            // Try navigating to the search URL with retry logic
            let attempts = 0;
            const maxAttempts = 3;
            let navigated = false;
            
            while (attempts < maxAttempts && !navigated) {
                try {
                    attempts++;
                    elizaLogger.info(`Navigation attempt ${attempts} to: ${searchUrl}`);
                    await page.goto(searchUrl, { 
                        waitUntil: "networkidle2", 
                        timeout: 30000 
                    });
                    navigated = true;
                } catch (error) {
                    elizaLogger.warn(`Navigation attempt ${attempts} failed: ${error}`);
                    if (attempts >= maxAttempts) throw error;
                    await new Promise(r => setTimeout(r, 2000)); // Wait before retry
                }
            }
            
            // Accept cookies if the dialog appears
            try {
                const acceptButtonSelectors = [
                    'button:has-text("Accept all")', 
                    'button:has-text("I agree")',
                    'button:has-text("Accept")',
                    'button[id="L2AGLb"]' // Google's "I agree" button ID
                ];
                
                for (const selector of acceptButtonSelectors) {
                    const button = await page.$(selector);
                    if (button) {
                        elizaLogger.info(`Found cookie consent button with selector: ${selector}`);
                        await button.click();
                        await page.waitForNavigation({ waitUntil: "networkidle2" });
                        break;
                    }
                }
            } catch (error) {
                elizaLogger.info("No cookie dialog found or couldn't be handled");
            }
            
            // Wait for search results to load with multiple possible selectors
            const resultSelectors = ["div[data-hveid]", ".g", "div.yuRUbf", "div[data-sokoban-container]"];
            
            elizaLogger.info("Waiting for search results to load...");
            let resultsFound = false;
            
            for (const selector of resultSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    elizaLogger.info(`Found search results with selector: ${selector}`);
                    resultsFound = true;
                    break;
                } catch (error) {
                    elizaLogger.debug(`Selector ${selector} not found, trying next...`);
                }
            }
            
            if (!resultsFound) {
                elizaLogger.warn("Could not find standard search result selectors. Page may not be a search results page.");
            }
            
            // Add a small delay to ensure results are fully loaded
            await new Promise(r => setTimeout(r, 1000));
            
            // Take a screenshot for debugging
            await page.screenshot({ path: 'google-search.png' });
            elizaLogger.info("Screenshot saved to google-search.png");
            
            elizaLogger.info("Extracting search results...");
            
            // Use a robust selector strategy for search results
            const results = await page.evaluate(() => {
                // This code runs in the browser context
                // Start with an empty array of results
                const searchResults: { title: string, url: string, description: string }[] = [];
                
                // Try multiple selector strategies
                const containers = Array.from(document.querySelectorAll('.g, [data-hveid][data-ved], div[data-sokoban-container]'));
                
                if (containers.length === 0) {
                    // If we can't find standard containers, try to find any links on the page
                    const links = Array.from(document.querySelectorAll('a[href^="http"]'));
                    const validLinks = links.filter(link => {
                        const href = link.getAttribute('href') || '';
                        return href.startsWith('http') && 
                               !href.includes('google.com') && 
                               !href.includes('gstatic.com');
                    }).slice(0, 5);
                    
                    for (const link of validLinks) {
                        const title = link.textContent || link.getAttribute('href') || '';
                        if (!title.trim()) continue;
                        
                        const url = link.getAttribute('href') || '';
                        if (!url || !url.startsWith('http')) continue;
                        
                        const parentElement = link.parentElement;
                        const description = parentElement ? 
                            (parentElement.textContent || '').replace(title, '').trim() : 
                            'No description available';
                        
                        searchResults.push({ title, url, description });
                    }
                    
                    return searchResults;
                }
                
                // Standard extraction logic
                for (const container of containers) {
                    try {
                        // Find the title element using multiple possible selectors
                        const titleEl = 
                            container.querySelector('h3') || 
                            container.querySelector('[role="heading"]') ||
                            container.querySelector('.DKV0Md'); // Google news article title
                            
                        if (!titleEl) continue;
                        const title = titleEl.textContent || '';
                        if (!title.trim()) continue;
                        
                        // Find the link element
                        const linkEl = 
                            container.querySelector('a[href^="http"]') ||
                            container.querySelector('a[ping]') ||
                            container.querySelector('.yuRUbf a');
                            
                        if (!linkEl) continue;
                        const url = linkEl.getAttribute('href') || '';
                        if (!url || !url.startsWith('http')) continue;
                        
                        // Find the description element using multiple possible selectors
                        const descEl = 
                            container.querySelector('.VwiC3b, .Y2IQFc') ||
                            container.querySelector('[data-snc]') || 
                            container.querySelector('[style*="webkit-line-clamp"]') ||
                            container.querySelector('.yXK7lf em'); // Some results use em tags
                        
                        const description = descEl ? descEl.textContent || '' : '';
                        
                        // Only add results with all required fields and filter out Google's own pages
                        if (title && url && description && 
                            !url.includes('google.com') && 
                            !url.includes('gstatic.com')) {
                            
                            searchResults.push({ title, url, description });
                        }
                    } catch (e) {
                        // Ignore errors for individual elements
                        continue;
                    }
                }
                
                return searchResults.slice(0, 5); // Return top 5 results
            });
            
            elizaLogger.info(`Extracted ${results.length} search results`);
            
            // Log the results for debugging
            elizaLogger.debug("Search results:", results);
            
            if (results.length === 0) {
                elizaLogger.warn("No search results found. Google may be blocking the request.");
                elizaLogger.info("Checking for Google captcha or other blocking elements...");
                
                // Check if we're seeing a captcha or error page
                const pageTitle = await page.title();
                const pageContent = await page.content();
                
                if (pageTitle.includes("unusual traffic") || pageContent.includes("unusual traffic") || 
                    pageContent.includes("captcha") || pageContent.includes("CAPTCHA")) {
                    throw new Error("Google is showing a captcha or unusual traffic warning. Search blocked.");
                }
            }
            
            return results;
            
        } catch (error) {
            elizaLogger.error("Error during web search:", error);
            throw error;
        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (e) {
                    elizaLogger.error("Error closing page:", e);
                }
            }
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
} 