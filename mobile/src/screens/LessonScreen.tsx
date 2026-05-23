import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
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
                    [lessonId]: currentIndex,
                },
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
            completed_lessons: [...progress.completed_lessons, lessonId],
        });
        Alert.alert('Lesson Complete', 'Well done!', [
            { text: 'Continue', onPress: () => navigation.goBack() },
        ]);
    };

    if (!currentLesson) {
        return (
            <View style={[globalStyles.container, styles.center]}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const currentSlide = currentLesson.content[currentIndex];
    const isLast = currentIndex === currentLesson.content.length - 1;
    const isFirst = currentIndex === 0;
    const total = currentLesson.content.length;

    return (
        <SafeAreaView style={globalStyles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.counter}>
                    {currentIndex + 1} / {total}
                </Text>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
                </View>
            </View>

            {/* Slide content */}
            <View style={styles.content}>
                <SlideRenderer slide={currentSlide} />
            </View>

            {/* Bottom navigation */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.navBtn, styles.prevBtn, isFirst && styles.navBtnDisabled]}
                    onPress={handlePrev}
                    disabled={isFirst}
                >
                    <Text style={[styles.navBtnText, styles.prevText]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navBtn, styles.nextBtn]}
                    onPress={handleNext}
                >
                    <Text style={[styles.navBtnText, styles.nextText]}>
                        {isLast ? 'Finish' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        fontSize: 15,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    backBtn: {
        paddingVertical: 4,
    },
    backText: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    counter: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.textLight,
        minWidth: 48,
        textAlign: 'center',
    },
    progressTrack: {
        flex: 1,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    content: {
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 24,
        gap: 12,
    },
    navBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    prevBtn: {
        backgroundColor: COLORS.muted,
    },
    nextBtn: {
        backgroundColor: COLORS.primary,
    },
    navBtnDisabled: {
        opacity: 0.4,
    },
    navBtnText: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        fontWeight: '700',
    },
    prevText: {
        color: COLORS.text,
    },
    nextText: {
        color: '#FFF',
    },
});
