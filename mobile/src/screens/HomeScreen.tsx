import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLessons } from '../hooks/useLessons';
import { useApp } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, globalStyles } from '../theme';

const LOG_PREFIX = '[HOME]';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { lessons, needsRedownload } = useLessons();
    const { progress, settings, setIsFirstRun } = useApp();

    console.log(`${LOG_PREFIX} render: lessons=${lessons.length} lang="${settings.selected_language}"`);

    const isLessonCompleted = (id: string) => progress.completed_lessons.includes(id);

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const completed = isLessonCompleted(item.id);
        const isLocked = index > 0 && !isLessonCompleted(lessons[index - 1].id);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    if (!isLocked) {
                        navigation.navigate('Lesson', { lessonId: item.id, lessonTitle: item.title });
                    }
                }}
                disabled={isLocked}
            >
                <View style={styles.cardLeft}>
                    <Text style={[styles.cardIndex, completed && styles.cardIndexDone]}>
                        {completed ? 'Done' : String(index + 1)}
                    </Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, isLocked && styles.textLocked]}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.description || 'Learn new concepts in this lesson.'}
                    </Text>
                </View>
                <View style={styles.cardRight}>
                    {completed && <View style={styles.doneDot} />}
                    {isLocked && <Text style={styles.lockedLabel}>Locked</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        const isOutdated = needsRedownload;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                    {isOutdated ? 'Outdated format' : 'No lessons yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {isOutdated
                        ? 'Lesson data needs to be updated to the latest format.'
                        : 'Download a language course to get started.'}
                </Text>
                <TouchableOpacity
                    style={[globalStyles.button, { marginTop: 20 }]}
                    onPress={async () => {
                        console.log(`${LOG_PREFIX} re-download requested`);
                        await setIsFirstRun(true);
                    }}
                >
                    <Text style={globalStyles.buttonText}>Download lessons</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const langName = settings.selected_language?.split('-')[1] || '';

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>llmers</Text>
                    <Text style={styles.headerLang}>{langName}</Text>
                </View>
                <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.settingsLabel}>Settings</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={lessons}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={lessons.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={renderEmpty}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 30,
        fontFamily: FONTS.sans,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    headerLang: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        color: COLORS.accent,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    settingsBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: COLORS.muted,
    },
    settingsLabel: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        paddingTop: 4,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        padding: 32,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    cardLeft: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardIndex: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    cardIndexDone: {
        fontSize: 11,
        color: COLORS.success,
        fontWeight: '600',
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 3,
    },
    textLocked: {
        color: COLORS.textLight,
    },
    cardDesc: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    cardRight: {
        marginLeft: 10,
        alignItems: 'center',
    },
    doneDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.success,
    },
    lockedLabel: {
        fontSize: 11,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.textLight,
    },
});
