# @elizaos-plugins/plugin-puppeteer

A powerful web scraping and automation plugin for Eliza OS using Puppeteer, designed for high-performance web interactions and data extraction.

## Features

- **Advanced Web Scraping**: Extract data from websites with sophisticated selectors
- **Stealth Mode**: Built-in anti-detection mechanisms using puppeteer-extra-stealth
- **Proxy Support**: Easy integration with proxy servers for distributed scraping
- **Concurrent Scraping**: Handle multiple pages simultaneously
- **Content Parsing**: Built-in cheerio integration for easy HTML parsing
- **Resource Management**: Automatic memory and CPU optimization
- **Error Handling**: Robust error recovery and retry mechanisms

## Installation

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/eliza.git
cd eliza
```

2. Install dependencies:
```bash
pnpm install --no-frozen-lockfile
```

3. Build the plugin:
```bash
cd packages/plugin-puppeteer
pnpm build
```

4. Add to your character configuration:
```json
{
  "plugins": [
    "@elizaos-plugins/plugin-puppeteer"
  ],
  "settings": {
    "puppeteer": {
      "headless": true,
      "stealth": true,
      "timeout": 30000,
      "proxy": "http://your-proxy-server:port",  // Optional
      "userAgent": "custom-user-agent-string"    // Optional
    }
  }
}
```

## Usage

### Basic Web Scraping

```typescript
const puppeteerService = runtime.getService<IPuppeteerService>(ServiceType.PUPPETEER);

// Simple page scraping
const content = await puppeteerService.scrape("https://example.com");

// Advanced scraping with selectors
const data = await puppeteerService.scrapeWithSelectors("https://example.com", {
  title: "h1",
  description: "meta[name='description']",
  links: "a[href]"
});
```

### Search Engine Integration

```typescript
// Perform a web search
const results = await puppeteerService.search("your search query", {
  engine: "google",  // or "bing", "duckduckgo"
  numResults: 10
});
```

## Configuration Options

```typescript
interface PuppeteerConfig {
  headless?: boolean;          // Run in headless mode (default: true)
  stealth?: boolean;          // Use stealth mode (default: true)
  timeout?: number;           // Page timeout in ms (default: 30000)
  proxy?: string;            // Proxy server URL
  userAgent?: string;        // Custom user agent
  maxConcurrency?: number;   // Max concurrent pages (default: 5)
  retries?: number;         // Number of retry attempts (default: 3)
}
```

## Error Handling

The plugin includes robust error handling for common scenarios:
- Network timeouts
- CAPTCHA detection
- IP blocking
- Rate limiting
- DOM changes

## Best Practices

1. **Rate Limiting**
   - Implement delays between requests
   - Use rotating proxies for large-scale scraping
   - Respect robots.txt

2. **Memory Management**
   - Close unused pages and browsers
   - Monitor memory usage
   - Use the built-in resource management

3. **Error Recovery**
   - Implement retry mechanisms
   - Handle timeouts gracefully
   - Log errors for debugging

## Troubleshooting

Enable debug logging:
```bash
DEBUG=eliza:plugin-puppeteer:* pnpm start
```

Common issues and solutions:
1. **Browser Launch Fails**: Check system dependencies
2. **Memory Issues**: Adjust maxConcurrency setting
3. **Blocked Requests**: Try enabling stealth mode or using proxies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This plugin is part of the Eliza project. See the main project repository for license information.
