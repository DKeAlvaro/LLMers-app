import React, { createContext, useState, useEffect, useContext } from 'react';
import { StorageService } from '../services/storage';
import { FileSystemService } from '../services/filesystem';
import { UserProgress, AppSettings } from '../types';

const LOG_PREFIX = '[APP]';

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
    const [settings, setSettingsState] = useState<AppSettings>({
        deepseek_api_key: null,
        selected_language: '',
    });
    const [progress, setProgressState] = useState<UserProgress>({
        completed_lessons: [],
        interactive_scenario_progress: {},
        lesson_slide_positions: {},
        user_data: {},
    });

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        console.log(`${LOG_PREFIX} init: starting...`);

        // 1. Initialize filesystem
        await FileSystemService.init();

        // 2. Check if lesson data exists on device
        const hasData = await FileSystemService.hasLessonData();
        console.log(`${LOG_PREFIX} init: hasLessonData=${hasData}`);

        // 3. Load persisted state
        const firstRun = await StorageService.getAppData('first_run', true);
        console.log(`${LOG_PREFIX} init: stored first_run=${firstRun}`);

        const savedSettings = await StorageService.getSettings();
        console.log(`${LOG_PREFIX} init: settings.selected_language="${savedSettings.selected_language}"`);

        const savedProgress = await StorageService.getProgress();

        // 4. CRITICAL FIX: If user has completed setup before (firstRun=false)
        //    but lesson data is missing from device (cache cleared, reinstalled, etc.),
        //    force them back to the language selection screen.
        if (!firstRun && !hasData) {
            console.warn(`${LOG_PREFIX} init: ⚠️ firstRun=false but no lesson data on device!`);
            console.warn(`${LOG_PREFIX} init: -> Cache was likely cleared. Redirecting to language selection.`);
            setIsFirstRunState(true);
            await StorageService.setAppData('first_run', true);
        } else {
            setIsFirstRunState(firstRun);
        }

        setSettingsState(savedSettings);
        setProgressState(savedProgress);

        console.log(`${LOG_PREFIX} init: done. isFirstRun=${firstRun && hasData ? firstRun : !hasData} isLoading=${false}`);
        setIsLoading(false);
    };

    const refreshContext = async () => {
        console.log(`${LOG_PREFIX} refreshContext`);
        await init();
    };

    const setSettings = async (newSettings: AppSettings) => {
        console.log(`${LOG_PREFIX} setSettings: lang="${newSettings.selected_language}"`);
        setSettingsState(newSettings);
        await StorageService.saveSettings(newSettings);
    };

    const setIsFirstRun = async (value: boolean) => {
        console.log(`${LOG_PREFIX} setIsFirstRun: ${value}`);
        setIsFirstRunState(value);
        await StorageService.setAppData('first_run', value);
    };

    const updateProgress = async (newProgress: Partial<UserProgress>) => {
        const updated = { ...progress, ...newProgress };
        setProgressState(updated);
        await StorageService.saveProgress(updated);
    };

    const resetApp = async () => {
        console.log(`${LOG_PREFIX} resetApp: clearing all data`);
        await StorageService.clearAll();
        setSettingsState({ deepseek_api_key: null, selected_language: '' });
        setProgressState({
            completed_lessons: [],
            interactive_scenario_progress: {},
            lesson_slide_positions: {},
            user_data: {},
        });
        setIsFirstRunState(true);
    };

    return (
        <AppContext.Provider
            value={{
                isLoading,
                isFirstRun,
                settings,
                progress,
                setSettings,
                setIsFirstRun,
                updateProgress,
                refreshContext,
                resetApp,
            }}
        >
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
