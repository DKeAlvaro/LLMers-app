import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SlideContent } from '../../types';
import { substituteVars, getTargetLangName } from '../../services/utils';

export const VocabularySlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    // data.data is { "word": "translation" }
    if (!data?.data || typeof data.data !== 'object') {
        return (
            <View style={styles.center}>
                <Text style={styles.title}>No vocabulary</Text>
            </View>
        );
    }
    const entries = Object.entries(data.data as Record<string, string>);

    return (
        <View style={styles.center}>
            {entries.map(([word, translation], i) => (
                <View key={`vocab-${i}`} style={styles.vocabRow}>
                    <Text style={styles.title}>{word}</Text>
                    <Text style={styles.translation}>{translation}</Text>
                </View>
            ))}
        </View>
    );
};

export const ExpressionSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    return (
        <View style={styles.center}>
            <Text style={styles.title}>{data.data?.phrase}</Text>
            <Text style={styles.explanation}>{data.data?.meaning}</Text>
        </View>
    );
};

export const GrammarSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    return (
        <View style={styles.center}>
            <Text style={styles.header}>{data.title}</Text>
            <Text style={styles.body}>{data.explanation}</Text>
        </View>
    );
};

export const TipSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const langName = getTargetLangName();
    const text = substituteVars(data.text || '', { TARGET_LANG: langName });
    return (
        <View style={styles.center}>
            <Text style={styles.icon}>💡</Text>
            <Text style={styles.body}>{text}</Text>
        </View>
    );
};

// ... other simple slides

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    vocabRow: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16
    },
    translation: {
        fontSize: 24,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center'
    },
    explanation: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 10
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    body: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center'
    },
    icon: {
        fontSize: 48,
        marginBottom: 20
    }
});
