export interface Lesson {
    id: string;
    title: string;
    description?: string;
    content: SlideContent[];
    language?: string;
}

export interface SlideContent {
    type: 'vocabulary' | 'expression' | 'grammar' | 'tip' | 'practice_builder' | 'pronunciation' | 'interactive_scenario' | 'llm_check' | 'scripted_roleplay' | 'extra';
    title?: string;
    data?: any;
    explanation?: string;
    text?: string;
    structure?: string[];
    task?: string;
    translation?: string;
    content?: string;
    // Specific fields for interactive/llm slides
    chatbot_message?: string;
    setting?: string;
    bot_line?: string;       // NEW: Static line for bot
    expected_concept?: string; // NEW: Concept to validate
    system_prompt?: string;  // NEW: Custom validation prompt
    goals?: string[];
    conversation_flow?: { title: string; chatbot_message: string }[]; // Interactive scenario steps
}

export interface UserProgress {
    completed_lessons: string[];
    interactive_scenario_progress: Record<string, any>;
    lesson_slide_positions: Record<string, number>;
    user_data: Record<string, any>;
}

export interface AppSettings {
    deepseek_api_key: string | null;
    selected_language: string;
}
