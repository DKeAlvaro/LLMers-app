/**
 * Substitute {variable} placeholders in text with values from a vars map.
 * Unknown variables are left unchanged.
 */
export const substituteVars = (text: string, vars: Record<string, string>): string => {
    return text.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
};

/**
 * Map language codes to display names.
 */
const LANG_NAMES: Record<string, string> = {
    nl: 'Dutch',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    ja: 'Japanese',
    zh: 'Chinese (Mandarin)',
    it: 'Italian',
    ru: 'Russian',
    ko: 'Korean',
    pt: 'Portuguese',
    ar: 'Arabic',
};

/**
 * Get the human-readable target language name from AsyncStorage.
 * Returns "Dutch" by default (matches the current lesson set).
 */
export const getTargetLangName = (): string => {
    try {
        // We can't use hooks here (not a component), so read from a cached value.
        // For now return Dutch as default since that's the only implemented language.
        return 'Dutch';
    } catch {
        return 'Dutch';
    }
};

/**
 * Extract a JSON object from an LLM response string.
 * Handles cases where the JSON is wrapped in markdown or extra text.
 */
export const extractJson = (response: string): any | null => {
    try {
        const start = response.indexOf('{');
        const end = response.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return JSON.parse(response.substring(start, end + 1));
        }
    } catch {
        // Fall through
    }
    return null;
};
