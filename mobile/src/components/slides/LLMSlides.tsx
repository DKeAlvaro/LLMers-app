import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SlideContent } from '../../types';
import { LLMService } from '../../api/llm';

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
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            // Context would be bigger in real app, simplified here
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: 'user', content: userMsg });

            const systemMsg = { role: 'system' as const, content: `Roleplay: ${data.setting}. Goal: Have a conversation.` };

            const response = await LLMService.chatCompletion([systemMsg, ...history], 150);

            // In python version there is logic to parse CONCEPTS_COVERED.
            // Here we just display the response for MVP compliance.
            // If response has "CONCEPTS_COVERED: [...]", remove it for display?
            // Simple cleanup:
            const cleanResponse = response.replace(/CONCEPTS_COVERED:.*?(\n|$)/g, '').trim();

            setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.scenarioContainer}>
            <Text style={styles.sceneTitle}>{data.title}</Text>
            <Text style={styles.sceneSetting}>{data.setting}</Text>

            <ScrollView style={styles.chatArea}>
                {messages.map((m, i) => (
                    <View key={i} style={[
                        styles.msgBubble,
                        m.role === 'user' ? styles.userBubble : styles.botBubble
                    ]}>
                        <Text style={styles.msgText}>{m.content}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.chatInput}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type..."
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.btnText}>Send</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center'
    },
    question: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
        backgroundColor: '#f9f9f9'
    },
    button: {
        backgroundColor: '#6200ee',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold'
    },
    feedbackBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        width: '100%'
    },
    feedbackTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1565c0'
    },
    feedbackText: {
        color: '#0d47a1',
        lineHeight: 20
    },
    scenarioContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    sceneTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 16,
        backgroundColor: 'white',
        textAlign: 'center'
    },
    sceneSetting: {
        padding: 8,
        textAlign: 'center',
        color: '#666',
        fontSize: 12
    },
    chatArea: {
        flex: 1,
        padding: 16,
    },
    msgBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        maxWidth: '80%'
    },
    userBubble: {
        backgroundColor: '#6200ee',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2
    },
    botBubble: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2
    },
    msgText: {
        color: '#333' // will be white for user
    },
    inputArea: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    chatInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8
    },
    sendBtn: {
        backgroundColor: '#6200ee',
        borderRadius: 20,
        paddingHorizontal: 20,
        justifyContent: 'center'
    }
});

// New Component
import { COLORS, FONTS, globalStyles } from '../../theme';

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
