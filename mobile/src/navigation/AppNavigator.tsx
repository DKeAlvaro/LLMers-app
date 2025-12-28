import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { ActivityIndicator, View } from 'react-native';

// Parameters for the stack
export type RootStackParamList = {
    LanguageSelection: undefined;
    Home: undefined;
    Lesson: { lessonId: string };
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens (we will implement them next)
import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export const AppNavigator = () => {
    const { isLoading, isFirstRun } = useApp();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isFirstRun ? (
                    <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Lesson" component={LessonScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
