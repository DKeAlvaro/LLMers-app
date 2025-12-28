import * as FileSystem from 'expo-file-system/legacy';

const ROOT_DIR = (FileSystem.documentDirectory || '') + 'elearn/';
const LESSONS_DIR = ROOT_DIR + 'lessons/';
const LANGUAGES_DIR = ROOT_DIR + 'app_languages/';

export const FileSystemService = {
    async init() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(ROOT_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(ROOT_DIR);
            }
            const lessonsInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
            if (!lessonsInfo.exists) {
                await FileSystem.makeDirectoryAsync(LESSONS_DIR);
            }
            const langInfo = await FileSystem.getInfoAsync(LANGUAGES_DIR);
            if (!langInfo.exists) {
                await FileSystem.makeDirectoryAsync(LANGUAGES_DIR);
            }
        } catch (e) {
            console.error('Error initializing filesystem', e);
        }
    },

    async saveFile(path: string, content: string) {
        try {
            const fullPath = ROOT_DIR + path;
            // Ensure directory exists
            const deepDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
            if (deepDir) {
                await FileSystem.makeDirectoryAsync(deepDir, { intermediates: true });
            }
            await FileSystem.writeAsStringAsync(fullPath, content, { encoding: FileSystem.EncodingType.UTF8 });
        } catch (e) {
            console.error(`Error saving file ${path}`, e);
        }
    },

    async loadFile(path: string): Promise<string | null> {
        try {
            const fullPath = ROOT_DIR + path;
            const fileInfo = await FileSystem.getInfoAsync(fullPath);
            if (!fileInfo.exists) return null;
            return await FileSystem.readAsStringAsync(fullPath, { encoding: FileSystem.EncodingType.UTF8 });
        } catch (e) {
            console.error(`Error loading file ${path}`, e);
            return null;
        }
    },

    async listFiles(dir: string): Promise<string[]> {
        try {
            const fullPath = ROOT_DIR + dir;
            const info = await FileSystem.getInfoAsync(fullPath);
            if (!info.exists || !info.isDirectory) {
                return [];
            }
            return await FileSystem.readDirectoryAsync(fullPath);
        } catch (e) {
            console.error(`Error listing files in ${dir}`, e);
            return [];
        }
    },

    getLessonsDirectory() {
        return LESSONS_DIR;
    },

    getLanguagesDirectory() {
        return LANGUAGES_DIR;
    }
};
