// src/types/index.ts

//on réexporte tout ce qu'on veut exposer publiquement
export * from './NavigationTypes'

//on peut aussi réexporter d'autres types globaux
export type { Exercise, ExerciseInput } from '../services/exercise/exerciseTypes'
export type { SetResult, WorkoutSessionData } from './NavigationTypes'
