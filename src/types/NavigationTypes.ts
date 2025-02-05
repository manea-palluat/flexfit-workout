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
        }
    };
    ForgotPassword: undefined;
    // Declare WorkoutSession with required parameters:
    WorkoutSession: {
        sessionData: WorkoutSessionData;
        onComplete: (results: SetResult[]) => void;
    };
};
