/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateExerciseInput = {
  userId: string,
  exerciseId: string,
  name: string,
  muscleGroup: string,
  restTime: number,
  sets: number,
  reps: number,
};

export type ModelExerciseConditionInput = {
  name?: ModelStringInput | null,
  muscleGroup?: ModelStringInput | null,
  restTime?: ModelIntInput | null,
  sets?: ModelIntInput | null,
  reps?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
  and?: Array< ModelExerciseConditionInput | null > | null,
  or?: Array< ModelExerciseConditionInput | null > | null,
  not?: ModelExerciseConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Exercise = {
  __typename: "Exercise",
  userId: string,
  exerciseId: string,
  name: string,
  muscleGroup: string,
  restTime: number,
  sets: number,
  reps: number,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateExerciseInput = {
  userId: string,
  exerciseId: string,
  name?: string | null,
  muscleGroup?: string | null,
  restTime?: number | null,
  sets?: number | null,
  reps?: number | null,
};

export type DeleteExerciseInput = {
  userId: string,
  exerciseId: string,
};

export type CreateExerciseTrackingInput = {
  id?: string | null,
  userId: string,
  exerciseId: string,
  exerciseName: string,
  date: string,
  setsData: string,
};

export type ModelExerciseTrackingConditionInput = {
  userId?: ModelIDInput | null,
  exerciseId?: ModelStringInput | null,
  exerciseName?: ModelStringInput | null,
  date?: ModelStringInput | null,
  setsData?: ModelStringInput | null,
  and?: Array< ModelExerciseTrackingConditionInput | null > | null,
  or?: Array< ModelExerciseTrackingConditionInput | null > | null,
  not?: ModelExerciseTrackingConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ExerciseTracking = {
  __typename: "ExerciseTracking",
  id: string,
  userId: string,
  exerciseId: string,
  exerciseName: string,
  date: string,
  setsData: string,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type UpdateExerciseTrackingInput = {
  id: string,
  userId?: string | null,
  exerciseId?: string | null,
  exerciseName?: string | null,
  date?: string | null,
  setsData?: string | null,
};

export type DeleteExerciseTrackingInput = {
  id: string,
};

export type ModelIDKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export type ModelExerciseFilterInput = {
  userId?: ModelIDInput | null,
  exerciseId?: ModelIDInput | null,
  name?: ModelStringInput | null,
  muscleGroup?: ModelStringInput | null,
  restTime?: ModelIntInput | null,
  sets?: ModelIntInput | null,
  reps?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
  id?: ModelIDInput | null,
  and?: Array< ModelExerciseFilterInput | null > | null,
  or?: Array< ModelExerciseFilterInput | null > | null,
  not?: ModelExerciseFilterInput | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelExerciseConnection = {
  __typename: "ModelExerciseConnection",
  items:  Array<Exercise | null >,
  nextToken?: string | null,
};

export type ModelExerciseTrackingFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  exerciseId?: ModelStringInput | null,
  exerciseName?: ModelStringInput | null,
  date?: ModelStringInput | null,
  setsData?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelExerciseTrackingFilterInput | null > | null,
  or?: Array< ModelExerciseTrackingFilterInput | null > | null,
  not?: ModelExerciseTrackingFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelExerciseTrackingConnection = {
  __typename: "ModelExerciseTrackingConnection",
  items:  Array<ExerciseTracking | null >,
  nextToken?: string | null,
};

export type ModelSubscriptionExerciseFilterInput = {
  userId?: ModelSubscriptionIDInput | null,
  exerciseId?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  muscleGroup?: ModelSubscriptionStringInput | null,
  restTime?: ModelSubscriptionIntInput | null,
  sets?: ModelSubscriptionIntInput | null,
  reps?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  and?: Array< ModelSubscriptionExerciseFilterInput | null > | null,
  or?: Array< ModelSubscriptionExerciseFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionExerciseTrackingFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  userId?: ModelSubscriptionIDInput | null,
  exerciseId?: ModelSubscriptionStringInput | null,
  exerciseName?: ModelSubscriptionStringInput | null,
  date?: ModelSubscriptionStringInput | null,
  setsData?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionExerciseTrackingFilterInput | null > | null,
  or?: Array< ModelSubscriptionExerciseTrackingFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type CreateExerciseMutationVariables = {
  input: CreateExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type CreateExerciseMutation = {
  createExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateExerciseMutationVariables = {
  input: UpdateExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type UpdateExerciseMutation = {
  updateExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteExerciseMutationVariables = {
  input: DeleteExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type DeleteExerciseMutation = {
  deleteExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateExerciseTrackingMutationVariables = {
  input: CreateExerciseTrackingInput,
  condition?: ModelExerciseTrackingConditionInput | null,
};

export type CreateExerciseTrackingMutation = {
  createExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateExerciseTrackingMutationVariables = {
  input: UpdateExerciseTrackingInput,
  condition?: ModelExerciseTrackingConditionInput | null,
};

export type UpdateExerciseTrackingMutation = {
  updateExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteExerciseTrackingMutationVariables = {
  input: DeleteExerciseTrackingInput,
  condition?: ModelExerciseTrackingConditionInput | null,
};

export type DeleteExerciseTrackingMutation = {
  deleteExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type GetExerciseQueryVariables = {
  userId: string,
  exerciseId: string,
};

export type GetExerciseQuery = {
  getExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListExercisesQueryVariables = {
  userId?: string | null,
  exerciseId?: ModelIDKeyConditionInput | null,
  filter?: ModelExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListExercisesQuery = {
  listExercises?:  {
    __typename: "ModelExerciseConnection",
    items:  Array< {
      __typename: "Exercise",
      userId: string,
      exerciseId: string,
      name: string,
      muscleGroup: string,
      restTime: number,
      sets: number,
      reps: number,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetExerciseTrackingQueryVariables = {
  id: string,
};

export type GetExerciseTrackingQuery = {
  getExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListExerciseTrackingsQueryVariables = {
  filter?: ModelExerciseTrackingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExerciseTrackingsQuery = {
  listExerciseTrackings?:  {
    __typename: "ModelExerciseTrackingConnection",
    items:  Array< {
      __typename: "ExerciseTracking",
      id: string,
      userId: string,
      exerciseId: string,
      exerciseName: string,
      date: string,
      setsData: string,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null,
  owner?: string | null,
};

export type OnCreateExerciseSubscription = {
  onCreateExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null,
  owner?: string | null,
};

export type OnUpdateExerciseSubscription = {
  onUpdateExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteExerciseSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseFilterInput | null,
  owner?: string | null,
};

export type OnDeleteExerciseSubscription = {
  onDeleteExercise?:  {
    __typename: "Exercise",
    userId: string,
    exerciseId: string,
    name: string,
    muscleGroup: string,
    restTime: number,
    sets: number,
    reps: number,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateExerciseTrackingSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseTrackingFilterInput | null,
  owner?: string | null,
};

export type OnCreateExerciseTrackingSubscription = {
  onCreateExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateExerciseTrackingSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseTrackingFilterInput | null,
  owner?: string | null,
};

export type OnUpdateExerciseTrackingSubscription = {
  onUpdateExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteExerciseTrackingSubscriptionVariables = {
  filter?: ModelSubscriptionExerciseTrackingFilterInput | null,
  owner?: string | null,
};

export type OnDeleteExerciseTrackingSubscription = {
  onDeleteExerciseTracking?:  {
    __typename: "ExerciseTracking",
    id: string,
    userId: string,
    exerciseId: string,
    exerciseName: string,
    date: string,
    setsData: string,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};
