import React from 'react';
import { View, Text } from 'react-native';
import { SlideContent } from '../../types';
import { VocabularySlide, ExpressionSlide, GrammarSlide, TipSlide } from './BasicSlides';
import { LLMCheckSlide, InteractiveScenarioSlide, ScriptedRoleplaySlide } from './LLMSlides';

export const SlideRenderer: React.FC<{ slide: SlideContent }> = ({ slide }) => {
    switch (slide.type) {
        case 'vocabulary': return <VocabularySlide data={slide} />;
        case 'expression': return <ExpressionSlide data={slide} />;
        case 'grammar': return <GrammarSlide data={slide} />;
        case 'tip': return <TipSlide data={slide} />;
        case 'llm_check': return <LLMCheckSlide data={slide} />;
        case 'interactive_scenario': return <InteractiveScenarioSlide data={slide} />;
        case 'scripted_roleplay': return <ScriptedRoleplaySlide data={slide} />;
        default:
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Slide Type Not Implemented: {slide.type}</Text>
                </View>
            );
    }
};
