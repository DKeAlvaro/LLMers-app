import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SlideContent } from '../../types';
import { LLMService } from '../../api/llm';
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

    // Translation state
    const [translation, setTranslation] = useState<{ original: string, translated: string } | null>(null);

    // Initialize with the first bot message from conversation_flow
    React.useEffect(() => {
        if (conversationFlow.length > 0 && !initialized) {
            setMessages([{
                role: 'assistant',
                content: conversationFlow[0].chatbot_message,
                translation: conversationFlow[0].translation
            }]);
            setInitialized(true);
        }
    }, [conversationFlow.length > 0 && conversationFlow[0]?.chatbot_message, initialized]);

    const handleSentenceClick = (sentence: string, translationText?: string) => {
        if (!translationText) return;

        setTranslation({ original: sentence, translated: translationText });

        // Auto-hide after 5 seconds
        setTimeout(() => setTranslation(null), 5000);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);
        setTranslation(null); // Clear translation on new action

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: 'user', content: userMsg });

            const systemMsg = { role: 'system' as const, content: `Roleplay: ${data.setting}. Goal: Have a conversation.` };

            const response = await LLMService.chatCompletion([systemMsg, ...history], 150);
            const cleanResponse = response.replace(/CONCEPTS_COVERED:.*?(\n|$)/g, '').trim();

            // Try to find translation for the NEXT step (since we are about to increment)
            // But wait, currentStep is the OLD step. We need translation for the NEW step.
            // If we successfully advanced...
            let nextTranslation: string | undefined = undefined;
            if (currentStep < conversationFlow.length - 1) {
                // We assume the LLM just spoke the line for the next step?
                // Or does it speak for the CURRENT step's response?
                // conversationFlow structure: [Msg1, Msg2, Msg3]
                // Msg1 is initial.
                // User replies. LLM replies (Msg2?).
                // So index is currentStep + 1.
                nextTranslation = conversationFlow[currentStep + 1]?.translation;
                setCurrentStep(prev => prev + 1);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: cleanResponse,
                translation: nextTranslation
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "..." }]);
        } finally {
            setLoading(false);
        }
    };

    const currentHint = conversationFlow[currentStep]?.title || '';

    const renderMessageContent = (m: { role: 'user' | 'assistant', content: string, translation?: string }) => {
        if (m.role === 'user') {
            return <Text style={[chatStyles.dialogueText, chatStyles.yourDialogue]}>"{m.content}"</Text>;
        }

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSentenceClick(m.content, m.translation)}
                style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E0D8C8' }}
            >
                <Text style={chatStyles.dialogueText}>"{m.content}"</Text>
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

            {/* Translation Popover / Float */}
            {translation && (
                <View style={chatStyles.translationFloat}>
                    <Text style={chatStyles.translationOriginal}>{translation.original}</Text>
                    <Text style={chatStyles.translationArrow}>→</Text>
                    <Text style={chatStyles.translationResult}>{translation.translated}</Text>
                </View>
            )}

            {/* Conversation as screenplay/script format */}
            <ScrollView
                style={chatStyles.dialogueScroll}
                contentContainerStyle={chatStyles.dialogueContent}
            >
                {messages.map((m, i) => (
                    <View key={i} style={chatStyles.dialogueLine}>
                        <Text style={chatStyles.speakerName}>
                            {m.role === 'assistant' ? 'Vendor' : 'You'}
                        </Text>
                        {renderMessageContent(m)}
                    </View>
                ))}

                {loading && (
                    <View style={chatStyles.dialogueLine}>
                        <Text style={chatStyles.speakerName}>Vendor</Text>
                        <Text style={chatStyles.thinkingText}>...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Prompt area */}
            <View style={chatStyles.promptArea}>
                {currentHint && (
                    <Text style={chatStyles.stageDirection}>
                        {currentHint}
                    </Text>
                )}

                <View style={chatStyles.inputRow}>
                    <TextInput
                        style={chatStyles.scriptInput}
                        value={input}
                        onChangeText={setInput}
                        placeholder="What do you say?"
                        placeholderTextColor="#999"
                        multiline
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
