import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, globalStyles } from '../theme';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const { settings, setSettings, setIsFirstRun } = useApp();
    const [apiKey, setApiKey] = useState(settings.deepseek_api_key || '');

    const handleSave = async () => {
        await setSettings({ ...settings, deepseek_api_key: apiKey.trim() || null });
        Alert.alert('Saved', 'API key updated.');
    };

    const handleClear = async () => {
        setApiKey('');
        await setSettings({ ...settings, deepseek_api_key: null });
        Alert.alert('Cleared', 'API key removed.');
    };

    const handleReset = async () => {
        Alert.alert('Reset app', 'This will clear all progress and downloaded data.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await setIsFirstRun(true);
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body}>
                {/* API Key */}
                <Text style={styles.sectionLabel}>API Key</Text>
                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>DeepSeek API Key</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="sk-..."
                        placeholderTextColor={COLORS.textLight}
                        autoCapitalize="none"
                        secureTextEntry
                    />
                    <View style={styles.actions}>
                        <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
                            <Text style={globalStyles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[globalStyles.outlineButton, { borderColor: COLORS.error }]}
                            onPress={handleClear}
                        >
                            <Text style={[globalStyles.outlineButtonText, { color: COLORS.error }]}>
                                Clear
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Data */}
                <Text style={styles.sectionLabel}>Data</Text>
                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>Current course</Text>
                    <Text style={styles.fieldValue}>{settings.selected_language}</Text>

                    <TouchableOpacity
                        style={[globalStyles.outlineButton, { marginTop: 16, borderColor: COLORS.error }]}
                        onPress={handleReset}
                    >
                        <Text style={[globalStyles.outlineButtonText, { color: COLORS.error }]}>
                            Reset all data
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backText: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    title: {
        fontSize: 18,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.text,
    },
    body: {
        padding: 20,
        paddingTop: 8,
    },
    sectionLabel: {
        fontSize: 12,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 14,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 18,
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 14,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    fieldValue: {
        fontSize: 14,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
    },
});
