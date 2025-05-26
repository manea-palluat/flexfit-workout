import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckListItemProps {
    condition: boolean;
    text: string;
}

export const CheckListItem: React.FC<CheckListItemProps> = ({ condition, text }) => (
    <View style={styles.container}>
        <Ionicons
            name={condition ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={16}
            color={condition ? '#00AA00' : '#FF0000'}
            style={styles.icon}
        />
        <Text style={styles.text}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
});
