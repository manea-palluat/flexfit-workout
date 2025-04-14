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
export const getMensuration = /* GraphQL */ `query GetMensuration($id: ID!) {
  getMensuration(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetMensurationQueryVariables,
  APITypes.GetMensurationQuery
>;
export const listMensurations = /* GraphQL */ `query ListMensurations(
  $filter: ModelMensurationFilterInput
  $limit: Int
  $nextToken: String
) {
  listMensurations(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      name
      unit
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
  APITypes.ListMensurationsQueryVariables,
  APITypes.ListMensurationsQuery
>;
export const getMeasure = /* GraphQL */ `query GetMeasure($id: ID!) {
  getMeasure(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetMeasureQueryVariables,
  APITypes.GetMeasureQuery
>;
export const listMeasures = /* GraphQL */ `query ListMeasures(
  $filter: ModelMeasureFilterInput
  $limit: Int
  $nextToken: String
) {
  listMeasures(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMeasuresQueryVariables,
  APITypes.ListMeasuresQuery
>;
export const measuresByMensurationIdAndDate = /* GraphQL */ `query MeasuresByMensurationIdAndDate(
  $mensurationId: ID!
  $date: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelMeasureFilterInput
  $limit: Int
  $nextToken: String
) {
  measuresByMensurationIdAndDate(
    mensurationId: $mensurationId
    date: $date
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.MeasuresByMensurationIdAndDateQueryVariables,
  APITypes.MeasuresByMensurationIdAndDateQuery
>;
