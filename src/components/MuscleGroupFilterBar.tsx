// src/components/MuscleGroupFilterBar.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface MuscleGroupFilterBarProps {
    groups: string[];              // Array of available muscle groups.
    activeGroup: string;           // Currently selected muscle group ("All" means no filter).
    onFilterChange: (selectedGroup: string) => void; // Callback when a group is selected.
}

const MuscleGroupFilterBar: React.FC<MuscleGroupFilterBarProps> = ({
    groups,
    activeGroup,
    onFilterChange,
}) => {
    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
            >
                {['All', ...groups].map((group, index) => (
                    <TouchableOpacity
                        key={group}
                        style={[
                            styles.chip,
                            index === 0 && styles.firstChip, // Remove left margin for "All"
                            activeGroup === group && styles.activeChip,
                        ]}
                        onPress={() => onFilterChange(group)}
                        accessibilityLabel={`Filter by ${group}`}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                activeGroup === group && styles.activeChipText,
                            ]}
                        >
                            {group}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 50, // Fixed height container.
        marginBottom: 8,
        paddingRight: 16, // Only right padding.
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    chipsContainer: {
        alignItems: 'center',
        // No left padding so the first chip is flush.
    },
    chip: {
        height: 36, // Fixed chip height.
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#F1F1F1',
        borderRadius: 20,
        marginLeft: 10, // Use left margin for spacing.
    },
    firstChip: {
        marginLeft: 0, // "All" chip flush to left.
    },
    activeChip: {
        backgroundColor: '#b21ae5',
    },
    chipText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    activeChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default MuscleGroupFilterBar;
