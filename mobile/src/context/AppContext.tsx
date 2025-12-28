import React, { createContext, useState, useEffect, useContext } from 'react';
import { StorageService } from '../services/storage';
import { FileSystemService } from '../services/filesystem';
import { UserProgress, AppSettings } from '../types';

interface AppContextType {
    isLoading: boolean;
    isFirstRun: boolean;
    settings: AppSettings;
    progress: UserProgress;
    setSettings: (settings: AppSettings) => Promise<void>;
    setIsFirstRun: (value: boolean) => Promise<void>;
    updateProgress: (newProgress: Partial<UserProgress>) => Promise<void>;
    refreshContext: () => Promise<void>;
    resetApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstRun, setIsFirstRunState] = useState(true);
    const [settings, setSettingsState] = useState<AppSettings>({ deepseek_api_key: null, selected_language: 'en-nl' });
    const [progress, setProgressState] = useState<UserProgress>({
        completed_lessons: [],
        interactive_scenario_progress: {},
        lesson_slide_positions: {},
        user_data: {}
    });

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await FileSystemService.init();
        const firstRun = await StorageService.getAppData('first_run', true);
        setIsFirstRunState(firstRun);

        const savedSettings = await StorageService.getSettings();
        setSettingsState(savedSettings);

        const savedProgress = await StorageService.getProgress();
        setProgressState(savedProgress);

        setIsLoading(false);
    };

    const refreshContext = async () => {
        await init();
    };

    const setSettings = async (newSettings: AppSettings) => {
        setSettingsState(newSettings);
        await StorageService.saveSettings(newSettings);
    };

    const setIsFirstRun = async (value: boolean) => {
        setIsFirstRunState(value);
        await StorageService.setAppData('first_run', value);
    };

    const updateProgress = async (newProgress: Partial<UserProgress>) => {
        const updated = { ...progress, ...newProgress };
        setProgressState(updated);
        await StorageService.saveProgress(updated);
    };

    const resetApp = async () => {
        await StorageService.clearAll();
        // Reset state to defaults
        setSettingsState({ deepseek_api_key: null, selected_language: '' });
        setProgressState({
            completed_lessons: [],
            interactive_scenario_progress: {},
            lesson_slide_positions: {},
            user_data: {}
        });
        setIsFirstRunState(true);
    };

    return (
        <AppContext.Provider value={{
            isLoading,
            isFirstRun,
            settings,
            progress,
            setSettings,
            setIsFirstRun,
            updateProgress,
            refreshContext,
            resetApp
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
