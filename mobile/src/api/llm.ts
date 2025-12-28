import { StorageService } from '../services/storage';

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const GRADIO_SPACE_URL = "https://huggingface-projects-llama-3-2-3b-instruct.hf.space/api/predict";

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
            return this.callGradioFallback(messages, max_tokens);
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
    },

    async callGradioFallback(messages: Message[], max_tokens: number): Promise<string> {
        // Format messages into a single prompt string mostly compatible with the Gradio app expectations
        let prompt = "";
        for (const msg of messages) {
            if (msg.role === 'system') prompt += `System: ${msg.content}\n\n`;
            if (msg.role === 'user') prompt += `User: ${msg.content}\n\n`;
            if (msg.role === 'assistant') prompt += `Assistant: ${msg.content}\n\n`;
        }
        prompt += "Assistant:";

        try {
            // Note: This matches the typical Gradio API structure, but payload might vary based on specific Space implementation.
            // Based on python client usage: client.predict(message=prompt, ...)
            // We map this to the data array index expected by the API.
            // Many Spaces just take [message] or [message, system_prompt, max_tokens, ...]
            // Let's try a standard chat payload if the predict list fails.

            const payload = {
                data: [
                    prompt,
                    null, // system prompt (optional in some spaces)
                    max_tokens, // max_new_tokens
                    0.7, // temperature
                    0.95, // top_p
                    50, // top_k
                    1.2, // repetition_penalty
                ]
            };

            const response = await fetch(GRADIO_SPACE_URL, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Gradio HTTP Error ${response.status}: ${text}`);
            }

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0];
            } else {
                throw new Error("Invalid response from Gradio");
            }
        } catch (e) {
            console.error("Gradio API Error", e);
            return "Error connecting to AI (Fallback).";
        }
    }
};
