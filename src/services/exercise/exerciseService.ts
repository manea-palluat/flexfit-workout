import { API, graphqlOperation } from 'aws-amplify'
import { listExercises } from '../../graphql/queries'
import { createExercise, updateExercise } from '../../graphql/mutations'
import type { Exercise, ExerciseInput } from './exerciseTypes'

/**
 * Récupère la liste unique des groupes musculaires de l'utilisateur
 */
export async function fetchMuscleGroups(userId: string): Promise<string[]> {
    const resp: any = await API.graphql(
        graphqlOperation(listExercises, { filter: { userId: { eq: userId } } })
    )
    const items: Exercise[] = resp.data.listExercises.items
    return Array.from(new Set(items.map(e => e.muscleGroup)))
}

/**
 * Crée ou met à jour un exercice selon la présence de exerciseId
 */
export async function saveExercise(input: ExerciseInput & { userId: string }): Promise<void> {
    if (input.exerciseId) {
        await API.graphql(graphqlOperation(updateExercise, { input }))
    } else {
        await API.graphql(graphqlOperation(createExercise, { input }))
    }
}

/**
 * Récupère tous les exercices (avec normal/bodyweight forcé)
 */
export async function fetchExercises(userId: string): Promise<Exercise[]> {
    const resp: any = await API.graphql(
        graphqlOperation(listExercises, {
            filter: { userId: { eq: userId } }
        })
    )
    const items: any[] = resp.data.listExercises.items
    return items.map(e => ({
        exerciseId: e.exerciseId,
        name: e.name,
        muscleGroup: e.muscleGroup,
        restTime: e.restTime,
        sets: e.sets,
        reps: e.reps,
        exerciseType: e.exerciseType === 'bodyweight' ? 'bodyweight' : 'normal'
    }))
}
