import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SlideContent } from '../../types';
import { LLMService } from '../../api/llm';
import { substituteVars, extractJson } from '../../services/utils';
import { COLORS, FONTS, globalStyles } from '../../theme';

export const LLMCheckSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        if (!answer.trim()) return;
        setLoading(true);
        try {
            // We simulate the prompt structure from Python client
            const messages = [
                { role: 'system' as const, content: "You are a friendly language teacher. Correct the user's answer." },
                { role: 'user' as const, content: `Question: ${data.chatbot_message}\nAnswer: ${answer}` }
            ];

            const response = await LLMService.chatCompletion(messages, 100);
            setFeedback(response);
        } catch (e) {
            setFeedback("Error contacting AI.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.question}>{data.chatbot_message}</Text>

            <TextInput
                style={styles.input}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Type your answer..."
                multiline
            />

            <TouchableOpacity style={styles.button} onPress={handleCheck} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Check with AI</Text>}
            </TouchableOpacity>

            {feedback && (
                <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackTitle}>Feedback:</Text>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
            )}
        </ScrollView>
    );
};



export const InteractiveScenarioSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const conversationFlow = data.conversation_flow || [];
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, translation?: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [extractedVars, setExtractedVars] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<string | null>(null);

    // Translation popover state
    const [translation, setTranslation] = useState<{ original: string, translated: string } | null>(null);

    // Initialize with the first bot message from conversation_flow
    React.useEffect(() => {
        if (conversationFlow.length > 0 && !initialized) {
            const firstMsg = substituteVars(conversationFlow[0].chatbot_message, extractedVars);
            setMessages([{
                role: 'assistant',
                content: firstMsg,
                translation: conversationFlow[0].translation
            }]);
            setInitialized(true);
        }
    }, [conversationFlow.length > 0 && conversationFlow[0]?.chatbot_message, initialized]);

    const handleSentenceClick = (sentence: string, translationText?: string) => {
        if (!translationText) return;
        setTranslation({ original: sentence, translated: translationText });
        setTimeout(() => setTranslation(null), 5000);
    };

    const handleSend = async () => {
        if (!input.trim() || loading || isComplete) return;

        const userMsg = input.trim();
        setInput('');
        setFeedback(null);
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);
        setTranslation(null);

        const step = conversationFlow[currentStep];
        if (!step) {
            setLoading(false);
            return;
        }

        try {
            // Step 1: If this step has extract_info, extract it from the user's message
            let newVars = { ...extractedVars };
            if (step.extract_info) {
                const instructionLines = Object.entries(step.extract_info)
                    .map(([key, desc]) => `- ${key}: ${desc}`)
                    .join('\n');

                const extractMessages = [
                    {
                        role: 'system' as const,
                        content: 'You are an information extraction assistant learning Dutch. Extract the requested information from the user\'s message. Respond with ONLY a JSON object. If you cannot extract a value, use null.'
                    },
                    {
                        role: 'user' as const,
                        content: `Extract the following from the user\'s message:\n${instructionLines}\n\nUser message: "${userMsg}"\n\nRespond with JSON.`
                    }
                ];

                try {
                    const extractResult = await LLMService.chatCompletion(extractMessages, 100);
                    const parsed = extractJson(extractResult);
                    if (parsed && typeof parsed === 'object') {
                        // Only store non-null values
                        const cleaned: Record<string, string> = {};
                        for (const [k, v] of Object.entries(parsed)) {
                            if (v !== null && v !== undefined) cleaned[k] = String(v);
                        }
                        newVars = { ...newVars, ...cleaned };
                        setExtractedVars(newVars);
                    }
                } catch {
                    // Extraction failed silently; continue with existing vars
                }
            }

            // Step 2: Evaluate if the user's response is appropriate
            const evaluated = await LLMService.chatCompletion([
                {
                    role: 'system' as const,
                    content: `You are a friendly language tutor evaluating a student's response in a Dutch conversation. The scenario: "${data.setting}". Your task: the student should have: "${step.title}". Evaluate whether their response makes conversational sense. Be encouraging. The student is a beginner so be lenient. Respond with JSON: {"acceptable": true, "feedback": "encouraging message"} or {"acceptable": false, "feedback": "gentle hint on what to improve"}`
                },
                {
                    role: 'user' as const,
                    content: `The bot said: "${step.chatbot_message}"\nExpected action: "${step.title}"\nStudent replied: "${userMsg}"\n\nIs this acceptable?`
                }
            ], 150);

            const evaluation = extractJson(evaluated);
            const acceptable = evaluation?.acceptable !== false;

            if (acceptable) {
                // Advance to next step or complete
                if (currentStep < conversationFlow.length - 1) {
                    const nextIdx = currentStep + 1;
                    const nextStep = conversationFlow[nextIdx];
                    const nextMsg = substituteVars(nextStep.chatbot_message, newVars);
                    setCurrentStep(nextIdx);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: nextMsg,
                        translation: nextStep.translation
                    }]);
                } else {
                    setIsComplete(true);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '✅ Well done! You completed this conversation.'
                    }]);
                }
                // Show positive feedback as a brief toast
                if (evaluation?.feedback) {
                    setFeedback(evaluation.feedback);
                    setTimeout(() => setFeedback(null), 3000);
                }
            } else {
                // Don't advance — show feedback and let user retry
                const retryMsg = evaluation?.feedback || 'Almost! Try again with a response that fits the conversation.';
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `💬 ${retryMsg}`
                }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const currentHint = !isComplete ? conversationFlow[currentStep]?.title || '' : '';

    const renderMessageContent = (m: { role: 'user' | 'assistant', content: string, translation?: string }) => {
        if (m.role === 'user') {
            return <Text style={[chatStyles.dialogueText, chatStyles.yourDialogue]}>"{m.content}"</Text>;
        }

        const isFeedback = m.content.startsWith('💬') || m.content.startsWith('✅');
        return (
            <TouchableOpacity
                activeOpacity={m.translation ? 0.7 : 1}
                onPress={() => m.translation ? handleSentenceClick(m.content, m.translation) : undefined}
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    paddingLeft: isFeedback ? 0 : 12,
                    borderLeftWidth: isFeedback ? 0 : 2,
                    borderLeftColor: isFeedback ? 'transparent' : '#E0D8C8'
                }}
            >
                <Text style={[chatStyles.dialogueText, isFeedback && chatStyles.feedbackText]}>
                    {m.content.startsWith('💬') || m.content.startsWith('✅') ? m.content : `"${m.content}"`}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={chatStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            {/* Narrative header */}
            <View style={chatStyles.chapterHeader}>
                <Text style={chatStyles.chapterNumber}>— SCENE —</Text>
                <Text style={chatStyles.chapterTitle}>{data.title}</Text>
                <Text style={chatStyles.settingText}>{data.setting}</Text>
            </View>

            {/* Feedback toast */}
            {feedback && (
                <View style={chatStyles.feedbackToast}>
                    <Text style={chatStyles.feedbackToastText}>{feedback}</Text>
                </View>
            )}

            {/* Translation Popover */}
            {translation && (
                <View style={chatStyles.translationFloat}>
                    <Text style={chatStyles.translationOriginal}>{translation.original}</Text>
                    <Text style={chatStyles.translationArrow}>→</Text>
                    <Text style={chatStyles.translationResult}>{translation.translated}</Text>
                </View>
            )}

            {/* Conversation */}
            <ScrollView
                style={chatStyles.dialogueScroll}
                contentContainerStyle={chatStyles.dialogueContent}
                ref={scrollRef => {
                    if (scrollRef) {
                        setTimeout(() => scrollRef.scrollToEnd({ animated: true }), 100);
                    }
                }}
            >
                {messages.map((m, i) => (
                    <View key={`msg-${i}`} style={chatStyles.dialogueLine}>
                        <Text style={chatStyles.speakerName}>
                            {m.role === 'assistant' ? '👤' : 'You'}
                        </Text>
                        {renderMessageContent(m)}
                    </View>
                ))}

                {loading && (
                    <View style={chatStyles.dialogueLine}>
                        <Text style={chatStyles.speakerName}>👤</Text>
                        <Text style={chatStyles.thinkingText}>...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Prompt area */}
            {!isComplete && (
                <View style={chatStyles.promptArea}>
                    {currentHint && (
                        <Text style={chatStyles.stageDirection}>{currentHint}</Text>
                    )}
                    <View style={chatStyles.inputRow}>
                        <TextInput
                            style={chatStyles.scriptInput}
                            value={input}
                            onChangeText={setInput}
                            placeholder="What do you say?"
                            placeholderTextColor="#999"
                            multiline
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[chatStyles.speakBtn, loading && chatStyles.speakBtnDisabled]}
                            onPress={handleSend}
                            disabled={loading}
                        >
                            <Text style={chatStyles.speakBtnText}>→</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isComplete && (
                <View style={chatStyles.completeFooter}>
                    <Text style={chatStyles.completeText}>Scenario Complete ✓</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

// Immersive chat styles - storybook/screenplay aesthetic
const chatStyles = StyleSheet.create({
    translationFloat: {
        position: 'absolute',
        top: 110, // Below header
        alignSelf: 'center',
        backgroundColor: '#2C2416',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        zIndex: 100,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    translationOriginal: {
        color: '#A09080',
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        fontSize: 14,
    },
    translationArrow: {
        color: '#666',
        marginHorizontal: 8,
        fontSize: 12,
    },
    translationResult: {
        color: '#FFF',
        fontFamily: FONTS.sans,
        fontWeight: 'bold',
        fontSize: 14,
    },
    container: {
        flex: 1,
        backgroundColor: '#FAF8F3', // Warm paper
    },
    chapterHeader: {
        paddingVertical: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E4DB',
        borderStyle: 'dashed' as any,
    },
    chapterNumber: {
        fontSize: 11,
        letterSpacing: 3,
        color: '#A09080',
        fontFamily: FONTS.sans,
        marginBottom: 8,
    },
    chapterTitle: {
        fontSize: 22,
        fontFamily: FONTS.serif,
        color: '#2C2416',
        textAlign: 'center',
        fontWeight: '500',
    },
    settingText: {
        fontSize: 14,
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        color: '#6B5D4D',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    dialogueScroll: {
        flex: 1,
    },
    dialogueContent: {
        padding: 24,
        paddingTop: 20,
    },
    dialogueLine: {
        marginBottom: 20,
    },
    speakerName: {
        fontSize: 12,
        fontFamily: FONTS.sans,
        color: '#8B7355',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    dialogueText: {
        fontSize: 18,
        fontFamily: FONTS.serif,
        color: '#2C2416',
        lineHeight: 26,
    },
    yourDialogue: {
        color: '#1A4A3A', // Darker green for your words
        borderLeftColor: '#A8C4A0',
        paddingLeft: 12,
        borderLeftWidth: 2,
    },
    thinkingText: {
        fontSize: 16,
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        color: '#A09080',
        paddingLeft: 12,
    },
    promptArea: {
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E8E4DB',
        backgroundColor: '#F5F2EA',
    },
    stageDirection: {
        fontSize: 13,
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        color: '#8B6914',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    scriptInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: '#FFFEFA',
        borderWidth: 1,
        borderColor: '#D8D0C0',
        borderRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: FONTS.serif,
        color: '#2C2416',
        marginRight: 10,
    },
    speakBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#2C2416',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speakBtnDisabled: {
        backgroundColor: '#C0B8A8',
    },
    speakBtnText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '300',
    },
    feedbackToast: {
        position: 'absolute',
        top: 110,
        alignSelf: 'center',
        backgroundColor: '#2C4F2C',
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 16,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    feedbackToastText: {
        color: '#FFF',
        fontFamily: FONTS.sans,
        fontSize: 13,
        textAlign: 'center',
    },
    feedbackText: {
        color: '#2C4F2C',
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        fontSize: 15,
        lineHeight: 22,
    },
    completeFooter: {
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E8E4DB',
        backgroundColor: '#F5F2EA',
        alignItems: 'center',
    },
    completeText: {
        fontSize: 16,
        fontFamily: FONTS.serif,
        color: '#556B2F',
        fontWeight: '500',
    },
});

// Original styles for other components (LLMCheckSlide)
const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center'
    },
    question: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONTS.serif,
        color: COLORS.text
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
        backgroundColor: '#FFF',
        fontFamily: FONTS.sans,
        color: COLORS.text
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 4,
        width: '100%',
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: FONTS.sans
    },
    feedbackBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 4,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    feedbackTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: COLORS.primary,
        fontFamily: FONTS.serif
    },
    feedbackText: {
        color: COLORS.text,
        lineHeight: 20,
        fontFamily: FONTS.sans
    },
});


// ScriptedRoleplaySlide Component

export const ScriptedRoleplaySlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'pass' | 'fail'>('idle');
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCheck = async () => {
        if (!input.trim()) return;
        setStatus('checking');

        try {
            const systemPrompt = data.system_prompt || "You are a language tutor. Check if the user's response is grammatically correct and uses the required concept.";
            const messages = [
                { role: 'system' as const, content: systemPrompt },
                { role: 'user' as const, content: `Context: Bot said "${data.bot_line}". Goal: "${data.expected_concept}". User replied: "${input}". Is this valid? Reply with JSON: {"valid": boolean, "feedback": "string"}` }
            ];

            const response = await LLMService.chatCompletion(messages, 150);

            // Try parse JSON
            let valid = false;
            let feedbackText = response;
            try {
                // Heuristic: find first '{' and last '}'
                const start = response.indexOf('{');
                const end = response.lastIndexOf('}');
                if (start >= 0 && end >= 0) {
                    const json = JSON.parse(response.substring(start, end + 1));
                    valid = json.valid;
                    feedbackText = json.feedback;
                } else {
                    // Fallback text analysis
                    valid = response.toLowerCase().includes("valid") || response.toLowerCase().includes("correct");
                }
            } catch (e) {
                // If parsing fails, just show raw response
            }

            setFeedback(feedbackText);
            setStatus(valid ? 'pass' : 'fail');

        } catch (e) {
            setFeedback("Error checking response.");
            setStatus('fail');
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 20, color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>
                {data.setting || "Roleplay"}
            </Text>

            <View style={[globalStyles.card, { backgroundColor: COLORS.background, borderColor: COLORS.secondary }]}>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: COLORS.text, fontStyle: 'italic', textAlign: 'center' }}>
                    "{data.bot_line}"
                </Text>
            </View>

            <Text style={{ marginTop: 16, marginBottom: 8, fontFamily: FONTS.sans, color: COLORS.textLight }}>
                Reply using: <Text style={{ fontWeight: 'bold', color: COLORS.text }}>{data.expected_concept}</Text>
            </Text>

            <TextInput
                style={[globalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                value={input}
                onChangeText={(t) => { setInput(t); setStatus('idle'); }}
                placeholder="Type your response..."
                placeholderTextColor={COLORS.textLight}
                multiline
            />

            <TouchableOpacity
                style={[globalStyles.button, { marginTop: 16, opacity: status === 'checking' ? 0.7 : 1 }]}
                onPress={handleCheck}
                disabled={status === 'checking'}
            >
                <Text style={globalStyles.buttonText}>
                    {status === 'checking' ? "Checking..." : "Submit"}
                </Text>
            </TouchableOpacity>

            {status !== 'idle' && (
                <View style={[
                    globalStyles.card,
                    { marginTop: 24, backgroundColor: status === 'pass' ? '#F0F4F0' : '#FFF0F0', borderColor: status === 'pass' ? COLORS.success : COLORS.error }
                ]}>
                    <Text style={{
                        fontFamily: FONTS.serif,
                        fontWeight: 'bold',
                        color: status === 'pass' ? COLORS.success : COLORS.error,
                        marginBottom: 4
                    }}>
                        {status === 'pass' ? "Correct!" : "Try Again"}
                    </Text>
                    <Text style={{ fontFamily: FONTS.sans, color: COLORS.text }}>
                        {feedback}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};
