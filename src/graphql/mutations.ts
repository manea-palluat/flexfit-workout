/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createExercise = /* GraphQL */ `mutation CreateExercise(
  $input: CreateExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  createExercise(input: $input, condition: $condition) {
    userId
    exerciseId
    name
    muscleGroup
    restTime
    sets
    reps
    exerciseType
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateExerciseMutationVariables,
  APITypes.CreateExerciseMutation
>;
export const updateExercise = /* GraphQL */ `mutation UpdateExercise(
  $input: UpdateExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  updateExercise(input: $input, condition: $condition) {
    userId
    exerciseId
    name
    muscleGroup
    restTime
    sets
    reps
    exerciseType
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateExerciseMutationVariables,
  APITypes.UpdateExerciseMutation
>;
export const deleteExercise = /* GraphQL */ `mutation DeleteExercise(
  $input: DeleteExerciseInput!
  $condition: ModelExerciseConditionInput
) {
  deleteExercise(input: $input, condition: $condition) {
    userId
    exerciseId
    name
    muscleGroup
    restTime
    sets
    reps
    exerciseType
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteExerciseMutationVariables,
  APITypes.DeleteExerciseMutation
>;
export const createExerciseTracking = /* GraphQL */ `mutation CreateExerciseTracking(
  $input: CreateExerciseTrackingInput!
  $condition: ModelExerciseTrackingConditionInput
) {
  createExerciseTracking(input: $input, condition: $condition) {
    id
    userId
    exerciseId
    exerciseName
    date
    setsData
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateExerciseTrackingMutationVariables,
  APITypes.CreateExerciseTrackingMutation
>;
export const updateExerciseTracking = /* GraphQL */ `mutation UpdateExerciseTracking(
  $input: UpdateExerciseTrackingInput!
  $condition: ModelExerciseTrackingConditionInput
) {
  updateExerciseTracking(input: $input, condition: $condition) {
    id
    userId
    exerciseId
    exerciseName
    date
    setsData
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateExerciseTrackingMutationVariables,
  APITypes.UpdateExerciseTrackingMutation
>;
export const deleteExerciseTracking = /* GraphQL */ `mutation DeleteExerciseTracking(
  $input: DeleteExerciseTrackingInput!
  $condition: ModelExerciseTrackingConditionInput
) {
  deleteExerciseTracking(input: $input, condition: $condition) {
    id
    userId
    exerciseId
    exerciseName
    date
    setsData
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteExerciseTrackingMutationVariables,
  APITypes.DeleteExerciseTrackingMutation
>;
export const createMensuration = /* GraphQL */ `mutation CreateMensuration(
  $input: CreateMensurationInput!
  $condition: ModelMensurationConditionInput
) {
  createMensuration(input: $input, condition: $condition) {
    id
    userId
    name
    unit
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMensurationMutationVariables,
  APITypes.CreateMensurationMutation
>;
export const updateMensuration = /* GraphQL */ `mutation UpdateMensuration(
  $input: UpdateMensurationInput!
  $condition: ModelMensurationConditionInput
) {
  updateMensuration(input: $input, condition: $condition) {
    id
    userId
    name
    unit
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMensurationMutationVariables,
  APITypes.UpdateMensurationMutation
>;
export const deleteMensuration = /* GraphQL */ `mutation DeleteMensuration(
  $input: DeleteMensurationInput!
  $condition: ModelMensurationConditionInput
) {
  deleteMensuration(input: $input, condition: $condition) {
    id
    userId
    name
    unit
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMensurationMutationVariables,
  APITypes.DeleteMensurationMutation
>;
export const createMeasure = /* GraphQL */ `mutation CreateMeasure(
  $input: CreateMeasureInput!
  $condition: ModelMeasureConditionInput
) {
  createMeasure(input: $input, condition: $condition) {
    id
    mensurationId
    userId
    date
    value
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMeasureMutationVariables,
  APITypes.CreateMeasureMutation
>;
export const updateMeasure = /* GraphQL */ `mutation UpdateMeasure(
  $input: UpdateMeasureInput!
  $condition: ModelMeasureConditionInput
) {
  updateMeasure(input: $input, condition: $condition) {
    id
    mensurationId
    userId
    date
    value
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMeasureMutationVariables,
  APITypes.UpdateMeasureMutation
>;
export const deleteMeasure = /* GraphQL */ `mutation DeleteMeasure(
  $input: DeleteMeasureInput!
  $condition: ModelMeasureConditionInput
) {
  deleteMeasure(input: $input, condition: $condition) {
    id
    mensurationId
    userId
    date
    value
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMeasureMutationVariables,
  APITypes.DeleteMeasureMutation
>;
