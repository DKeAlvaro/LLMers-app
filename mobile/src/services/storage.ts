import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, UserProgress } from '../types';

const KEYS = {
    SETTINGS: 'app_settings',
    PROGRESS: 'user_progress',
    APP_DATA: 'app_data'
};

const DEFAULT_SETTINGS: AppSettings = {
    deepseek_api_key: null,
    selected_language: 'en-nl', // Default
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
            if (jsonValue == null) return DEFAULT_SETTINGS;
            const parsed = JSON.parse(jsonValue);
            if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
            return { ...DEFAULT_SETTINGS, ...parsed };
        } catch (e) {
            console.error('Error reading settings', e);
            return DEFAULT_SETTINGS;
        }
    },

    async saveSettings(settings: AppSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings', e);
        }
    },

    async getProgress(): Promise<UserProgress> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.PROGRESS);
            if (jsonValue == null) return DEFAULT_PROGRESS;
            const parsed = JSON.parse(jsonValue);
            if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS;
            return { ...DEFAULT_PROGRESS, ...parsed };
        } catch (e) {
            console.error('Error reading progress', e);
            return DEFAULT_PROGRESS;
        }
    },

    async saveProgress(progress: UserProgress): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
        } catch (e) {
            console.error('Error saving progress', e);
        }
    },

    async getAppData(key: string, defaultValue: any = null): Promise<any> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.APP_DATA);
            if (jsonValue == null) return defaultValue;
            const data = JSON.parse(jsonValue);
            if (!data || typeof data !== 'object') return defaultValue;
            return data[key] !== undefined ? data[key] : defaultValue;
        } catch (e) {
            console.error('Error reading app data', e);
            return defaultValue;
        }
    },

    async setAppData(key: string, value: any): Promise<void> {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.APP_DATA);
            const data = jsonValue != null ? JSON.parse(jsonValue) : {};
            data[key] = value;
            await AsyncStorage.setItem(KEYS.APP_DATA, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving app data', e);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.PROGRESS, KEYS.APP_DATA]);
        } catch (e) {
            console.error('Error clearing data', e);
        }
    }
};
