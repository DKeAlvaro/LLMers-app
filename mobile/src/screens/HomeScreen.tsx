import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLessons } from '../hooks/useLessons';
import { useApp } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, globalStyles } from '../theme';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { lessons } = useLessons();
    const { progress, settings } = useApp();

    const isLessonCompleted = (id: string) => progress.completed_lessons.includes(id);

    const renderItem = ({ item, index }: { item: any, index: number }) => {
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
                    {item.description || "Learn new concepts in this lesson."}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Elearn</Text>
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
                contentContainerStyle={styles.list}
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
        borderBottomColor: COLORS.border
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: 32,
        color: COLORS.primary,
        fontWeight: 'bold'
    },
    settingsLink: {
        color: COLORS.textLight,
        fontSize: 16,
        fontFamily: FONTS.sans,
        textDecorationLine: 'underline'
    },
    subHeader: {
        padding: 12,
        paddingHorizontal: 24,
        alignItems: 'center'
    },
    langInfo: {
        color: COLORS.secondary,
        fontSize: 12,
        fontFamily: FONTS.sans,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold'
    },
    list: {
        padding: 16
    },
    cardLocked: {
        backgroundColor: '#F0F0F0',
        borderColor: '#E0E0E0',
        opacity: 0.6
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center'
    },
    cardTitle: {
        fontFamily: FONTS.serif,
        fontSize: 20,
        color: COLORS.text,
        flex: 1,
        fontWeight: '500'
    },
    textLocked: {
        color: COLORS.textLight
    },
    cardDesc: {
        color: COLORS.textLight,
        fontSize: 15,
        fontFamily: FONTS.sans,
        lineHeight: 22
    },
    check: {
        color: COLORS.success,
        fontSize: 18,
        marginLeft: 8
    },
    lock: {
        fontSize: 16,
        marginLeft: 8,
        opacity: 0.5
    }
});
