import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, UserProgress } from '../types';

const LOG_PREFIX = '[STORE]';

const KEYS = {
    SETTINGS: 'app_settings',
    PROGRESS: 'user_progress',
    APP_DATA: 'app_data'
};

const DEFAULT_SETTINGS: AppSettings = {
    deepseek_api_key: null,
    selected_language: 'en-dutch', // Default — matches the folder name in llmers-langs
};

const DEFAULT_PROGRESS: UserProgress = {
    completed_lessons: [],
    interactive_scenario_progress: {},
    lesson_slide_positions: {},
    user_data: {},
};

export const StorageService = {
    async getSettings(): Promise<AppSettings> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.SETTINGS);
            console.log(`${LOG_PREFIX} getSettings: raw=${jsonValue ? jsonValue.substring(0, 80) : 'null'}`);
            if (jsonValue == null) return DEFAULT_SETTINGS;
            const parsed = JSON.parse(jsonValue);
            if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
            const result = { ...DEFAULT_SETTINGS, ...parsed };
            console.log(`${LOG_PREFIX} getSettings: lang=${result.selected_language}`);
            return result;
        } catch (e) {
            console.error(`${LOG_PREFIX} getSettings FAIL`, e);
            return DEFAULT_SETTINGS;
        }
    },

    async saveSettings(settings: AppSettings): Promise<void> {
        try {
            console.log(`${LOG_PREFIX} saveSettings: lang=${settings.selected_language}`);
            await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error(`${LOG_PREFIX} saveSettings FAIL`, e);
        }
    },

    async getProgress(): Promise<UserProgress> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.PROGRESS);
            if (jsonValue == null) return DEFAULT_PROGRESS;
            const parsed = JSON.parse(jsonValue);
            if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS;
            const result = { ...DEFAULT_PROGRESS, ...parsed };
            console.log(`${LOG_PREFIX} getProgress: completed=${result.completed_lessons.length} lessons`);
            return result;
        } catch (e) {
            console.error(`${LOG_PREFIX} getProgress FAIL`, e);
            return DEFAULT_PROGRESS;
        }
    },

    async saveProgress(progress: UserProgress): Promise<void> {
        try {
            console.log(`${LOG_PREFIX} saveProgress: completed=${progress.completed_lessons.length}`);
            await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
        } catch (e) {
            console.error(`${LOG_PREFIX} saveProgress FAIL`, e);
        }
    },

    async getAppData(key: string, defaultValue: any = null): Promise<any> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.APP_DATA);
            if (jsonValue == null) return defaultValue;
            const data = JSON.parse(jsonValue);
            if (!data || typeof data !== 'object') return defaultValue;
            const value = data[key] !== undefined ? data[key] : defaultValue;
            console.log(`${LOG_PREFIX} getAppData: ${key}=${JSON.stringify(value)}`);
            return value;
        } catch (e) {
            console.error(`${LOG_PREFIX} getAppData FAIL`, e);
            return defaultValue;
        }
    },

    async setAppData(key: string, value: any): Promise<void> {
        try {
            console.log(`${LOG_PREFIX} setAppData: ${key}=${JSON.stringify(value)}`);
            const jsonValue = await AsyncStorage.getItem(KEYS.APP_DATA);
            const data = jsonValue != null ? JSON.parse(jsonValue) : {};
            data[key] = value;
            await AsyncStorage.setItem(KEYS.APP_DATA, JSON.stringify(data));
        } catch (e) {
            console.error(`${LOG_PREFIX} setAppData FAIL`, e);
        }
    },

    async clearAll(): Promise<void> {
        try {
            console.log(`${LOG_PREFIX} clearAll`);
            await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.PROGRESS, KEYS.APP_DATA]);
        } catch (e) {
            console.error(`${LOG_PREFIX} clearAll FAIL`, e);
        }
    }
};
