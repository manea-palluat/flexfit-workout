// src/screens/AddEditExerciseScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { createExercise, updateExercise } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { v4 as uuidv4 } from 'uuid';

// Define the route prop type for this screen using our RootStackParamList.
type AddEditExerciseScreenRouteProp = RouteProp<RootStackParamList, 'AddEditExercise'>;

const AddEditExerciseScreen: React.FC = () => {
    // Use our typed route.
    const route = useRoute<AddEditExerciseScreenRouteProp>();
    // Expect route.params to be an object with an optional "exercise" property.
    const { exercise } = route.params || {};
    const exerciseToEdit = exercise; // If provided, we're in edit mode.

    // Access the authenticated user and navigation.
    const { user } = useAuth();
    const navigation = useNavigation();

    // Form fields: pre-populate if editing.
    const [name, setName] = useState(exerciseToEdit ? exerciseToEdit.name : '');
    const [muscleGroup, setMuscleGroup] = useState(
        exerciseToEdit ? exerciseToEdit.muscleGroup : ''
    );
    const [restTime, setRestTime] = useState(
        exerciseToEdit ? exerciseToEdit.restTime.toString() : ''
    );
    const [sets, setSets] = useState(
        exerciseToEdit ? exerciseToEdit.sets.toString() : ''
    );
    const [reps, setReps] = useState(
        exerciseToEdit ? exerciseToEdit.reps.toString() : ''
    );
    const [weight, setWeight] = useState(
        exerciseToEdit ? exerciseToEdit.weight.toString() : ''
    );
    const [loading, setLoading] = useState<boolean>(false);

    const handleSave = async () => {
        // Validate that all fields are filled.
        if (!name || !muscleGroup || !restTime || !sets || !reps || !weight) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }

        // Convert numeric fields from strings.
        const restTimeNum = parseInt(restTime, 10);
        const setsNum = parseInt(sets, 10);
        const repsNum = parseInt(reps, 10);
        const weightNum = parseFloat(weight);

        if (
            isNaN(restTimeNum) ||
            isNaN(setsNum) ||
            isNaN(repsNum) ||
            isNaN(weightNum)
        ) {
            Alert.alert(
                'Erreur',
                'Veuillez entrer des valeurs numériques valides pour le temps de repos, le nombre de sets, de répétitions et le poids.'
            );
            return;
        }

        setLoading(true);
        try {
            if (exerciseToEdit && exerciseToEdit.exerciseId) {
                // Edit mode: update the existing exercise.
                const input = {
                    exerciseId: exerciseToEdit.exerciseId,
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                    weight: weightNum,
                };
                await API.graphql(graphqlOperation(updateExercise, { input }));
                Alert.alert('Succès', 'Exercice mis à jour.');
            } else {
                // Add mode: create a new exercise.
                // Compute a proper user identifier.
                const userId = user?.attributes?.sub || user?.username;
                console.log('User object:', user);
                console.log('Computed userId:', userId);
                if (!userId) {
                    Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
                    return;
                }
                // Generate a unique exerciseId for the new exercise.
                const exerciseId = uuidv4();
                const input = {
                    userId,         // Use the computed userId
                    exerciseId,     // Use the generated exerciseId
                    name,
                    muscleGroup,
                    restTime: restTimeNum,
                    sets: setsNum,
                    reps: repsNum,
                    weight: weightNum,
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
            <TextInput
                style={styles.input}
                placeholder="Groupe musculaire"
                value={muscleGroup}
                onChangeText={setMuscleGroup}
            />
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
            <TextInput
                style={styles.input}
                placeholder="Poids (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
            />
            <View style={styles.buttonContainer}>
                <Button
                    title={loading ? 'Enregistrement...' : 'Sauvegarder'}
                    onPress={handleSave}
                    disabled={loading}
                />
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
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 12,
    },
    buttonContainer: {
        marginTop: 20,
    },
});

export default AddEditExerciseScreen;
