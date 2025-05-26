export interface Exercise {
    exerciseId: string
    name: string
    muscleGroup: string
    restTime: number
    sets: number
    reps: number
    exerciseType?: 'normal' | 'bodyweight'
}

export interface ExerciseInput {
    exerciseId?: string      // présent seulement en édition
    name: string
    muscleGroup: string
    restTime: number
    sets: number
    reps: number
    exerciseType: 'normal' | 'bodyweight'
}
