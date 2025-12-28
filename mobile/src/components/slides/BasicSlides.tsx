import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SlideContent } from '../../types';

export const VocabularySlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    // data.data is { "word": "translation" }
    const entries = Object.entries((data.data || {}) as Record<string, string>);
    const [word, translation] = entries[0] || ["", ""];

    return (
        <View style={styles.center}>
            <Text style={styles.title}>{word}</Text>
            <Text style={styles.translation}>{translation}</Text>
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
    return (
        <View style={styles.center}>
            <Text style={styles.icon}>💡</Text>
            <Text style={styles.body}>{data.text}</Text>
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
