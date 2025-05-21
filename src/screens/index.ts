// src/screens/_index.ts

// Home
export { default as HomeScreen } from './HomeScreen'

// Auth
export { default as AuthScreen } from './Auth/AuthScreen'
export { default as ConfirmSignUpScreen } from './Auth/ConfirmSignUpScreen'
export { default as ForgotPasswordScreen } from './Auth/ForgotPasswordScreen'

// Exercise
export { default as AddEditExerciseScreen } from './Exercise/AddEditExerciseScreen'
export { default as WorkoutSessionScreen } from './Exercise/WorkoutSessionScreen'

// Info / Static
export { default as AboutScreen } from './Legal/AboutScreen'
export { default as LegalNoticeScreen } from './Legal/LegalNoticeScreen'
export { default as PrivacyPolicyScreen } from './Legal/PrivacyPolicyScreen'
export { default as TermsOfUseScreen } from './Legal/TermsOfUseScreen'

// Main (dashboard / core)
export { default as TrainingScreen } from './Main/TrainingScreen'
export { default as TrackingScreen } from './Main/TrackingScreen'
export { default as ProfileScreen } from './Main/ProfileScreen'

// Settings
export { default as ParameterScreen } from './Settings/ParameterScreen'
export { default as ProfileOptionsScreen } from './Settings/ProfileOptionsScreen'

// Tracking feature
export { default as ManualTrackingScreen } from './Tracking/ManualTrackingScreen'
export { default as TrackingDetailScreen } from './Tracking/TrackingDetailScreen'
export { default as EditTrackingScreen } from './Tracking/EditTrackingScreen'
export { default as ExerciseHistoryScreen } from './Tracking/ExerciseHistoryScreen'
export { default as RecentExercisesDetailScreen } from './Tracking/RecentExercisesDetailScreen'
