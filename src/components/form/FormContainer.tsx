import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

export interface FormContainerProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const FormContainer: React.FC<FormContainerProps> = ({ children, style }) => (
    <View style={[styles.container, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '80%',
        alignSelf: 'center',
    },
});
