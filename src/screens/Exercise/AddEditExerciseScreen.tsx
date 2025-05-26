import React, { useState, useEffect } from 'react'
import {
    ScrollView,
    Text,
    StyleSheet,
    Alert
} from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { FormInput } from '../../components/form/FormInput'
import ListModal from '../../components/common/ListModal'
import { Button } from '../../components/common/Button'
import SegmentedControl, { Segment } from '../../components/common/SegmentedControl'
import {
    fetchMuscleGroups,
    saveExercise
} from '../../services/exercise/exerciseService'
import type { ExerciseInput } from '../../services/exercise/exerciseTypes'

type RoutePropType = RouteProp<RootStackParamList, 'AddEditExercise'>

export default function AddEditExerciseScreen() {
    const { exercise } = useRoute<RoutePropType>().params || {}
    const editing = Boolean(exercise)
    const nav = useNavigation()
    const { user } = useAuth()
    const userId = user?.attributes.sub || user?.username || ''

    // états du formulaire
    const [name, setName] = useState(exercise?.name ?? '')
    const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? '')
    const [restTime, setRestTime] = useState(exercise?.restTime.toString() ?? '')
    const [sets, setSets] = useState(exercise?.sets.toString() ?? '')
    const [reps, setReps] = useState(exercise?.reps.toString() ?? '')
    const [exerciseType, setExerciseType] =
        useState<'normal' | 'bodyweight'>(exercise?.exerciseType ?? 'normal')

    const [groups, setGroups] = useState<string[]>([])
    const [showGroups, setShowGroups] = useState(false)
    const [loading, setLoading] = useState(false)

    // récupère les groupes existants
    useEffect(() => {
        if (!userId) return
        fetchMuscleGroups(userId)
            .then(gs => {
                setGroups(gs)
                if (!editing && gs.length > 0) setMuscleGroup(gs[0])
            })
            .catch(console.error)
    }, [userId])

    // ajout client-side d'un nouveau groupe
    const handleAddGroup = (newGroup: string) => {
        setGroups(gs => [...gs, newGroup])
        setMuscleGroup(newGroup)
    }

    // sauvegarde de l'exercice
    const onSave = async () => {
        if (!name || !muscleGroup || !restTime || !sets || !reps) {
            return Alert.alert('Erreur', 'Veuillez remplir tous les champs.')
        }
        const rt = parseInt(restTime, 10)
        const st = parseInt(sets, 10)
        const rp = parseInt(reps, 10)
        if ([rt, st, rp].some(isNaN)) {
            return Alert.alert('Erreur', 'Champs numériques invalides.')
        }
        setLoading(true)
        const input: ExerciseInput & { userId: string } = {
            exerciseId: exercise?.exerciseId,
            name,
            muscleGroup,
            restTime: rt,
            sets: st,
            reps: rp,
            exerciseType,
            userId
        }
        try {
            await saveExercise(input)
            Alert.alert('Succès', editing ? 'Exercice mis à jour.' : 'Exercice créé.')
            nav.goBack()
        } catch (e) {
            console.error(e)
            Alert.alert('Erreur', "Une erreur est survenue lors de la sauvegarde.")
        } finally {
            setLoading(false)
        }
    }

    const tabSegments: Segment<'normal' | 'bodyweight'>[] = [
        { label: 'Normal', value: 'normal' },
        { label: 'Poids du corps', value: 'bodyweight' }
    ]

    return (
        <ScrollView contentContainerStyle={styles.ctn}>
            <Text style={styles.header}>
                {editing ? 'Modifier un exercice' : 'Ajouter un exercice'}
            </Text>

            <SegmentedControl
                segments={tabSegments}
                selectedValue={exerciseType}
                onValueChange={setExerciseType}
                style={{ marginBottom: 16 }}
            />

            <FormInput
                label="Nom de l’exercice"
                placeholder="Ex : Développé couché"
                value={name}
                onChangeText={setName}
            />

            <FormInput
                label="Temps de repos (s)"
                placeholder="Ex : 60"
                value={restTime}
                onChangeText={setRestTime}
                keyboardType="numeric"
            />

            <FormInput
                label="Nombre de séries"
                placeholder="Ex : 4"
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
            />

            <FormInput
                label="Répétitions par série"
                placeholder="Ex : 10"
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
            />

            <ListModal
                visible={showGroups}
                items={groups}
                keyExtractor={g => g}
                onSelect={setMuscleGroup}
                onClose={() => setShowGroups(false)}
                title="Groupe musculaire"
                onAdd={handleAddGroup}
                addPlaceholder="Nouveau groupe…"
            />

            <Button
                title={muscleGroup || 'Choisir un groupe musculaire'}
                onPress={() => setShowGroups(true)}
                variant="inverted"
            />

            <Button
                title={loading ? 'Enregistrement…' : 'Sauvegarder'}
                onPress={onSave}
                disabled={loading}
            />

            <Button
                title="Annuler"
                onPress={() => nav.goBack()}
                variant="inverted"
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    ctn: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20
    }
})
