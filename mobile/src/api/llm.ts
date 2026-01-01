import { StorageService } from '../services/storage';

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const LLMService = {
    async getEffectiveApiKey(): Promise<string | null> {
        const settings = await StorageService.getSettings();
        return settings.deepseek_api_key;
    },

    async chatCompletion(messages: Message[], max_tokens: number = 150): Promise<string> {
        const apiKey = await this.getEffectiveApiKey();

        if (apiKey) {
            return this.callDeepSeek(apiKey, messages, max_tokens);
        } else {
            return "No API key configured. Please add your DeepSeek API key in Settings.";
        }
    },

    async callDeepSeek(apiKey: string, messages: Message[], max_tokens: number): Promise<string> {
        try {
            const response = await fetch(DEEPSEEK_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    max_tokens: max_tokens,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            } else {
                throw new Error("Invalid response from DeepSeek");
            }
        } catch (e) {
            console.error("DeepSeek API Error", e);
            return "Error connecting to DeepSeek API.";
        }
    }
};
