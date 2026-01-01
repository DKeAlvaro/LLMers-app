import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FileSystemService } from '../services/filesystem';
import { Lesson } from '../types';

export const useLessons = () => {
    const { settings, progress } = useApp();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);


    useEffect(() => {
        loadLessons();
    }, [settings.selected_language]);

    const loadLessons = async () => {
        const langCode = settings.selected_language; // e.g. "en-dutch"
        if (!langCode) return;

        const parts = langCode.split('-'); // ["en", "dutch"]
        if (parts.length < 2) return;

        const uiLang = parts[0];     // "en"
        const targetFolder = parts[1]; // "dutch"

        // Find the correct subfolder (e.g. "en-nl") inside "lessons/dutch/"
        const parentPath = `lessons/${targetFolder}/`;
        const subdirs = await FileSystemService.listFiles(parentPath);

        // Look for any folder starting with "{uiLang}-"
        const correctSubdir = subdirs.find(d => d.startsWith(`${uiLang}-`));

        if (!correctSubdir) {
            // If data isn't downloaded yet or mismatch, just return empty
            console.log(`No lessons found for ${langCode} in ${parentPath}`);
            setLessons([]);
            return;
        }

        const path = `lessons/${targetFolder}/${correctSubdir}/`;

        try {
            const files = await FileSystemService.listFiles(path);
            const loadedLessons: Lesson[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await FileSystemService.loadFile(path + file);
                    if (content) {
                        try {
                            const lessonData = JSON.parse(content);
                            loadedLessons.push(lessonData);
                        } catch (e) {
                            console.error("Error parsing lesson", file, e);
                        }
                    }
                }
            }

            // Sort lessons
            loadedLessons.sort((a, b) => {
                const getNum = (id: string) => {
                    const match = id.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 9999;
                };
                return getNum(a.id) - getNum(b.id);
            });

            setLessons(loadedLessons);
        } catch (e) {
            console.error("Error loading lessons from", path, e);
        }
    };

    return { lessons, loadLessons };
};
