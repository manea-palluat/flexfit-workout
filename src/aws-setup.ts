// src/aws-setup.ts
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports'; // Ensure this path is correct (and omit the .js extension if using TypeScript)

Amplify.configure(awsconfig);
