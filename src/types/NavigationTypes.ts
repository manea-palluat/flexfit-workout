// src/types/NavigationTypes.ts

export interface WorkoutSessionData {
    exerciseName: string;
    totalSets: number;
    plannedReps: number;
    restDuration: number;
}

export interface SetResult {
    reps?: number;
    weight?: number;
}

export type RootStackParamList = {
    Home: undefined;
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
        };
    };
    ExerciseHistory: { exerciseName: string };
    ManualTracking: undefined;
    EditTracking: {
        tracking: {
            id: string;
            userId: string;
            exerciseId: string;
            exerciseName: string;
            date: string;
            setsData: string;
        };
    };
    ForgotPassword: undefined;
    WorkoutSession: {
        sessionData: WorkoutSessionData;
        onComplete: (results: SetResult[]) => void;
    };
    ProfileOptions: undefined;
    // New legal screens:
    TermsOfUse: undefined;
    PrivacyPolicy: undefined;
    LegalNotice: undefined;
    // New About screen:
    About: undefined;
};
