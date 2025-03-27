/**
 * Examples for using the Puppeteer plugin in Eliza OS
 */

// Example 1: Character configuration
export const characterConfig = {
  name: "WebResearchAssistant",
  description: "An assistant that can search the web and extract information.",
  plugins: ["@elizaos-plugins/plugin-puppeteer"],
  settings: {
    puppeteer: {
      HEADLESS: true,
      STEALTH_MODE: true,
      USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    }
  }
};

// Example 2: Using the plugin in a custom action
export const customActionExample = `
import { type IAgentRuntime, type Action } from "@elizaos/core";
import { ServiceType } from "@elizaos-plugins/plugin-puppeteer";

export const webResearchAction: Action = {
  name: "WEB_RESEARCH",
  description: "Research a topic on the web and return summarized information.",
  
  handler: async (runtime, message, state, options, callback) => {
    const puppeteerService = runtime.getService(ServiceType.PUPPETEER);
    
    if (!puppeteerService) {
      return callback({
        text: "Sorry, the web research service is not available."
      });
    }
    
    try {
      // Extract the search query from the message
      const searchQuery = message.content.text;
      
      // Perform the search
      const searchResults = await puppeteerService.search(searchQuery);
      
      // Format the results
      const formattedResults = searchResults
        .map((result, index) => 
          \`\${index + 1}. [\${result.title}](\${result.url})\n\${result.description}\`
        )
        .join("\n\n");
      
      callback({
        text: \`Here are the search results for "\${searchQuery}":\n\n\${formattedResults}\`
      });
    } catch (error) {
      callback({
        text: "Sorry, I encountered an error while researching."
      });
    }
  }
};
`;

// Example 3: Accessing the plugin in a React component
export const reactComponentExample = `
import { useState, useEffect } from 'react';
import { useEliza } from '@elizaos/react';

export function WebSearchComponent() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const eliza = useEliza();
  
  const handleSearch = async () => {
    if (!query) return;
    
    setIsLoading(true);
    try {
      const response = await eliza.actions.PUPPETEER_WEB_SEARCH(query);
      setResults(response.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="web-search">
      <div className="search-input">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search the web..." 
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className="search-results">
        {results.map((result, index) => (
          <div className="result-item" key={index}>
            <h3><a href={result.url}>{result.title}</a></h3>
            <p>{result.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
