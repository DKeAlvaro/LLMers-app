import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { GitHubService } from '../services/github';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSettings } from '../types';
import { COLORS, FONTS, globalStyles } from '../theme';

export const LanguageSelectionScreen = () => {
    const { setIsFirstRun, setSettings } = useApp();
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
    const [selectedLang, setSelectedLang] = useState<string | null>(null);

    useEffect(() => {
        loadLanguages();
    }, []);

    const loadLanguages = async () => {
        setLoading(true);
        console.log('[SETUP] loadLanguages: fetching catalog...');
        const { target_languages } = await GitHubService.getAvailableLanguages();
        console.log('[SETUP] loadLanguages: got', target_languages);
        setTargetLanguages(target_languages);
        setLoading(false);
    };

    const handleDownload = async () => {
        if (!selectedLang) return;
        console.log(`[SETUP] handleDownload: downloading ${selectedLang}...`);

        setDownloading(true);
        try {
            await GitHubService.downloadLanguageFiles('en', selectedLang);
            console.log('[SETUP] handleDownload: download complete');

            const newSettings: AppSettings = {
                deepseek_api_key: null,
                selected_language: `en-${selectedLang}`,
            };
            console.log(`[SETUP] handleDownload: saving settings lang=${newSettings.selected_language}`);
            await setSettings(newSettings);
            await setIsFirstRun(false);
            console.log('[SETUP] handleDownload: done, navigating to Home');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to download lessons. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <View style={globalStyles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading catalog...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={globalStyles.title}>llmers</Text>
                <Text style={globalStyles.subtitle}>Choose a language to start learning.</Text>
            </View>

            <FlatList
                data={targetLanguages}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const isSelected = selectedLang === item;
                    return (
                        <TouchableOpacity
                            style={[styles.langItem, isSelected && styles.langItemSelected]}
                            onPress={() => setSelectedLang(item)}
                        >
                            <Text
                                style={[styles.langText, isSelected && styles.langTextSelected]}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                            {isSelected && <View style={styles.radio} />}
                        </TouchableOpacity>
                    );
                }}
            />

            <View style={styles.footer}>
                {downloading ? (
                    <View style={styles.downloading}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={styles.downloadingText}>Downloading lessons...</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[globalStyles.button, !selectedLang && styles.btnDisabled]}
                        disabled={!selectedLang}
                        onPress={handleDownload}
                    >
                        <Text style={globalStyles.buttonText}>Start course</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        fontSize: 14,
    },
    header: {
        padding: 32,
        paddingBottom: 20,
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: 20,
    },
    langItem: {
        backgroundColor: COLORS.surface,
        padding: 18,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    langItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.muted,
    },
    langText: {
        fontSize: 17,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.text,
    },
    langTextSelected: {
        color: COLORS.primary,
    },
    radio: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    footer: {
        padding: 24,
        paddingTop: 12,
    },
    btnDisabled: {
        opacity: 0.4,
    },
    downloading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
    },
    downloadingText: {
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        fontSize: 14,
    },
});
