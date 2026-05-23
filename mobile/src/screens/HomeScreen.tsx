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
                style={[globalStyles.card, isLocked && styles.cardLocked]}
                onPress={() => {
                    if (!isLocked) {
                        navigation.navigate('Lesson', { lessonId: item.id, lessonTitle: item.title });
                    }
                }}
                disabled={isLocked}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, isLocked && styles.textLocked]}>{item.title}</Text>
                    {completed && <Text style={styles.check}>✓</Text>}
                    {isLocked && <Text style={styles.lock}>🔒</Text>}
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description || 'Learn new concepts in this lesson.'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (needsRedownload) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>⚠️ Outdated lesson format</Text>
                    <Text style={styles.emptySubtitle}>
                        The lessons on this device use an old format that is no longer supported.
                        Re-download to get the latest versions.
                    </Text>
                    <TouchableOpacity
                        style={[globalStyles.button, { marginTop: 24, backgroundColor: COLORS.secondary }]}
                        onPress={async () => {
                            console.log(`${LOG_PREFIX} re-download requested (old format detected)`);
                            await setIsFirstRun(true);
                        }}
                    >
                        <Text style={globalStyles.buttonText}>RE-DOWNLOAD LESSONS</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No lessons found</Text>
                <Text style={styles.emptySubtitle}>
                    Lesson data has not been downloaded yet, or was cleared when the cache was reset.
                </Text>
                <TouchableOpacity
                    style={[globalStyles.button, { marginTop: 24 }]}
                    onPress={async () => {
                        console.log(`${LOG_PREFIX} re-download requested`);
                        await setIsFirstRun(true);
                    }}
                >
                    <Text style={globalStyles.buttonText}>DOWNLOAD LESSONS</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>llmers</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.settingsLink}>Settings</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.subHeader}>
                <Text style={styles.langInfo}>Current Language: {settings.selected_language}</Text>
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
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: 32,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    settingsLink: {
        color: COLORS.textLight,
        fontSize: 16,
        fontFamily: FONTS.sans,
        textDecorationLine: 'underline',
    },
    subHeader: {
        padding: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    langInfo: {
        color: COLORS.secondary,
        fontSize: 12,
        fontFamily: FONTS.sans,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        padding: 32,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: FONTS.serif,
        color: COLORS.text,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 22,
    },
    cardLocked: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
        opacity: 0.6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: FONTS.serif,
        fontSize: 20,
        color: COLORS.text,
        flex: 1,
        fontWeight: '500',
    },
    textLocked: {
        color: COLORS.textLight,
    },
    cardDesc: {
        color: COLORS.textLight,
        fontSize: 15,
        fontFamily: FONTS.sans,
        lineHeight: 22,
    },
    check: {
        color: COLORS.success,
        fontSize: 18,
        marginLeft: 8,
    },
    lock: {
        fontSize: 16,
        marginLeft: 8,
        opacity: 0.5,
    },
});
