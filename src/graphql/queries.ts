/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getExercise = /* GraphQL */ `query GetExercise($userId: ID!, $exerciseId: ID!) {
  getExercise(userId: $userId, exerciseId: $exerciseId) {
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
` as GeneratedQuery<
  APITypes.GetExerciseQueryVariables,
  APITypes.GetExerciseQuery
>;
export const listExercises = /* GraphQL */ `query ListExercises(
  $userId: ID
  $exerciseId: ModelIDKeyConditionInput
  $filter: ModelExerciseFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listExercises(
    userId: $userId
    exerciseId: $exerciseId
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListExercisesQueryVariables,
  APITypes.ListExercisesQuery
>;
export const getExerciseTracking = /* GraphQL */ `query GetExerciseTracking($id: ID!) {
  getExerciseTracking(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetExerciseTrackingQueryVariables,
  APITypes.GetExerciseTrackingQuery
>;
export const listExerciseTrackings = /* GraphQL */ `query ListExerciseTrackings(
  $filter: ModelExerciseTrackingFilterInput
  $limit: Int
  $nextToken: String
) {
  listExerciseTrackings(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListExerciseTrackingsQueryVariables,
  APITypes.ListExerciseTrackingsQuery
>;
