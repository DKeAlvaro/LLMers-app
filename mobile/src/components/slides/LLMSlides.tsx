import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { SlideContent } from '../../types';
import { LLMService } from '../../api/llm';
import { substituteVars, extractJson } from '../../services/utils';
import { COLORS, FONTS, globalStyles } from '../../theme';

// ============================================================================
// LLMCheckSlide
// ============================================================================

export const LLMCheckSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        if (!answer.trim()) return;
        setLoading(true);
        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: "You are a friendly language teacher. Correct the user's answer.",
                },
                {
                    role: 'user' as const,
                    content: `Question: ${data.chatbot_message}\nAnswer: ${answer}`,
                },
            ];
            const response = await LLMService.chatCompletion(messages, 100);
            setFeedback(response);
        } catch {
            setFeedback('Error contacting AI.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={llmStyles.container}>
            <Text style={llmStyles.question}>{data.chatbot_message}</Text>
            <TextInput
                style={llmStyles.input}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Type your answer..."
                placeholderTextColor={COLORS.textLight}
                multiline
            />
            <TouchableOpacity
                style={globalStyles.button}
                onPress={handleCheck}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={globalStyles.buttonText}>Check</Text>
                )}
            </TouchableOpacity>
            {feedback && (
                <View style={llmStyles.feedbackBox}>
                    <Text style={llmStyles.feedbackText}>{feedback}</Text>
                </View>
            )}
        </ScrollView>
    );
};

// ============================================================================
// InteractiveScenarioSlide
// ============================================================================

