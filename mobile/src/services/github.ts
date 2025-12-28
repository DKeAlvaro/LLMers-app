import { FileSystemService } from './filesystem';

const REPO_URL = "https://api.github.com/repos/DKeAlvaro/llmers-langs/contents/";

export const GitHubService = {
    async getAvailableLanguages(pat?: string): Promise<{ ui_languages: string[], target_languages: string[] }> {
        try {
            const headers: any = pat ? { "Authorization": `token ${pat}`, "Accept": "application/vnd.github.v3+json" } : { "Accept": "application/vnd.github.v3+json" };

            const [uiResponse, targetResponse] = await Promise.all([
                fetch(REPO_URL + "app_languages", { headers }),
                fetch(REPO_URL + "lessons", { headers })
            ]);

            const uiFiles = await uiResponse.json();
            const targetFiles = await targetResponse.json();

            const ui_languages = uiFiles
                .filter((f: any) => f.type === 'file' && f.name.endsWith('.json'))
                .map((f: any) => f.name.replace('.json', ''));

            const target_languages = targetFiles
                .filter((f: any) => f.type === 'dir')
                .map((f: any) => f.name);

            return { ui_languages, target_languages };
        } catch (e) {
            console.error("Error fetching languages", e);
            return { ui_languages: [], target_languages: [] };
        }
    },

    async downloadLanguageFiles(ui_lang: string, target_lang_folder: string, pat?: string): Promise<void> {
        const headers: any = pat ? { "Authorization": `token ${pat}`, "Accept": "application/vnd.github.v3+json" } : { "Accept": "application/vnd.github.v3+json" };

        // 1. Download UI Language File
        try {
            const uiRes = await fetch(`${REPO_URL}app_languages/${ui_lang}.json`, { headers });
            const uiData = await uiRes.json();
            const downloadUrl = uiData.download_url;

            const contentRes = await fetch(downloadUrl);
            const content = await contentRes.text();

            await FileSystemService.saveFile(`app_languages/${ui_lang}.json`, content);
        } catch (e) {
            console.error("Error downloading UI file", e);
        }

        // 2. Download Lessons
        // First get the list of language combinations in the target folder
        try {
            const folderUrl = `${REPO_URL}lessons/${target_lang_folder}`;
            const folderRes = await fetch(folderUrl, { headers });
            const folders = await folderRes.json();

            for (const folder of folders) {
                if (folder.type === 'dir') {
                    const combination = folder.name; // e.g., "en-nl"
                    // Now fetch files in this combination folder
                    const filesUrl = `${REPO_URL}lessons/${target_lang_folder}/${combination}`;
                    const filesRes = await fetch(filesUrl, { headers });
                    const files = await filesRes.json();

                    for (const file of files) {
                        if (file.type === 'file' && file.name.endsWith('.json')) {
                            const fileContentRes = await fetch(file.download_url);
                            const fileContent = await fileContentRes.text();
                            await FileSystemService.saveFile(`lessons/${target_lang_folder}/${combination}/${file.name}`, fileContent);
                        }
                    }
                }
            }

        } catch (e) {
            console.error("Error downloading lessons", e);
        }
    }
};
