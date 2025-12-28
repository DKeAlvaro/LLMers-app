import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLessons } from '../hooks/useLessons';
import { useApp } from '../context/AppContext';
import { SlideRenderer } from '../components/slides/SlideRenderer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lesson } from '../types';
import { COLORS, FONTS, globalStyles } from '../theme';

type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;

export const LessonScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<LessonScreenRouteProp>();
    const { lessonId } = route.params;

    const { lessons } = useLessons();
    const { updateProgress, progress } = useApp();

    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const found = lessons.find(l => l.id === lessonId);
        if (found) {
            setCurrentLesson(found);
            if (progress.lesson_slide_positions[lessonId]) {
                setCurrentIndex(progress.lesson_slide_positions[lessonId]);
            }
        }
    }, [lessonId, lessons]);

    useEffect(() => {
        if (currentLesson) {
            updateProgress({
                lesson_slide_positions: {
                    ...progress.lesson_slide_positions,
                    [lessonId]: currentIndex
                }
            });
        }
    }, [currentIndex, currentLesson]);

    const handleNext = () => {
        if (!currentLesson) return;
        if (currentIndex < currentLesson.content.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            finishLesson();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const finishLesson = async () => {
        await updateProgress({
            completed_lessons: [...progress.completed_lessons, lessonId]
        });
        Alert.alert("Lesson Complete", "Well done!", [
            { text: "Continue", onPress: () => navigation.goBack() }
        ]);
    };

    if (!currentLesson) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading lesson...</Text>
            </View>
        );
    }

    const currentSlide = currentLesson.content[currentIndex];
    const progressPercent = (currentIndex / currentLesson.content.length) * 100;

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={localStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={localStyles.backButton}>← Exit</Text>
                </TouchableOpacity>
                <View style={localStyles.progressBar}>
                    <View style={[localStyles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
            </View>

            <View style={localStyles.content}>
                <SlideRenderer slide={currentSlide} />
            </View>

            <View style={localStyles.footer}>
                <TouchableOpacity
                    style={[localStyles.navBtn, currentIndex === 0 && localStyles.disabled]}
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <Text style={localStyles.navBtnText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[localStyles.navBtn, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                    onPress={handleNext}
                >
                    <Text style={[localStyles.navBtnText, { color: 'white' }]}>
                        {currentIndex === currentLesson.content.length - 1 ? "Finish" : "Next"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    backButton: {
        fontSize: 16,
        color: COLORS.textLight,
        marginRight: 24,
        fontFamily: FONTS.sans
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.secondary
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 2,
        minWidth: 110,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.textLight
    },
    disabled: {
        opacity: 0.3,
        borderColor: COLORS.border
    },
    navBtnText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: FONTS.sans,
        letterSpacing: 0.5
    }
});
