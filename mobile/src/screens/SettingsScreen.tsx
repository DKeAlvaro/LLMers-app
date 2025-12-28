import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, globalStyles } from '../theme';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const { settings, setSettings, setIsFirstRun, resetApp } = useApp();
    const [apiKey, setApiKey] = useState(settings.deepseek_api_key || '');

    const handleSave = async () => {
        await setSettings({ ...settings, deepseek_api_key: apiKey.trim() || null });
        Alert.alert("Success", "Settings saved.");
    };

    const handleClear = async () => {
        setApiKey('');
        await setSettings({ ...settings, deepseek_api_key: null });
        Alert.alert("Cleared", "API Key cleared.");
    };

    const handleReset = async () => {
        Alert.alert(
            "Reset App",
            "This will clear all progress. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await setIsFirstRun(true);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={localStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={localStyles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={localStyles.title}>Settings</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={localStyles.content}>
                <View style={globalStyles.card}>
                    <Text style={localStyles.cardTitle}>DeepSeek API Key</Text>
                    <Text style={localStyles.info}>
                        Enter your key to enable advanced AI features.
                    </Text>

                    <TextInput
                        style={globalStyles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="sk-..."
                        placeholderTextColor={COLORS.textLight}
                        autoCapitalize="none"
                        secureTextEntry
                    />

                    <View style={localStyles.buttons}>
                        <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
                            <Text style={globalStyles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[globalStyles.button, { backgroundColor: 'transparent', borderColor: COLORS.error }]}
                            onPress={handleClear}
                        >
                            <Text style={[globalStyles.buttonText, { color: COLORS.error }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={globalStyles.card}>
                    <Text style={localStyles.cardTitle}>Data Management</Text>
                    <Text style={localStyles.info}>
                        Current Course: {settings.selected_language}
                    </Text>

                    <TouchableOpacity
                        style={[globalStyles.button, { backgroundColor: 'transparent', borderColor: COLORS.secondary, marginTop: 16 }]}
                        onPress={handleReset}
                    >
                        <Text style={[globalStyles.buttonText, { color: COLORS.secondary }]}>RESET APP DATA</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    backButton: {
        color: COLORS.textLight,
        fontSize: 16,
        fontFamily: FONTS.sans
    },
    title: {
        fontSize: 20,
        fontFamily: FONTS.serif,
        fontWeight: 'bold',
        color: COLORS.text
    },
    content: {
        padding: 20
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: FONTS.serif,
        marginBottom: 10,
        color: COLORS.primary
    },
    info: {
        color: COLORS.text,
        marginBottom: 16,
        lineHeight: 22,
        fontFamily: FONTS.sans
    },
    buttons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8
    }
});
