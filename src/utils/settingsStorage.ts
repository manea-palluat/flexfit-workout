// src/utils/settingsStorage.ts
import * as FileSystem from 'expo-file-system'; // (pas de commentaire sur les imports)

const SETTINGS_FILE = FileSystem.documentDirectory + 'settings.json'; //chemin du fichier de settings

export interface Settings {
    language: 'en' | 'fr'; // langue de l'app (en ou fr)
    theme: 'normal' | 'dark'; // thème choisi
    units: 'metric' | 'imperial'; // système de mesures
    audioEnabled: boolean; // son activé ou non
    hapticsEnabled: boolean; // vibrations activées ou pas
}

export const DEFAULT_SETTINGS: Settings = {
    language: 'en', // réglage par défaut : anglais
    theme: 'normal', // thème normal par défaut
    units: 'metric', // système métrique par défaut
    audioEnabled: true, // le son est activé par défaut
    hapticsEnabled: true, // les vibrations aussi
};

export const loadSettingsFromFile = async (): Promise<Settings> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE); //vérifie si le fichier existe
        if (!fileInfo.exists) {
            await saveSettingsToFile(DEFAULT_SETTINGS); //crée le fichier avec les settings par défaut
            return DEFAULT_SETTINGS; //retourne les réglages par défaut
        }
        const content = await FileSystem.readAsStringAsync(SETTINGS_FILE); //lit le contenu du fichier
        return JSON.parse(content); //convertit le JSON en objet Settings
    } catch (error) {
        console.error('Error loading settings from file:', error); //affiche l'erreur dans la console
        return DEFAULT_SETTINGS; //retourne les réglages par défaut en cas d'erreur
    }
};

export const saveSettingsToFile = async (settings: Settings): Promise<void> => {
    try {
        await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); //sauvegarde les réglages au format JSON
    } catch (error) {
        console.error('Error saving settings to file:', error); //affiche l'erreur si l'écriture échoue
    }
};
