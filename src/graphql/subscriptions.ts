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
