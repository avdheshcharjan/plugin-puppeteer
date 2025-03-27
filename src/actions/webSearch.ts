import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger
} from "@elizaos/core";
import { PuppeteerService } from "../services/puppeteerService";
import { type SearchResult } from "../services/puppeteerService";

export const puppeteerWebSearch: Action = {
    name: "PUPPETEER_WEB_SEARCH",
    similes: [
        "SEARCH_WEB",
        "INTERNET_SEARCH",
        "LOOKUP",
        "QUERY_WEB",
        "FIND_ONLINE",
        "SEARCH_ENGINE",
        "WEB_LOOKUP",
        "ONLINE_SEARCH",
        "FIND_INFORMATION",
        "BROWSE_WEB",
        "NAVIGATE_WEB"
    ],
    suppressInitialMessage: true,
    description: "Perform a web search using Puppeteer to find information related to the message.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Puppeteer doesn't require API keys
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", message);
        state = (await runtime.composeState(message)) as State;
        const userId = runtime.agentId;
        elizaLogger.log("User ID:", userId);

        const searchQuery = message.content.text;
        elizaLogger.log("Web search query received:", searchQuery);

        try {
            const puppeteerService = new PuppeteerService();
            await puppeteerService.initialize(runtime);
            
            // Use Google as the default search engine
            const searchResults = await puppeteerService.search(searchQuery);

            if (searchResults && searchResults.length > 0) {
                const formattedResults = searchResults
                    .map((result: SearchResult, index: number) => 
                        `${index + 1}. [${result.title}](${result.url})\n${result.description}`
                    )
                    .join("\n\n");

                callback({
                    text: `Here are the search results for "${searchQuery}":\n\n${formattedResults}`
                });
            } else {
                callback({
                    text: `No results found for "${searchQuery}".`
                });
            }
        } catch (error) {
            elizaLogger.error("Puppeteer search failed:", error);
            callback({
                text: "Sorry, I encountered an error while searching the web."
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Search for recent AI developments",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the search results for recent AI developments:",
                    action: "PUPPETEER_WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Look up information about climate change",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the search results about climate change:",
                    action: "PUPPETEER_WEB_SEARCH",
                },
            },
        ],
    ],
} as Action;
