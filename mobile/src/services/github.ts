import { FileSystemService } from './filesystem';

const REPO_URL = "https://api.github.com/repos/DKeAlvaro/llmers-langs/contents/";
const LOG_PREFIX = '[GH]';

export const GitHubService = {
    async getAvailableLanguages(pat?: string): Promise<{ ui_languages: string[], target_languages: string[] }> {
        console.log(`${LOG_PREFIX} getAvailableLanguages: fetching catalog...`);
        try {
            const headers: any = pat
                ? { "Authorization": `token ${pat}`, "Accept": "application/vnd.github.v3+json" }
                : { "Accept": "application/vnd.github.v3+json" };

            const [uiResponse, targetResponse] = await Promise.all([
                fetch(REPO_URL + "app_languages", { headers }),
                fetch(REPO_URL + "lessons", { headers })
            ]);

            console.log(`${LOG_PREFIX} getAvailableLanguages: ui status=${uiResponse.status}, lessons status=${targetResponse.status}`);

            const uiFiles = await uiResponse.json();
            const targetFiles = await targetResponse.json();

            const ui_languages = (Array.isArray(uiFiles) ? uiFiles : [])
                .filter((f: any) => f.type === 'file' && f.name.endsWith('.json'))
                .map((f: any) => f.name.replace('.json', ''));

            const target_languages = (Array.isArray(targetFiles) ? targetFiles : [])
                .filter((f: any) => f.type === 'dir')
                .map((f: any) => f.name);

            console.log(`${LOG_PREFIX} getAvailableLanguages: UI langs=${ui_languages}, targets=${target_languages}`);
            return { ui_languages, target_languages };
        } catch (e) {
            console.error(`${LOG_PREFIX} getAvailableLanguages FAIL:`, e);
            return { ui_languages: [], target_languages: [] };
        }
    },

    async downloadLanguageFiles(ui_lang: string, target_lang_folder: string, pat?: string): Promise<void> {
        console.log(`${LOG_PREFIX} downloadLanguageFiles: ui=${ui_lang} target=${target_lang_folder}`);
        const headers: any = pat
            ? { "Authorization": `token ${pat}`, "Accept": "application/vnd.github.v3+json" }
            : { "Accept": "application/vnd.github.v3+json" };

        // 1. Download UI Language File
        try {
            const uiUrl = `${REPO_URL}app_languages/${ui_lang}.json`;
            console.log(`${LOG_PREFIX} downloadLanguageFiles: fetching UI file ${uiUrl}`);
            const uiRes = await fetch(uiUrl, { headers });
            console.log(`${LOG_PREFIX} downloadLanguageFiles: UI status=${uiRes.status}`);
            const uiData = await uiRes.json();

            if (uiData.download_url) {
                const contentRes = await fetch(uiData.download_url);
                const content = await contentRes.text();
                await FileSystemService.saveFile(`app_languages/${ui_lang}.json`, content);
            } else {
                console.warn(`${LOG_PREFIX} downloadLanguageFiles: no download_url in UI response`, uiData);
            }
        } catch (e) {
            console.error(`${LOG_PREFIX} downloadLanguageFiles: UI download FAIL`, e);
        }

        // 2. Download Lessons
        try {
            const folderUrl = `${REPO_URL}lessons/${target_lang_folder}`;
            console.log(`${LOG_PREFIX} downloadLanguageFiles: fetching lessons listing ${folderUrl}`);
            const folderRes = await fetch(folderUrl, { headers });
            console.log(`${LOG_PREFIX} downloadLanguageFiles: lessons listing status=${folderRes.status}`);

            const folders = await folderRes.json();

            if (!Array.isArray(folders)) {
                console.warn(`${LOG_PREFIX} downloadLanguageFiles: unexpected response (not array):`, folders);
                return;
            }

            for (const folder of folders) {
                if (folder.type === 'dir') {
                    const combination = folder.name; // e.g., "en-nl"
                    const filesUrl = `${REPO_URL}lessons/${target_lang_folder}/${combination}`;
                    console.log(`${LOG_PREFIX} downloadLanguageFiles: fetching files in ${combination} ${filesUrl}`);
                    const filesRes = await fetch(filesUrl, { headers });
                    console.log(`${LOG_PREFIX} downloadLanguageFiles: ${combination} status=${filesRes.status}`);
                    const files = await filesRes.json();

                    if (!Array.isArray(files)) {
                        console.warn(`${LOG_PREFIX} downloadLanguageFiles: ${combination} not array:`, files);
                        continue;
                    }

                    let fileCount = 0;
                    for (const file of files) {
                        if (file.type === 'file' && file.name.endsWith('.json')) {
                            console.log(`${LOG_PREFIX} downloadLanguageFiles: downloading ${file.name}`);
                            const fileContentRes = await fetch(file.download_url);
                            const fileContent = await fileContentRes.text();
                            await FileSystemService.saveFile(
                                `lessons/${target_lang_folder}/${combination}/${file.name}`,
                                fileContent
                            );
                            fileCount++;
                        }
                    }
                    console.log(`${LOG_PREFIX} downloadLanguageFiles: ${combination} downloaded ${fileCount} files`);
                }
            }
            console.log(`${LOG_PREFIX} downloadLanguageFiles: DONE`);
        } catch (e) {
            console.error(`${LOG_PREFIX} downloadLanguageFiles: lessons download FAIL`, e);
        }
    }
};
