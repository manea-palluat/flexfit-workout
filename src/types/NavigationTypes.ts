import type { Exercise } from '../services/exercise/exerciseTypes'

export interface WorkoutSessionData {
    exerciseName: string; // nom de l'exo
    totalSets: number; // nb total de séries prévues
    plannedReps: number; // nb de répétitions planifiées
    restDuration: number; // durée du repos en secondes
    exerciseType?: 'normal' | 'bodyweight'; // type d'exo, restreint à nos deux valeurs
}

export interface SetResult {
    reps?: number; // résultat : nombre de reps effectuées
    weight?: number; // résultat : poids utilisé, optionnel
}

// NAVIGATION STACK : ici on définit les routes et leurs params pour la navigation
export type RootStackParamList = {
    Home: undefined; // écran d'accueil, rien de spécial à passer
    MainTabs: undefined; // onglets principaux
    Auth: { mode: 'login' | 'signup' } | undefined; // mode de connexion ou d'inscription
    ConfirmSignUp: { username: string }; // confirmation d'inscription avec le username
    AddEditExercise: {
        exercise?: Exercise
    } | undefined; // écran pour ajouter ou modifier un exo
    TrackingDetail: {
        tracking: {
            id: string; // id du tracking
            userId: string; // id de l'utilisateur
            exerciseId: string; // id de l'exo
            exerciseName: string; // nom de l'exo
            date: string; // date de la séance
            setsData: string; // données des séries sous forme de string (JSON par exemple)
        };
    };
    ExerciseHistory: { exerciseName: string }; // historique d'un exo par son nom
    ManualTracking: undefined; // tracking manuel
    EditTracking: {
        tracking: {
            id: string;
            userId: string;
            exerciseId: string;
            exerciseName: string;
            date: string;
            setsData: string;
        };
    }; // édition d'un tracking existant
    ForgotPassword: undefined; // écran de réinitialisation de mot de passe
    WorkoutSession: {
        sessionData: WorkoutSessionData; // données de la séance d'exercice
        onComplete: (results: SetResult[]) => void; // callback quand la séance est terminée
        onClose?: () => void; // callback optionnel pour fermer la séance
    };
    ProfileOptions: undefined; // options du profil
    TermsOfUse: undefined; // conditions d'utilisation
    PrivacyPolicy: undefined; // politique de confidentialité
    LegalNotice: undefined; // mentions légales
    About: undefined; // à propos de l'app
    ParameterScreen: undefined; // écran des paramètres
    RecentExercisesDetail: { exerciseName: string }; // écran de détail des exercices récents
    AddMeasurement: undefined; // écran pour ajouter une mensuration
};