import { StyleSheet } from 'react-native';

export const COLORS = {
    background: '#F9F7F2', // Off-white cream
    text: '#333333',       // Dark grey/almost black
    textLight: '#666666',  // Muted grey
    primary: '#2F4F4F',    // Dark Slate Grey (Olive-ish) - replacing purple
    secondary: '#D2691E',  // Chocolate/Terracotta accent
    border: '#E0DCD3',     // Muted beige border
    success: '#556B2F',    // Olive Green
    error: '#8B0000',      // Dark Red
    card: '#FFFFFF',       // White for cards
};

export const FONTS = {
    // scalable logic later, for now system fonts
    serif: 'serif',
    sans: 'sans-serif',
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 28,
        color: COLORS.text,
        marginBottom: 8,
        fontWeight: 'normal', // Serif usually looks good with normal weight
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textLight,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 2, // Sharper corners for vintage feel
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 4, // Slightly rounded
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    buttonText: {
        color: '#FFF',
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    outlineButtonText: {
        color: COLORS.primary,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        fontFamily: FONTS.sans,
    }
});
