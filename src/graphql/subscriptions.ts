/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateExercise = /* GraphQL */ `subscription OnCreateExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onCreateExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateExerciseSubscriptionVariables,
  APITypes.OnCreateExerciseSubscription
>;
export const onUpdateExercise = /* GraphQL */ `subscription OnUpdateExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onUpdateExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateExerciseSubscriptionVariables,
  APITypes.OnUpdateExerciseSubscription
>;
export const onDeleteExercise = /* GraphQL */ `subscription OnDeleteExercise(
  $filter: ModelSubscriptionExerciseFilterInput
  $owner: String
) {
  onDeleteExercise(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteExerciseSubscriptionVariables,
  APITypes.OnDeleteExerciseSubscription
>;
export const onCreateExerciseTracking = /* GraphQL */ `subscription OnCreateExerciseTracking(
  $filter: ModelSubscriptionExerciseTrackingFilterInput
  $owner: String
) {
  onCreateExerciseTracking(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateExerciseTrackingSubscriptionVariables,
  APITypes.OnCreateExerciseTrackingSubscription
>;
export const onUpdateExerciseTracking = /* GraphQL */ `subscription OnUpdateExerciseTracking(
  $filter: ModelSubscriptionExerciseTrackingFilterInput
  $owner: String
) {
  onUpdateExerciseTracking(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateExerciseTrackingSubscriptionVariables,
  APITypes.OnUpdateExerciseTrackingSubscription
>;
export const onDeleteExerciseTracking = /* GraphQL */ `subscription OnDeleteExerciseTracking(
  $filter: ModelSubscriptionExerciseTrackingFilterInput
  $owner: String
) {
  onDeleteExerciseTracking(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteExerciseTrackingSubscriptionVariables,
  APITypes.OnDeleteExerciseTrackingSubscription
>;
export const onCreateMensuration = /* GraphQL */ `subscription OnCreateMensuration(
  $filter: ModelSubscriptionMensurationFilterInput
  $owner: String
) {
  onCreateMensuration(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMensurationSubscriptionVariables,
  APITypes.OnCreateMensurationSubscription
>;
export const onUpdateMensuration = /* GraphQL */ `subscription OnUpdateMensuration(
  $filter: ModelSubscriptionMensurationFilterInput
  $owner: String
) {
  onUpdateMensuration(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMensurationSubscriptionVariables,
  APITypes.OnUpdateMensurationSubscription
>;
export const onDeleteMensuration = /* GraphQL */ `subscription OnDeleteMensuration(
  $filter: ModelSubscriptionMensurationFilterInput
  $owner: String
) {
  onDeleteMensuration(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMensurationSubscriptionVariables,
  APITypes.OnDeleteMensurationSubscription
>;
export const onCreateMeasure = /* GraphQL */ `subscription OnCreateMeasure(
  $filter: ModelSubscriptionMeasureFilterInput
  $owner: String
) {
  onCreateMeasure(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMeasureSubscriptionVariables,
  APITypes.OnCreateMeasureSubscription
>;
export const onUpdateMeasure = /* GraphQL */ `subscription OnUpdateMeasure(
  $filter: ModelSubscriptionMeasureFilterInput
  $owner: String
) {
  onUpdateMeasure(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMeasureSubscriptionVariables,
  APITypes.OnUpdateMeasureSubscription
>;
export const onDeleteMeasure = /* GraphQL */ `subscription OnDeleteMeasure(
  $filter: ModelSubscriptionMeasureFilterInput
  $owner: String
) {
  onDeleteMeasure(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMeasureSubscriptionVariables,
  APITypes.OnDeleteMeasureSubscription
>;
