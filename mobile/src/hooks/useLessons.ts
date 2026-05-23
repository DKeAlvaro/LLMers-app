import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FileSystemService } from '../services/filesystem';
import { Lesson } from '../types';

const LOG_PREFIX = '[LESSONS]';

export const useLessons = () => {
    const { settings, progress } = useApp();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [needsRedownload, setNeedsRedownload] = useState(false);

    useEffect(() => {
        console.log(`${LOG_PREFIX} useEffect triggered: selected_language="${settings.selected_language}"`);
        loadLessons();
    }, [settings.selected_language]);

    const loadLessons = async () => {
        const langCode = settings.selected_language; // e.g. "en-dutch"
        console.log(`${LOG_PREFIX} loadLessons: langCode="${langCode}"`);

        if (!langCode) {
            console.warn(`${LOG_PREFIX} loadLessons: no langCode, aborting`);
            return;
        }

        const parts = langCode.split('-'); // ["en", "dutch"]
        if (parts.length < 2) {
            console.warn(`${LOG_PREFIX} loadLessons: langCode "${langCode}" has < 2 parts, aborting`);
            return;
        }

        const uiLang = parts[0];      // "en"
        const targetFolder = parts[1]; // "dutch"

        console.log(`${LOG_PREFIX} loadLessons: uiLang="${uiLang}" targetFolder="${targetFolder}"`);

        // Find the correct subfolder (e.g. "en-nl") inside "lessons/dutch/"
        const parentPath = `lessons/${targetFolder}/`;
        const subdirs = await FileSystemService.listFiles(parentPath);
        console.log(`${LOG_PREFIX} loadLessons: subdirs in ${parentPath} =`, subdirs);

        // Look for any folder starting with "{uiLang}-"
        const correctSubdir = subdirs.find(d => d.startsWith(`${uiLang}-`));
        console.log(`${LOG_PREFIX} loadLessons: correctSubdir =`, correctSubdir);

        if (!correctSubdir) {
            console.warn(`${LOG_PREFIX} loadLessons: NO matching subdir found for "${uiLang}-" in ${parentPath}`);
            console.warn(`${LOG_PREFIX} loadLessons: -> lessons have likely not been downloaded (or cache was cleared).`);
            setLessons([]);
            return;
        }

        const path = `lessons/${targetFolder}/${correctSubdir}/`;
        console.log(`${LOG_PREFIX} loadLessons: loading from ${path}`);

        try {
            const files = await FileSystemService.listFiles(path);
            console.log(`${LOG_PREFIX} loadLessons: files in ${path} =`, files);

            const loadedLessons: Lesson[] = [];
            let skippedCount = 0;

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await FileSystemService.loadFile(path + file);
                    if (content) {
                        try {
                            const lessonData = JSON.parse(content);

                            // Validate required fields
                            if (!lessonData.id || !lessonData.content || !Array.isArray(lessonData.content)) {
                                console.warn(
                                    `${LOG_PREFIX} loadLessons: SKIPPING ${file} — missing required fields.`,
                                    `id=${lessonData.id} hasContent=${!!lessonData.content} hasSlides=${!!lessonData.slides}`
                                );
                                console.warn(
                                    `${LOG_PREFIX} loadLessons: This file might be in the OLD format (lesson_id/slides).`
                                );
                                skippedCount++;
                                continue;
                            }

                            console.log(`${LOG_PREFIX} loadLessons: parsed ${file} id=${lessonData.id} title="${lessonData.title}" slides=${lessonData.content?.length}`);
                            loadedLessons.push(lessonData);
                        } catch (e) {
                            console.error(`${LOG_PREFIX} loadLessons: JSON parse FAIL for ${file}`, e);
                            skippedCount++;
                        }
                    } else {
                        console.warn(`${LOG_PREFIX} loadLessons: empty content for ${file}`);
                        skippedCount++;
                    }
                }
            }

            // If files exist but ALL were skipped (old format), flag for re-download
            if (files.length > 0 && loadedLessons.length === 0 && skippedCount > 0) {
                console.warn(`${LOG_PREFIX} loadLessons: ⚠️ All ${skippedCount} lesson files are in old format. Needs re-download.`);
                setNeedsRedownload(true);
            } else {
                setNeedsRedownload(false);
            }

            // Sort lessons by numeric ID
            loadedLessons.sort((a, b) => {
                const getNum = (id: string) => {
                    const match = id.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 9999;
                };
                return getNum(a.id) - getNum(b.id);
            });

            console.log(`${LOG_PREFIX} loadLessons: DONE loaded ${loadedLessons.length} lessons:`,
                loadedLessons.map(l => l.id).join(', '));
            setLessons(loadedLessons);
        } catch (e) {
            console.error(`${LOG_PREFIX} loadLessons: FAIL`, e);
        }
    };

    return { lessons, loadLessons, needsRedownload };
};
