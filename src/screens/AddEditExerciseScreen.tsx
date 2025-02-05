// src/screens/AddEditExerciseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { API, graphqlOperation } from 'aws-amplify';
import { createExercise, updateExercise } from '../graphql/mutations';
import { listExercises } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { v4 as uuidv4 } from 'uuid';

type AddEditExerciseScreenRouteProp = RouteProp<RootStackParamList, 'AddEditExercise'>;

const AddEditExerciseScreen: React.FC = () => {
    const route = useRoute<AddEditExerciseScreenRouteProp>();
    const { exercise } = route.params || {};
    const exerciseToEdit = exercise; // if provided, we're in edit mode.

    const { user } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState(exerciseToEdit ? exerciseToEdit.name : '');
    // For muscle group selection:
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
    const [muscleGroup, setMuscleGroup] = useState(
        exerciseToEdit ? exerciseToEdit.muscleGroup : ''
    );
    const [customMuscleGroup, setCustomMuscleGroup] = useState('');
    const [restTime, setRestTime] = useState(
        exerciseToEdit ? exerciseToEdit.restTime.toString() : ''
    );
    const [sets, setSets] = useState(
        exerciseToEdit ? exerciseToEdit.sets.toString() : ''
    );
    const [reps, setReps] = useState(
        exerciseToEdit ? exerciseToEdit.reps.toString() : ''
    );
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch distinct muscle groups for the user (only in add mode).
    useEffect(() => {
        const fetchMuscleGroups = async () => {
            try {
                const response: any = await API.graphql(
                    graphqlOperation(listExercises, {
                        filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    })
                );
                const items = response.data.listExercises.items;
                const groups = items.map((e: any) => e.muscleGroup) as string[];
                const uniqueGroups = Array.from(new Set(groups)) as string[];
                setAvailableMuscleGroups(uniqueGroups);
                if (!exerciseToEdit) {
                    if (uniqueGroups.length > 0) {
                        setMuscleGroup(uniqueGroups[0]);
                    } else {
                        setMuscleGroup('add_new');
                    }
                }
            } catch (error) {
                console.error('Error fetching muscle groups', error);
            }
        };
        if (user) {
            fetchMuscleGroups();
        }
    }, [user, exerciseToEdit]);

    const handleSave = async () => {
        // Validate required fields.
        if (!name || !restTime || !sets || !reps) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }
        const finalMuscleGroup =
            muscleGroup === 'add_new' ? customMuscleGroup : muscleGroup;
        if (!finalMuscleGroup) {
            Alert.alert('Erreur', 'Veuillez sélectionner ou saisir un groupe musculaire.');
            return;
        }

        // Convert numeric fields.
        const restTimeNum = parseInt(restTime, 10);
        const setsNum = parseInt(sets, 10);
        const repsNum = parseInt(reps, 10);

        if (isNaN(restTimeNum) || isNaN(setsNum) || isNaN(repsNum)) {
            Alert.alert(
                'Erreur',
                'Veuillez entrer des valeurs numériques valides pour le temps de repos, le nombre de sets et de répétitions.'
            );
            return;
        }

        setLoading(true);
        try {
            if (exerciseToEdit && exerciseToEdit.exerciseId) {
                // Edit mode: update the existing exercise.
                const userId = user?.attributes?.sub || user?.username;
                if (!userId) {
                    Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
                    return;
                }
                const input = {
                    userId,
                    exerciseId: exerciseToEdit.exerciseId,
                    name,
                    muscleGroup: finalMuscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                };
                await API.graphql(graphqlOperation(updateExercise, { input }));
                Alert.alert('Succès', 'Exercice mis à jour.');
            } else {
                // Add mode: create a new exercise.
                const userId = user?.attributes?.sub || user?.username;
                if (!userId) {
                    Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
                    return;
                }
                const exerciseId = uuidv4();
                const input = {
                    userId,
                    exerciseId,
                    name,
                    muscleGroup: finalMuscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                };
                await API.graphql(graphqlOperation(createExercise, { input }));
                Alert.alert('Succès', 'Exercice créé.');
            }
            navigation.goBack();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'exercice", error);
            Alert.alert(
                'Erreur',
                "Une erreur est survenue lors de la sauvegarde de l'exercice."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>
                {exerciseToEdit ? "Modifier l'exercice" : "Ajouter un exercice"}
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Nom de l'exercice"
                value={name}
                onChangeText={setName}
            />
            <Text style={styles.label}>Groupe musculaire</Text>
            <Picker
                selectedValue={muscleGroup}
                onValueChange={(itemValue) => setMuscleGroup(itemValue)}
                style={styles.picker}
            >
                {availableMuscleGroups.map((group) => (
                    <Picker.Item key={group} label={group} value={group} />
                ))}
                <Picker.Item label="Ajouter un nouveau groupe musculaire" value="add_new" />
            </Picker>
            {muscleGroup === 'add_new' && (
                <TextInput
                    style={styles.input}
                    placeholder="Saisissez le nouveau groupe musculaire"
                    value={customMuscleGroup}
                    onChangeText={setCustomMuscleGroup}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder="Temps de repos (sec)"
                value={restTime}
                onChangeText={setRestTime}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Nombre de sets"
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Nombre de répétitions"
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
            />
            <View style={styles.buttonContainer}>
                <Button
                    title={loading ? 'Enregistrement...' : 'Sauvegarder'}
                    onPress={handleSave}
                    disabled={loading}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Annuler" onPress={() => navigation.goBack()} color="#888" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 12,
    },
    picker: {
        marginBottom: 12,
    },
    buttonContainer: {
        marginTop: 20,
    },
});

export default AddEditExerciseScreen;
