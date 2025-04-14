
# 💪 FlexFit

**FlexFit** est une application mobile de suivi d'entraînement développée avec **React Native** via **Expo**.  
Pensée pour être intuitive, motivante et complète, elle combine :
- un système de création et suivi d’exercices,
- des animations et retours haptiques pendant les séances,
- un suivi visuel des performances,
- et un enregistrement des mensurations.

---

## ⚙️ Installation rapide

### 1. Cloner le projet

```bash
git clone https://github.com/Maneaaa/flexfitprojet
cd flexfit
```

### 2. Installer les dépendances

```bash
npm install
```

> ✅ Assurez-vous d’avoir **Node.js 18+** installé.  
> Vous pouvez utiliser [nvm](https://github.com/nvm-sh/nvm) pour gérer les versions facilement :
>
> ```bash
> nvm install 18
> nvm use 18
> ```

### 3. Installer Expo Go sur votre téléphone

- 📱 Android : [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)  
- 🍏 iOS : [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 4. Lancer le projet

```bash
npm start
```

Une page s’ouvrira dans votre navigateur avec un QR code à scanner dans Expo Go.  
Vous pouvez aussi utiliser un émulateur Android / iOS si vous êtes sur un environnement de développement adapté.

---

## 🚀 Scripts disponibles (`package.json`)

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
}
```

- `npm start` → démarre l'interface Expo
- `npm run android` → lance sur un émulateur Android
- `npm run ios` → lance sur un simulateur iOS (macOS uniquement)

Vous pouvez aussi ajouter un script pour tout nettoyer si besoin :

```json
"clean": "rm -rf node_modules package-lock.json && npm install"
```

---

## 🧠 Backend (AWS Amplify)

Le projet utilise **AWS Amplify** pour la gestion des utilisateurs, des données (DynamoDB) et des appels via AppSync (GraphQL).

### ✅ Bon à savoir

- Le dossier `amplify/` est bien **versionné** dans Git, y compris :
  - le schéma GraphQL (`schema.graphql`)
  - les fonctions résolveurs, les paramètres, la configuration du cloud
- Le fichier `aws-exports.js` est **généré automatiquement** à l’installation et **ne doit pas être modifié manuellement**.
- Pour reconfigurer Amplify si besoin :

```bash
amplify pull
```

> ℹ️ Il faut que l’utilisateur soit connecté à AWS Amplify via le CLI (`amplify configure`) et possède les droits sur le projet cloud.

---

## 🧱 Structure du projet (résumé)

```
src/
├── assets/                   → Images, icônes...
├── components/              → Composants réutilisables (modals, boutons, filtres...)
├── context/                 → Contexte React pour état global
├── graphql/                 → Queries, mutations et subs générées par Amplify
├── legal/                   → CGU, politique de confidentialité
├── screens/                 → Tous les écrans principaux de l’application
├── styles/                  → Fichiers de style (boutons, textes, inputs)
├── types/                   → Types personnalisés TypeScript
├── utils/                   → Fonctions utilitaires (stockage local, police...)
App.tsx                      → Point d’entrée de l’app
amplify/                     → Backend AWS Amplify (GraphQL, Auth, Storage...)
```

---

## 📱 Fonctionnalités

- Création de groupes musculaires et d'exercices
- Déroulé d’une séance avec :
  - Séries à valider
  - Chronomètre de repos
  - Sons, vibrations, animations
- Enregistrement des performances et du poids soulevé
- Calcul automatique du 1RM théorique
- Suivi des mensurations avec :
  - Graphiques d’évolution
  - Historique
  - Résumé rapide
- Interface colorée avec thème violet inspiré d’un axolotl 🦎

---

## 🧼 Conseils pour éviter les bugs

- Toujours utiliser `npm install` sans modifier les versions des packages.
- Vérifiez que vous avez bien **Node.js 18**.
- Ne pas supprimer les fichiers `package-lock.json`, `aws-exports.js`, ou `amplify/`.
- Si problème, essayer :

```bash
npm run clean
npm start
```

---

## 🧪 Points à tester après installation

- ✅ Le projet compile sans erreur (`npm start`)
- ✅ QR code lisible dans Expo Go
- ✅ Navigation fluide entre les écrans
- ✅ Sons / vibrations / animations fonctionnent en séance
- ✅ Graphiques visibles dans le suivi des performances
- ✅ Authentification Amplify fonctionnelle

---

Merci pour votre lecture et vos retours 🙏  