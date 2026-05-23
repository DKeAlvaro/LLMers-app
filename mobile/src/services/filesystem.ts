import * as FileSystem from 'expo-file-system/legacy';

const ROOT_DIR = (FileSystem.documentDirectory || '') + 'llmers/';
const LESSONS_DIR = ROOT_DIR + 'lessons/';
const LANGUAGES_DIR = ROOT_DIR + 'app_languages/';

const LOG_PREFIX = '[FS]';

export const FileSystemService = {
    async init() {
        try {
            console.log(`${LOG_PREFIX} init: root dir = ${ROOT_DIR}`);

            const dirInfo = await FileSystem.getInfoAsync(ROOT_DIR);
            if (!dirInfo.exists) {
                console.log(`${LOG_PREFIX} init: creating root dir`);
                await FileSystem.makeDirectoryAsync(ROOT_DIR);
            }

            const lessonsInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
            if (!lessonsInfo.exists) {
                console.log(`${LOG_PREFIX} init: creating lessons dir`);
                await FileSystem.makeDirectoryAsync(LESSONS_DIR);
            }

            const langInfo = await FileSystem.getInfoAsync(LANGUAGES_DIR);
            if (!langInfo.exists) {
                console.log(`${LOG_PREFIX} init: creating app_languages dir`);
                await FileSystem.makeDirectoryAsync(LANGUAGES_DIR);
            }

            console.log(`${LOG_PREFIX} init: done`);
        } catch (e) {
            console.error(`${LOG_PREFIX} init error:`, e);
        }
    },

    /** Check whether the lessons directory exists and has any content. */
    async hasLessonData(): Promise<boolean> {
        try {
            const info = await FileSystem.getInfoAsync(LESSONS_DIR);
            if (!info.exists || !info.isDirectory) {
                console.log(`${LOG_PREFIX} hasLessonData: lessons dir missing`);
                return false;
            }
            const contents = await FileSystem.readDirectoryAsync(LESSONS_DIR);
            console.log(`${LOG_PREFIX} hasLessonData: lessons dir has ${contents.length} entries:`, contents);
            return contents.length > 0;
        } catch (e) {
            console.error(`${LOG_PREFIX} hasLessonData error:`, e);
            return false;
        }
    },

    async saveFile(path: string, content: string) {
        try {
            const fullPath = ROOT_DIR + path;
            const deepDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
            if (deepDir) {
                await FileSystem.makeDirectoryAsync(deepDir, { intermediates: true });
            }
            await FileSystem.writeAsStringAsync(fullPath, content, { encoding: FileSystem.EncodingType.UTF8 });
            console.log(`${LOG_PREFIX} saveFile: OK  ${path} (${content.length} bytes)`);
        } catch (e) {
            console.error(`${LOG_PREFIX} saveFile FAIL: ${path}`, e);
        }
    },

    async loadFile(path: string): Promise<string | null> {
        try {
            const fullPath = ROOT_DIR + path;
            const fileInfo = await FileSystem.getInfoAsync(fullPath);
            if (!fileInfo.exists) {
                console.log(`${LOG_PREFIX} loadFile: MISS ${path}`);
                return null;
            }
            const content = await FileSystem.readAsStringAsync(fullPath, { encoding: FileSystem.EncodingType.UTF8 });
            console.log(`${LOG_PREFIX} loadFile: OK  ${path} (${content.length} bytes)`);
            return content;
        } catch (e) {
            console.error(`${LOG_PREFIX} loadFile FAIL: ${path}`, e);
            return null;
        }
    },

    async listFiles(dir: string): Promise<string[]> {
        try {
            const fullPath = ROOT_DIR + dir;
            console.log(`${LOG_PREFIX} listFiles: ${dir} -> ${fullPath}`);
            const info = await FileSystem.getInfoAsync(fullPath);
            if (!info.exists) {
                console.log(`${LOG_PREFIX} listFiles: dir MISSING ${dir}`);
                return [];
            }
            if (!info.isDirectory) {
                console.log(`${LOG_PREFIX} listFiles: NOT a dir ${dir}`);
                return [];
            }
            const files = await FileSystem.readDirectoryAsync(fullPath);
            console.log(`${LOG_PREFIX} listFiles: ${dir} -> ${files.length} entries:`, files);
            return files;
        } catch (e) {
            console.error(`${LOG_PREFIX} listFiles FAIL: ${dir}`, e);
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
