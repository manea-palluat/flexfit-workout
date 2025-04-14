import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface MuscleGroupFilterBarProps {
    groups: string[];              //liste des groupes musculaires dispo
    activeGroup: string;           //groupe sélectionné (All = pas de filtre)
    onFilterChange: (selectedGroup: string) => void; //callback quand un groupe est choisi
}

//BARRE DE FILTRE: Composant qui gère l'affichage des boutons de sélection des groupes
const MuscleGroupFilterBar: React.FC<MuscleGroupFilterBarProps> = ({
    groups,
    activeGroup,
    onFilterChange,
}) => {
    return (
        <View style={styles.wrapper}>
            {/*affichage horizontal des puces de filtre*/}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
            >
                {['Tous', ...groups].map((group, index) => (
                    <TouchableOpacity
                        key={group}
                        style={[
                            styles.chip,
                            index === 0 && styles.firstChip, //pour "All", pas de marge à gauche
                            activeGroup === group && styles.activeChip, //si sélectionné, style actif
                        ]}
                        onPress={() => onFilterChange(group)} //déclenche la sélection du groupe
                        accessibilityLabel={`Filter by ${group}`} //accessibilité
                    >
                        <Text
                            style={[
                                styles.chipText,
                                activeGroup === group && styles.activeChipText, //texte en surbrillance si actif
                            ]}
                        >
                            {group} {/*affiche le nom du groupe*/}
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
        paddingRight: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    chipsContainer: {
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
