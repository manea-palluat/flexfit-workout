// src/styles/TextStyles.ts
import { StyleSheet } from 'react-native';

export const TextStyles = StyleSheet.create({
    // Title: Bold, Size 32, using Plus Jakarta Sans Bold (700)
    title: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 32,
    },
    // SubTitle: Bold, Size 22
    subTitle: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 22,
    },
    // SimpleText: Medium, Size 16
    simpleText: {
        fontFamily: 'PlusJakartaSans_500Medium',
        fontSize: 16,
    },
    // subSimpleText: Regular, Size 14
    subSimpleText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
    },
    // HeaderText: Bold, Size 18
    headerText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 18,
    },
    // NavigatorText: Medium, Size 12
    navigatorText: {
        fontFamily: 'PlusJakartaSans_500Medium',
        fontSize: 12,
    },
});
