import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    containerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    subtitleStyle?: TextStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    containerStyle,
    titleStyle,
    subtitleStyle,
}) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={[{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff' }, containerStyle]}>
            <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                {title}
            </Text>
            {subtitle ? (
                <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={2}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666',
        marginTop: 4,
    },
});
