import { StyleSheet } from 'react-native';

export const COLORS = {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    textLight: '#6B7280',
    primary: '#1A1A2E',
    primaryLight: '#3A3A5C',
    accent: '#E94560',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    muted: '#F3F4F6',
};

export const FONTS = {
    serif: 'serif',
    sans: 'sans-serif',
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    title: {
        fontFamily: FONTS.sans,
        fontSize: 28,
        color: COLORS.text,
        marginBottom: 8,
        fontWeight: '700',
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: 15,
        color: COLORS.textLight,
        lineHeight: 22,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontFamily: FONTS.sans,
        fontSize: 15,
        fontWeight: '600',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: COLORS.primary,
        fontFamily: FONTS.sans,
        fontSize: 15,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
        fontFamily: FONTS.sans,
    },
});
