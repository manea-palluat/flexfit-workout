// src/types/NavigationTypes.ts
export type RootStackParamList = {
    MainTabs: undefined;
    Auth: { mode: 'login' | 'signup' } | undefined;
    ConfirmSignUp: { username: string };
    AddEditExercise: {
        exercise?: {
            exerciseId: string;
            name: string;
            muscleGroup: string;
            restTime: number;
            sets: number;
            reps: number;
        };
    } | undefined;
    TrackingDetail: {
        tracking: {
            id: string;
            userId: string;
            exerciseId: string;
            exerciseName: string;
            date: string;
            setsData: string;
        }
    };
};
