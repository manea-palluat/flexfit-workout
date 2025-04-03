import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ExerciseFilterBarProps {
    exercises: string[];
    onFilterChange: (selectedExercise: string, searchQuery: string) => void;
    initialActiveFilter?: string;
}

const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
    exercises,
    onFilterChange,
    initialActiveFilter = 'Tous',
}) => {
    const [activeFilter, setActiveFilter] = useState<string>(initialActiveFilter);

    useEffect(() => {
        // Ne pas transformer "Tous" en chaîne vide ici, laisser le parent gérer
        onFilterChange(activeFilter, '');
    }, [activeFilter, onFilterChange]);

    const handleChipPress = (chip: string) => {
        setActiveFilter(chip);
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
            >
                {['Tous', ...exercises].map((chip, index) => (
                    <TouchableOpacity
                        key={chip}
                        style={[
                            styles.chip,
                            index === 0 && styles.firstChip,
                            activeFilter === chip && styles.chipActive,
                        ]}
                        onPress={() => handleChipPress(chip)}
                        accessibilityLabel={`Filter by ${chip}`}
                    >
                        <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>
                            {chip}
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