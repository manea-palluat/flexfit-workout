// src/types/NavigationTypes.ts
export type RootStackParamList = {
    MainTabs: undefined;
    Auth: { mode: 'login' | 'signup' } | undefined;
    ConfirmSignUp: { username: string };
    AddEditExercise: {
        // When adding a new exercise, the parameter can be omitted.
        exercise?: {
            exerciseId: string;
            name: string;
            muscleGroup: string;
            restTime: number;
            sets: number;
            reps: number;
            weight: number;
        };
    } | undefined;
};
