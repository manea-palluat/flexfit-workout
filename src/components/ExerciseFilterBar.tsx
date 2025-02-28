// src/components/ExerciseFilterBar.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ExerciseFilterBarProps { //props:liste d'exercices,callback de filtre et filtre init
    exercises: string[]; //liste des noms d'exercices
    onFilterChange: (selectedExercise: string, searchQuery: string) => void; //callback quand le filtre change
    initialActiveFilter?: string; //filtre initial optionnel
}

const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
    exercises,
    onFilterChange,
    initialActiveFilter = 'All',
}) => {
    const [activeFilter, setActiveFilter] = useState<string>(initialActiveFilter); //etat pour le filtre actif

    useEffect(() => {
        onFilterChange(activeFilter === 'All' ? '' : activeFilter, ''); //met à jour le filtre via callback (All = pas de filtre)
    }, [activeFilter, onFilterChange]);

    const handleChipPress = (chip: string) => {
        setActiveFilter(chip); //change l'etat quand on clique sur un chip
    };

    return (
        <View style={styles.wrapper}>
            {/* EXERCISE FILTER BAR */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
            >
                {/* container des chips en scroll horizontal */}
                {['All', ...exercises].map((chip, index) => (
                    <TouchableOpacity
                        key={chip}
                        style={[
                            styles.chip,
                            /* premier chip sans marge gauche */ index === 0 && styles.firstChip,
                            /* chip actif a un style particulier */ activeFilter === chip && styles.chipActive,
                        ]}
                        onPress={() => handleChipPress(chip)}
                        accessibilityLabel={`Filter by ${chip}`}
                    >
                        <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>
                            {chip}
                            {/* affiche le nom du chip */}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 50,
        marginBottom: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    chipsContainer: {
        paddingRight: 16,
        height: 50,
        alignItems: 'center',
    },
    chip: {
        height: 36,
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#F1F1F1',
        borderRadius: 20,
        marginLeft: 10,
    },
    firstChip: {
        marginLeft: 0,
    },
    chipActive: {
        backgroundColor: '#b21ae5',
    },
    chipText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ExerciseFilterBar;