export const InteractiveScenarioSlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const conversationFlow = data.conversation_flow || [];
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState<
        { role: 'user' | 'assistant'; content: string; translation?: string }[]
    >([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [extractedVars, setExtractedVars] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<string | null>(null);
    const [translation, setTranslation] = useState<{
        original: string;
        translated: string;
    } | null>(null);

    React.useEffect(() => {
        if (conversationFlow.length > 0 && !initialized) {
            const firstMsg = substituteVars(
                conversationFlow[0].chatbot_message,
                extractedVars
            );
            setMessages([
                {
                    role: 'assistant',
                    content: firstMsg,
                    translation: conversationFlow[0].translation,
                },
            ]);
            setInitialized(true);
        }
    }, [conversationFlow.length > 0 && conversationFlow[0]?.chatbot_message, initialized]);

    // Keyboard handling
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        });
        const hide = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

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
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);
        setTranslation(null);

        const step = conversationFlow[currentStep];
        if (!step) {
            setLoading(false);
            return;
        }

        try {
            let newVars = { ...extractedVars };

            // Info extraction
            if (step.extract_info) {
                const instructionLines = Object.entries(step.extract_info)
                    .map(([key, desc]) => `- ${key}: ${desc}`)
                    .join('\n');

                try {
                    const extractResult = await LLMService.chatCompletion(
                        [
                            {
                                role: 'system' as const,
                                content:
                                    "You are an information extraction assistant. Extract the requested information from the user's message. Respond with ONLY a JSON object. Use null for missing values.",
                            },
                            {
                                role: 'user' as const,
                                content: `Extract:\n${instructionLines}\n\nMessage: "${userMsg}"\n\nJSON:`,
                            },
                        ],
                        100
                    );
                    const parsed = extractJson(extractResult);
                    if (parsed && typeof parsed === 'object') {
                        const cleaned: Record<string, string> = {};
                        for (const [k, v] of Object.entries(parsed)) {
                            if (v !== null && v !== undefined) cleaned[k] = String(v);
                        }
                        newVars = { ...newVars, ...cleaned };
                        setExtractedVars(newVars);
                    }
                } catch {
                    // Continue with existing vars
                }
            }

            // Evaluation
            const evaluated = await LLMService.chatCompletion(
                [
                    {
                        role: 'system' as const,
                        content: `You are a friendly language tutor. The student should: "${step.title}". Evaluate if their response makes sense. Be encouraging and lenient with beginners. Respond with JSON: {"acceptable": true, "feedback": "short encouraging message"} or {"acceptable": false, "feedback": "gentle hint"}`,
                    },
                    {
                        role: 'user' as const,
                        content: `Bot: "${step.chatbot_message}"\nExpected: "${step.title}"\nStudent: "${userMsg}"\n\nIs this acceptable?`,
                    },
                ],
                150
            );

            const evaluation = extractJson(evaluated);
            const acceptable = evaluation?.acceptable !== false;

            if (acceptable) {
                if (currentStep < conversationFlow.length - 1) {
                    const nextIdx = currentStep + 1;
                    const nextStep = conversationFlow[nextIdx];
                    const nextMsg = substituteVars(nextStep.chatbot_message, newVars);
                    setCurrentStep(nextIdx);
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: nextMsg,
                            translation: nextStep.translation,
                        },
                    ]);
                } else {
                    setIsComplete(true);
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: 'Conversation complete.',
                        },
                    ]);
                }
                if (evaluation?.feedback) {
                    setFeedback(evaluation.feedback);
                    setTimeout(() => setFeedback(null), 3000);
                }
            } else {
                const retryMsg =
                    evaluation?.feedback ||
                    'Almost. Try again with a response that fits the conversation.';
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: retryMsg },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Something went wrong. Try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const currentHint = !isComplete ? conversationFlow[currentStep]?.title || '' : '';

    const renderMessage = (
        m: { role: 'user' | 'assistant'; content: string; translation?: string },
        i: number
    ) => {
        const isUser = m.role === 'user';
        const hasTranslation = !!m.translation;

        return (
            <View key={`msg-${i}`} style={chatStyles.msgRow}>
                <Text style={[chatStyles.msgLabel, isUser && chatStyles.msgLabelUser]}>
                    {isUser ? 'You' : 'Bot'}
                </Text>
                <TouchableOpacity
                    activeOpacity={hasTranslation ? 0.7 : 1}
                    onPress={() =>
                        hasTranslation
                            ? handleSentenceClick(m.content, m.translation)
                            : undefined
                    }
                    style={[
                        chatStyles.msgBubble,
                        isUser ? chatStyles.msgBubbleUser : chatStyles.msgBubbleBot,
                    ]}
                >
                    <Text
                        style={[
                            chatStyles.msgText,
                            isUser ? chatStyles.msgTextUser : chatStyles.msgTextBot,
                        ]}
                    >
                        {m.content}
                    </Text>
                    {hasTranslation && (
                        <Text style={chatStyles.tapHint}>tap to translate</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={chatStyles.container}>
            {/* Header */}
            <View style={chatStyles.header}>
                <Text style={chatStyles.headerTitle}>{data.title}</Text>
                {data.setting && (
                    <Text style={chatStyles.headerSetting}>{data.setting}</Text>
                )}
            </View>

            {/* Feedback toast */}
            {feedback && (
                <View style={chatStyles.toast}>
                    <Text style={chatStyles.toastText}>{feedback}</Text>
                </View>
            )}

            {/* Translation popover */}
            {translation && (
                <View style={chatStyles.transPop}>
                    <Text style={chatStyles.transOrig} numberOfLines={1}>
                        {translation.original}
                    </Text>
                    <Text style={chatStyles.transSep}>—</Text>
                    <Text style={chatStyles.transRes}>{translation.translated}</Text>
                </View>
            )}

            {/* Messages */}
            <ScrollView
                ref={scrollRef}
                style={chatStyles.scroll}
                contentContainerStyle={[
                    chatStyles.scrollContent,
                    { paddingBottom: 8 + keyboardHeight },
                ]}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map(renderMessage)}
                {loading && (
                    <View style={chatStyles.msgRow}>
                        <Text style={chatStyles.msgLabel}>Bot</Text>
                        <View style={[chatStyles.msgBubble, chatStyles.msgBubbleBot]}>
                            <ActivityIndicator size="small" color={COLORS.textLight} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            {!isComplete && (
                <View style={chatStyles.inputBar}>
                    {currentHint ? (
                        <Text style={chatStyles.hint}>{currentHint}</Text>
                    ) : null}
                    <View style={chatStyles.inputRow}>
                        <TextInput
                            style={chatStyles.textInput}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Type your response..."
                            placeholderTextColor={COLORS.textLight}
                            multiline
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[
                                chatStyles.sendBtn,
                                loading && chatStyles.sendBtnDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={loading}
                        >
                            <Text style={chatStyles.sendBtnText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Complete footer */}
            {isComplete && (
                <View style={chatStyles.doneBar}>
                    <Text style={chatStyles.doneText}>Complete</Text>
                </View>
            )}
        </View>
    );
};

// ============================================================================
// ScriptedRoleplaySlide
// ============================================================================

export const ScriptedRoleplaySlide: React.FC<{ data: SlideContent }> = ({ data }) => {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'pass' | 'fail'>('idle');
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCheck = async () => {
        if (!input.trim()) return;
        setStatus('checking');

        try {
            const systemPrompt =
                data.system_prompt ||
                "You are a language tutor. Check if the user's response is grammatically correct and uses the required concept.";
            const messages = [
                { role: 'system' as const, content: systemPrompt },
                {
                    role: 'user' as const,
                    content: `Context: "${data.bot_line}". Goal: "${data.expected_concept}". User: "${input}". Valid? Reply JSON: {"valid": true, "feedback": "msg"}`,
                },
            ];

            const response = await LLMService.chatCompletion(messages, 150);

            let valid = false;
            let feedbackText = response;
            try {
                const start = response.indexOf('{');
                const end = response.lastIndexOf('}');
                if (start >= 0 && end >= 0) {
                    const json = JSON.parse(response.substring(start, end + 1));
                    valid = json.valid;
                    feedbackText = json.feedback;
                }
            } catch {
                // Use raw response as feedback
            }

            setFeedback(feedbackText);
            setStatus(valid ? 'pass' : 'fail');
        } catch {
            setFeedback('Error checking response.');
            setStatus('fail');
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={srStyles.title}>{data.setting || 'Roleplay'}</Text>

            <View style={srStyles.botBubble}>
                <Text style={srStyles.botText}>{data.bot_line}</Text>
            </View>

            <Text style={srStyles.prompt}>
                Reply using:{' '}
                <Text style={srStyles.promptBold}>{data.expected_concept}</Text>
            </Text>

            <TextInput
                style={[globalStyles.input, srStyles.textArea]}
                value={input}
                onChangeText={(t) => {
                    setInput(t);
                    setStatus('idle');
                }}
                placeholder="Type your response..."
                placeholderTextColor={COLORS.textLight}
                multiline
            />

            <TouchableOpacity
                style={[
                    globalStyles.button,
                    status === 'checking' && { opacity: 0.6 },
                ]}
                onPress={handleCheck}
                disabled={status === 'checking'}
            >
                <Text style={globalStyles.buttonText}>
                    {status === 'checking' ? 'Checking...' : 'Submit'}
                </Text>
            </TouchableOpacity>

            {status !== 'idle' && (
                <View
                    style={[
                        srStyles.result,
                        {
                            backgroundColor:
                                status === 'pass' ? '#ECFDF5' : '#FEF2F2',
                            borderColor:
                                status === 'pass' ? COLORS.success : COLORS.error,
                        },
                    ]}
                >
                    <Text
                        style={[
                            srStyles.resultTitle,
                            {
                                color:
                                    status === 'pass' ? COLORS.success : COLORS.error,
                            },
                        ]}
                    >
                        {status === 'pass' ? 'Correct' : 'Try again'}
                    </Text>
                    <Text style={srStyles.resultText}>{feedback}</Text>
                </View>
            )}
        </ScrollView>
    );
};

// ============================================================================
// Styles — LLMCheckSlide
// ============================================================================

const llmStyles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
    },
    question: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONTS.sans,
        color: COLORS.text,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        fontFamily: FONTS.sans,
        fontSize: 15,
        color: COLORS.text,
    },
    feedbackBox: {
        marginTop: 20,
        padding: 16,
        backgroundColor: COLORS.muted,
        borderRadius: 10,
        width: '100%',
    },
    feedbackText: {
        color: COLORS.text,
        lineHeight: 22,
        fontFamily: FONTS.sans,
        fontSize: 14,
    },
});

// ============================================================================
// Styles — InteractiveScenarioSlide
// ============================================================================

const chatStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    headerSetting: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    toast: {
        backgroundColor: COLORS.success,
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    toastText: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: FONTS.sans,
        fontWeight: '600',
    },
    transPop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.muted,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    transOrig: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        maxWidth: '40%',
    },
    transSep: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    transRes: {
        fontSize: 13,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.text,
        maxWidth: '40%',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 8,
    },
    msgRow: {
        marginBottom: 14,
    },
    msgLabel: {
        fontSize: 11,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        marginLeft: 12,
    },
    msgLabelUser: {
        textAlign: 'right',
        marginLeft: 0,
        marginRight: 12,
        color: COLORS.accent,
    },
    msgBubble: {
        maxWidth: '80%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    msgBubbleBot: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.muted,
        borderBottomLeftRadius: 4,
    },
    msgBubbleUser: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    msgText: {
        fontSize: 15,
        fontFamily: FONTS.sans,
        lineHeight: 22,
    },
    msgTextBot: {
        color: COLORS.text,
    },
    msgTextUser: {
        color: '#FFF',
    },
    tapHint: {
        fontSize: 10,
        color: COLORS.textLight,
        fontFamily: FONTS.sans,
        marginTop: 4,
    },
    inputBar: {
        padding: 14,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    hint: {
        fontSize: 12,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        marginBottom: 8,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    textInput: {
        flex: 1,
        minHeight: 42,
        maxHeight: 100,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: FONTS.sans,
        color: COLORS.text,
    },
    sendBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
    sendBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: FONTS.sans,
        fontWeight: '700',
    },
    doneBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
    },
    doneText: {
        fontSize: 14,
        fontFamily: FONTS.sans,
        fontWeight: '700',
        color: COLORS.success,
    },
});

// ============================================================================
// Styles — ScriptedRoleplaySlide
// ============================================================================

const srStyles = StyleSheet.create({
    title: {
        fontFamily: FONTS.sans,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    botBubble: {
        backgroundColor: COLORS.muted,
        borderRadius: 14,
        borderBottomLeftRadius: 4,
        padding: 14,
        marginBottom: 16,
        alignSelf: 'flex-start',
        maxWidth: '85%',
    },
    botText: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    prompt: {
        fontSize: 14,
        fontFamily: FONTS.sans,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    promptBold: {
        fontWeight: '700',
        color: COLORS.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 14,
    },
    result: {
        marginTop: 18,
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
    },
    resultTitle: {
        fontFamily: FONTS.sans,
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
    },
    resultText: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
});
