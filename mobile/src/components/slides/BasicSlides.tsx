import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SlideContent } from '../../types';
import { substituteVars, getTargetLangName } from '../../services/utils';
import { COLORS, FONTS } from '../../theme';

export const VocabularySlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    if (!data?.data || typeof data.data !== 'object') {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No vocabulary</Text>
            </View>
        );
    }
    const entries = Object.entries(data.data as Record<string, string>);

    return (
        <View style={styles.center}>
            {entries.map(([word, translation], i) => (
                <View key={`vocab-${i}`} style={styles.vocabRow}>
                    <Text style={styles.word}>{word}</Text>
                    <Text style={styles.translation}>{translation}</Text>
                </View>
            ))}
        </View>
    );
};

export const ExpressionSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    return (
        <View style={styles.center}>
            <Text style={styles.phrase}>{data.data?.phrase}</Text>
            <Text style={styles.meaning}>{data.data?.meaning}</Text>
        </View>
    );
};

export const GrammarSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    return (
        <View style={styles.center}>
            <Text style={styles.sectionTitle}>{data.title}</Text>
            <Text style={styles.body}>{data.explanation}</Text>
        </View>
    );
};

export const TipSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const langName = getTargetLangName();
    const text = substituteVars(data.text || '', { TARGET_LANG: langName });
    return (
        <View style={styles.center}>
            <View style={styles.tipBadge}>
                <Text style={styles.tipBadgeText}>Tip</Text>
            </View>
            <Text style={styles.body}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textLight,
        fontFamily: FONTS.sans,
    },
    vocabRow: {
        marginBottom: 28,
        alignItems: 'center',
    },
    word: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: FONTS.sans,
    },
    translation: {
        fontSize: 20,
        color: COLORS.textLight,
        textAlign: 'center',
        fontFamily: FONTS.sans,
    },
    phrase: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 14,
        fontFamily: FONTS.sans,
    },
    meaning: {
        fontSize: 18,
        color: COLORS.textLight,
        textAlign: 'center',
        fontFamily: FONTS.sans,
        lineHeight: 26,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 18,
        textAlign: 'center',
        fontFamily: FONTS.sans,
    },
    body: {
        fontSize: 17,
        lineHeight: 26,
        color: COLORS.text,
        textAlign: 'center',
        fontFamily: FONTS.sans,
        maxWidth: 320,
    },
    tipBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 16,
    },
    tipBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: FONTS.sans,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
