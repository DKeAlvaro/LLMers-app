import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
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
        const { target_languages } = await GitHubService.getAvailableLanguages();
        setTargetLanguages(target_languages);
        setLoading(false);
    };

    const handleDownload = async () => {
        if (!selectedLang) return;

        setDownloading(true);
        try {
            await GitHubService.downloadLanguageFiles('en', selectedLang);

            const newSettings: AppSettings = {
                deepseek_api_key: null,
                selected_language: `en-${selectedLang}`
            };
            await setSettings(newSettings);
            await setIsFirstRun(false);

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to download lessons. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <View style={globalStyles.container}>
                <View style={localStyles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 10, fontFamily: FONTS.serif, color: COLORS.text }}>Loading catalog...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={localStyles.header}>
                <Text style={globalStyles.title}>Elearn</Text>
                <Text style={globalStyles.subtitle}>Select a course to download to your device.</Text>
            </View>

            <FlatList
                data={targetLanguages}
                keyExtractor={(item) => item}
                contentContainerStyle={localStyles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            localStyles.langItem,
                            selectedLang === item && localStyles.langItemSelected
                        ]}
                        onPress={() => setSelectedLang(item)}
                    >
                        <Text style={[
                            localStyles.langText,
                            selectedLang === item && localStyles.langTextSelected
                        ]}>
                            {item.toUpperCase()}
                        </Text>
                        {selectedLang === item && <Text style={{ color: COLORS.primary, fontSize: 18 }}>✓</Text>}
                    </TouchableOpacity>
                )}
            />

            <View style={localStyles.footer}>
                {downloading ? (
                    <View style={{ alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={{ fontFamily: FONTS.sans, color: COLORS.textLight, marginTop: 10 }}>Downloading assets...</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[globalStyles.button, !selectedLang && localStyles.buttonDisabled]}
                        disabled={!selectedLang}
                        onPress={handleDownload}
                    >
                        <Text style={globalStyles.buttonText}>START COURSE</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        padding: 40,
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: 24,
    },
    langItem: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 2,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderLeftWidth: 4, // Stylish accent
        borderLeftColor: COLORS.border
    },
    langItemSelected: {
        borderColor: COLORS.secondary, // Highlight border
        borderLeftColor: COLORS.secondary,
        backgroundColor: '#FFF',
    },
    langText: {
        fontSize: 18,
        fontFamily: FONTS.serif,
        color: COLORS.text,
        letterSpacing: 0.5
    },
    langTextSelected: {
        color: COLORS.primary,
        fontWeight: 'bold'
    },
    footer: {
        padding: 32,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background
    },
    buttonDisabled: {
        backgroundColor: COLORS.border,
        borderColor: COLORS.border
    }
});
