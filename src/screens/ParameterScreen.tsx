import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';
import { Settings, DEFAULT_SETTINGS, loadSettingsFromFile, saveSettingsToFile } from '../utils/settingsStorage';

const ParameterScreen: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS); //initialise les paramètres avec les valeurs par défaut

    useEffect(() => {
        const loadSettings = async () => {
            const loaded = await loadSettingsFromFile();
            setSettings(loaded); //charge les paramètres depuis le fichier
        };
        loadSettings();
    }, []);

    // met à jour un paramètre donné
    const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    // sauvegarde les paramètres et affiche un message de succès
    const handleSave = async () => {
        await saveSettingsToFile(settings);
        Alert.alert('Succès', 'Paramètres sauvegardés.');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Paramètres</Text>

            {/* LANGUE */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Langue</Text>
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.language === 'en' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('language', 'en')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.language === 'en' && styles.segmentTextSelected,
                            ]}
                        >
                            English
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.language === 'fr' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('language', 'fr')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.language === 'fr' && styles.segmentTextSelected,
                            ]}
                        >
                            Français
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* THEME */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Thème</Text>
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.theme === 'normal' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('theme', 'normal')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.theme === 'normal' && styles.segmentTextSelected,
                            ]}
                        >
                            Normal
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.theme === 'dark' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('theme', 'dark')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.theme === 'dark' && styles.segmentTextSelected,
                            ]}
                        >
                            Dark
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* UNITÉS */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Unités</Text>
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.units === 'metric' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('units', 'metric')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.units === 'metric' && styles.segmentTextSelected,
                            ]}
                        >
                            kg / cm
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.segment,
                            settings.units === 'imperial' && styles.segmentSelected,
                        ]}
                        onPress={() => updateSetting('units', 'imperial')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                settings.units === 'imperial' && styles.segmentTextSelected,
                            ]}
                        >
                            lbs / inches
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* SONS ET VIBRATIONS */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Sons et vibrations</Text>
                <View style={styles.audioRow}>
                    <Text style={styles.audioLabel}>Sons</Text>
                    <Switch
                        value={settings.audioEnabled}
                        onValueChange={(value) => updateSetting('audioEnabled', value)}
                        thumbColor={'#fff'}
                        trackColor={{ false: '#ccc', true: '#b21ae5' }}
                    />
                </View>
                <View style={[styles.audioRow, { marginTop: 10 }]}>
                    <Text style={styles.audioLabel}>Vibrations</Text>
                    <Switch
                        value={settings.hapticsEnabled}
                        onValueChange={(value) => updateSetting('hapticsEnabled', value)}
                        thumbColor={'#fff'}
                        trackColor={{ false: '#ccc', true: '#b21ae5' }}
                    />
                </View>
            </View>

            {/* BOUTON SAUVEGARDER */}
            <TouchableOpacity style={[ButtonStyles.container, styles.saveButton]} onPress={handleSave}>
                <Text style={ButtonStyles.text}>Sauvegarder</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        marginBottom: 25,
    },
    sectionLabel: {
        fontSize: 18,
        marginBottom: 10,
        color: '#555',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#F1F1F1',
        borderRadius: 5,
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentSelected: {
        backgroundColor: '#b21ae5',
    },
    segmentText: {
        fontSize: 16,
        color: '#333',
    },
    segmentTextSelected: {
        color: '#fff',
    },
    audioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    audioLabel: {
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        marginTop: 20,
    },
});

export default ParameterScreen;
