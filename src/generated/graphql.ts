import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
};

export type BillingStats = {
  __typename?: 'BillingStats';
  totalCalls: Scalars['Int']['output'];
  totalCost: Scalars['Float']['output'];
  totalMinutes: Scalars['Float']['output'];
};

export type BillingStatsResponse = {
  __typename?: 'BillingStatsResponse';
  data?: Maybe<BillingStats>;
  userError?: Maybe<UserError>;
};

export type Campaign = {
  __typename?: 'Campaign';
  completed?: Maybe<Scalars['Int']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  execution_status?: Maybe<Scalars['String']['output']>;
  failed?: Maybe<Scalars['Int']['output']>;
  file_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  in_progress?: Maybe<Scalars['Int']['output']>;
  leads_count?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  remaining?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['String']['output']>;
};

export type CampaignLeadPaginationResult = {
  __typename?: 'CampaignLeadPaginationResult';
  totalLeads?: Maybe<Scalars['Int']['output']>;
  totalPages?: Maybe<Scalars['Int']['output']>;
  userError?: Maybe<UserError>;
};

export type CampaignListResponse = {
  __typename?: 'CampaignListResponse';
  data?: Maybe<Array<Campaign>>;
  userError?: Maybe<UserError>;
};

export type CampaignResponse = {
  __typename?: 'CampaignResponse';
  data?: Maybe<Campaign>;
  userError?: Maybe<UserError>;
};

export type CampaignStats = {
  __typename?: 'CampaignStats';
  completed?: Maybe<Scalars['Int']['output']>;
  failed?: Maybe<Scalars['Int']['output']>;
  inProgress?: Maybe<Scalars['Int']['output']>;
  remaining?: Maybe<Scalars['Int']['output']>;
  totalCost?: Maybe<Scalars['Float']['output']>;
  totalDuration?: Maybe<Scalars['Float']['output']>;
};

export type CampaignStatsResponse = {
  __typename?: 'CampaignStatsResponse';
  data?: Maybe<CampaignStats>;
  userError?: Maybe<UserError>;
};

export type Lead = {
  __typename?: 'Lead';
  campaign_id?: Maybe<Scalars['String']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  disposition?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  id: Scalars['String']['output'];
  initiated?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phone_id?: Maybe<Scalars['String']['output']>;
  phone_number?: Maybe<Scalars['String']['output']>;
  recordingUrl?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type LeadInput = {
  cost?: InputMaybe<Scalars['Float']['input']>;
  disposition?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Float']['input']>;
  initiated?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone_id?: InputMaybe<Scalars['String']['input']>;
  phone_number: Scalars['String']['input'];
  recordingUrl?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type LeadListResponse = {
  __typename?: 'LeadListResponse';
  data?: Maybe<Array<Lead>>;
  userError?: Maybe<UserError>;
};

export type LoginInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type LoginPayload = {
  __typename?: 'LoginPayload';
  accessToken: Scalars['String']['output'];
  user: User;
};

export type Mutation = {
  __typename?: 'Mutation';
  addLeadsToCampaign: CampaignResponse;
  createCampaign: CampaignResponse;
  enqueueCampaignJob: QueueResponse;
  login: LoginPayload;
  refresh: AuthPayload;
  register: RegisterResponse;
  stopCampaignJob: QueueResponse;
};


export type MutationAddLeadsToCampaignArgs = {
  campaignId: Scalars['String']['input'];
  leads: Array<LeadInput>;
};


export type MutationCreateCampaignArgs = {
  campaignName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationEnqueueCampaignJobArgs = {
  campaignId: Scalars['String']['input'];
  pacingPerSecond?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationLoginArgs = {
  data: LoginInput;
};


export type MutationRegisterArgs = {
  data: RegisterInput;
};


export type MutationStopCampaignJobArgs = {
  campaignId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  fetchBillingData: BillingStatsResponse;
  fetchCampaignById: CampaignResponse;
  fetchCampaignStats: CampaignStatsResponse;
  fetchCampaigns: CampaignListResponse;
  fetchLeadsForCampaign: LeadListResponse;
  getMultipleAvailablePhoneIds: Array<Scalars['String']['output']>;
  getTotalPagesForCampaign: CampaignLeadPaginationResult;
};


export type QueryFetchBillingDataArgs = {
  end: Scalars['String']['input'];
  start: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type QueryFetchCampaignByIdArgs = {
  campaignId: Scalars['ID']['input'];
};


export type QueryFetchCampaignStatsArgs = {
  campaignId: Scalars['ID']['input'];
};


export type QueryFetchCampaignsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryFetchLeadsForCampaignArgs = {
  campaignId: Scalars['String']['input'];
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetMultipleAvailablePhoneIdsArgs = {
  count: Scalars['Int']['input'];
};


export type QueryGetTotalPagesForCampaignArgs = {
  campaignId: Scalars['String']['input'];
  itemsPerPage?: InputMaybe<Scalars['Int']['input']>;
};

export type QueueResponse = {
  __typename?: 'QueueResponse';
  success?: Maybe<Scalars['Boolean']['output']>;
  userError?: Maybe<UserError>;
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type RegisterResponse = {
  __typename?: 'RegisterResponse';
  message: Scalars['String']['output'];
  user: User;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type UserError = {
  __typename?: 'UserError';
  message: Scalars['String']['output'];
};

export type RegisterMutationVariables = Exact<{
  data: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'RegisterResponse', message: string, user: { __typename?: 'User', id: string, username: string, email: string } } };

export type LoginMutationVariables = Exact<{
  data: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'LoginPayload', accessToken: string, user: { __typename?: 'User', id: string, username: string } } };

export type RefreshMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshMutation = { __typename?: 'Mutation', refresh: { __typename?: 'AuthPayload', accessToken: string } };

export type FetchBillingDataQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  start: Scalars['String']['input'];
  end: Scalars['String']['input'];
}>;


export type FetchBillingDataQuery = { __typename?: 'Query', fetchBillingData: { __typename?: 'BillingStatsResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: { __typename?: 'BillingStats', totalCalls: number, totalMinutes: number, totalCost: number } | null } };

export type FetchCampaignsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type FetchCampaignsQuery = { __typename?: 'Query', fetchCampaigns: { __typename?: 'CampaignListResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: Array<{ __typename?: 'Campaign', id: string, name: string, file_name?: string | null, status?: string | null, execution_status?: string | null, leads_count?: number | null, completed?: number | null, in_progress?: number | null, remaining?: number | null, failed?: number | null, duration?: number | null, cost?: number | null, user_id?: string | null, created_at?: string | null }> | null } };

export type FetchLeadsForCampaignQueryVariables = Exact<{
  campaignId: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
}>;


export type FetchLeadsForCampaignQuery = { __typename?: 'Query', fetchLeadsForCampaign: { __typename?: 'LeadListResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: Array<{ __typename?: 'Lead', id: string, name?: string | null, phone_number?: string | null, phone_id?: string | null, status?: string | null, disposition?: string | null, duration?: number | null, cost?: number | null, recordingUrl?: string | null, created_at?: string | null, campaign_id?: string | null, initiated?: boolean | null }> | null } };

export type FetchCampaignByIdQueryVariables = Exact<{
  campaignId: Scalars['ID']['input'];
}>;


export type FetchCampaignByIdQuery = { __typename?: 'Query', fetchCampaignById: { __typename?: 'CampaignResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: { __typename?: 'Campaign', id: string, name: string, file_name?: string | null, status?: string | null, execution_status?: string | null, leads_count?: number | null, completed?: number | null, in_progress?: number | null, remaining?: number | null, failed?: number | null, duration?: number | null, cost?: number | null, user_id?: string | null, created_at?: string | null } | null } };

export type FetchCampaignStatsQueryVariables = Exact<{
  campaignId: Scalars['ID']['input'];
}>;


export type FetchCampaignStatsQuery = { __typename?: 'Query', fetchCampaignStats: { __typename?: 'CampaignStatsResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: { __typename?: 'CampaignStats', completed?: number | null, inProgress?: number | null, remaining?: number | null, failed?: number | null, totalDuration?: number | null, totalCost?: number | null } | null } };

export type GetTotalPagesForCampaignQueryVariables = Exact<{
  campaignId: Scalars['String']['input'];
  itemsPerPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTotalPagesForCampaignQuery = { __typename?: 'Query', getTotalPagesForCampaign: { __typename?: 'CampaignLeadPaginationResult', totalPages?: number | null, totalLeads?: number | null } };

export type CreateCampaignMutationVariables = Exact<{
  campaignName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type CreateCampaignMutation = { __typename?: 'Mutation', createCampaign: { __typename?: 'CampaignResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: { __typename?: 'Campaign', id: string, name: string, user_id?: string | null, created_at?: string | null } | null } };

export type AddLeadsToCampaignMutationVariables = Exact<{
  campaignId: Scalars['String']['input'];
  leads: Array<LeadInput> | LeadInput;
}>;


export type AddLeadsToCampaignMutation = { __typename?: 'Mutation', addLeadsToCampaign: { __typename?: 'CampaignResponse', userError?: { __typename?: 'UserError', message: string } | null, data?: { __typename?: 'Campaign', id: string, name: string, leads_count?: number | null } | null } };

export type EnqueueCampaignJobMutationVariables = Exact<{
  campaignId: Scalars['String']['input'];
  pacingPerSecond?: InputMaybe<Scalars['Int']['input']>;
}>;


export type EnqueueCampaignJobMutation = { __typename?: 'Mutation', enqueueCampaignJob: { __typename?: 'QueueResponse', success?: boolean | null, userError?: { __typename?: 'UserError', message: string } | null } };

export type StopCampaignJobMutationVariables = Exact<{
  campaignId: Scalars['String']['input'];
}>;


export type StopCampaignJobMutation = { __typename?: 'Mutation', stopCampaignJob: { __typename?: 'QueueResponse', success?: boolean | null, userError?: { __typename?: 'UserError', message: string } | null } };

export type GetMultipleAvailablePhoneIdsQueryVariables = Exact<{
  count: Scalars['Int']['input'];
}>;


export type GetMultipleAvailablePhoneIdsQuery = { __typename?: 'Query', getMultipleAvailablePhoneIds: Array<string> };


export const RegisterDocument = gql`
    mutation Register($data: RegisterInput!) {
  register(data: $data) {
    message
    user {
      id
      username
      email
    }
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = gql`
    mutation Login($data: LoginInput!) {
  login(data: $data) {
    accessToken
    user {
      id
      username
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RefreshDocument = gql`
    mutation Refresh {
  refresh {
    accessToken
  }
}
    `;
export type RefreshMutationFn = Apollo.MutationFunction<RefreshMutation, RefreshMutationVariables>;

/**
 * __useRefreshMutation__
 *
 * To run a mutation, you first call `useRefreshMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshMutation, { data, loading, error }] = useRefreshMutation({
 *   variables: {
 *   },
 * });
 */
export function useRefreshMutation(baseOptions?: Apollo.MutationHookOptions<RefreshMutation, RefreshMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RefreshMutation, RefreshMutationVariables>(RefreshDocument, options);
      }
export type RefreshMutationHookResult = ReturnType<typeof useRefreshMutation>;
export type RefreshMutationResult = Apollo.MutationResult<RefreshMutation>;
export type RefreshMutationOptions = Apollo.BaseMutationOptions<RefreshMutation, RefreshMutationVariables>;
export const FetchBillingDataDocument = gql`
    query FetchBillingData($userId: String!, $start: String!, $end: String!) {
  fetchBillingData(userId: $userId, start: $start, end: $end) {
    userError {
      message
    }
    data {
      totalCalls
      totalMinutes
      totalCost
    }
  }
}
    `;

/**
 * __useFetchBillingDataQuery__
 *
 * To run a query within a React component, call `useFetchBillingDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchBillingDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchBillingDataQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      start: // value for 'start'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useFetchBillingDataQuery(baseOptions: Apollo.QueryHookOptions<FetchBillingDataQuery, FetchBillingDataQueryVariables> & ({ variables: FetchBillingDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchBillingDataQuery, FetchBillingDataQueryVariables>(FetchBillingDataDocument, options);
      }
export function useFetchBillingDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchBillingDataQuery, FetchBillingDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchBillingDataQuery, FetchBillingDataQueryVariables>(FetchBillingDataDocument, options);
        }
export function useFetchBillingDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchBillingDataQuery, FetchBillingDataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchBillingDataQuery, FetchBillingDataQueryVariables>(FetchBillingDataDocument, options);
        }
export type FetchBillingDataQueryHookResult = ReturnType<typeof useFetchBillingDataQuery>;
export type FetchBillingDataLazyQueryHookResult = ReturnType<typeof useFetchBillingDataLazyQuery>;
export type FetchBillingDataSuspenseQueryHookResult = ReturnType<typeof useFetchBillingDataSuspenseQuery>;
export type FetchBillingDataQueryResult = Apollo.QueryResult<FetchBillingDataQuery, FetchBillingDataQueryVariables>;
export const FetchCampaignsDocument = gql`
    query FetchCampaigns($userId: String!) {
  fetchCampaigns(userId: $userId) {
    userError {
      message
    }
    data {
      id
      name
      file_name
      status
      execution_status
      leads_count
      completed
      in_progress
      remaining
      failed
      duration
      cost
      user_id
      created_at
    }
  }
}
    `;

/**
 * __useFetchCampaignsQuery__
 *
 * To run a query within a React component, call `useFetchCampaignsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchCampaignsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchCampaignsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useFetchCampaignsQuery(baseOptions: Apollo.QueryHookOptions<FetchCampaignsQuery, FetchCampaignsQueryVariables> & ({ variables: FetchCampaignsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchCampaignsQuery, FetchCampaignsQueryVariables>(FetchCampaignsDocument, options);
      }
export function useFetchCampaignsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchCampaignsQuery, FetchCampaignsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchCampaignsQuery, FetchCampaignsQueryVariables>(FetchCampaignsDocument, options);
        }
export function useFetchCampaignsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchCampaignsQuery, FetchCampaignsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchCampaignsQuery, FetchCampaignsQueryVariables>(FetchCampaignsDocument, options);
        }
export type FetchCampaignsQueryHookResult = ReturnType<typeof useFetchCampaignsQuery>;
export type FetchCampaignsLazyQueryHookResult = ReturnType<typeof useFetchCampaignsLazyQuery>;
export type FetchCampaignsSuspenseQueryHookResult = ReturnType<typeof useFetchCampaignsSuspenseQuery>;
export type FetchCampaignsQueryResult = Apollo.QueryResult<FetchCampaignsQuery, FetchCampaignsQueryVariables>;
export const FetchLeadsForCampaignDocument = gql`
    query FetchLeadsForCampaign($campaignId: String!, $skip: Int, $take: Int, $searchTerm: String) {
  fetchLeadsForCampaign(
    campaignId: $campaignId
    skip: $skip
    take: $take
    searchTerm: $searchTerm
  ) {
    userError {
      message
    }
    data {
      id
      name
      phone_number
      phone_id
      status
      disposition
      duration
      cost
      recordingUrl
      created_at
      campaign_id
      initiated
    }
  }
}
    `;

/**
 * __useFetchLeadsForCampaignQuery__
 *
 * To run a query within a React component, call `useFetchLeadsForCampaignQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchLeadsForCampaignQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchLeadsForCampaignQuery({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *      skip: // value for 'skip'
 *      take: // value for 'take'
 *      searchTerm: // value for 'searchTerm'
 *   },
 * });
 */
export function useFetchLeadsForCampaignQuery(baseOptions: Apollo.QueryHookOptions<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables> & ({ variables: FetchLeadsForCampaignQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>(FetchLeadsForCampaignDocument, options);
      }
export function useFetchLeadsForCampaignLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>(FetchLeadsForCampaignDocument, options);
        }
export function useFetchLeadsForCampaignSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>(FetchLeadsForCampaignDocument, options);
        }
export type FetchLeadsForCampaignQueryHookResult = ReturnType<typeof useFetchLeadsForCampaignQuery>;
export type FetchLeadsForCampaignLazyQueryHookResult = ReturnType<typeof useFetchLeadsForCampaignLazyQuery>;
export type FetchLeadsForCampaignSuspenseQueryHookResult = ReturnType<typeof useFetchLeadsForCampaignSuspenseQuery>;
export type FetchLeadsForCampaignQueryResult = Apollo.QueryResult<FetchLeadsForCampaignQuery, FetchLeadsForCampaignQueryVariables>;
export const FetchCampaignByIdDocument = gql`
    query FetchCampaignById($campaignId: ID!) {
  fetchCampaignById(campaignId: $campaignId) {
    userError {
      message
    }
    data {
      id
      name
      file_name
      status
      execution_status
      leads_count
      completed
      in_progress
      remaining
      failed
      duration
      cost
      user_id
      created_at
    }
  }
}
    `;

/**
 * __useFetchCampaignByIdQuery__
 *
 * To run a query within a React component, call `useFetchCampaignByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchCampaignByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchCampaignByIdQuery({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *   },
 * });
 */
export function useFetchCampaignByIdQuery(baseOptions: Apollo.QueryHookOptions<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables> & ({ variables: FetchCampaignByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>(FetchCampaignByIdDocument, options);
      }
export function useFetchCampaignByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>(FetchCampaignByIdDocument, options);
        }
export function useFetchCampaignByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>(FetchCampaignByIdDocument, options);
        }
export type FetchCampaignByIdQueryHookResult = ReturnType<typeof useFetchCampaignByIdQuery>;
export type FetchCampaignByIdLazyQueryHookResult = ReturnType<typeof useFetchCampaignByIdLazyQuery>;
export type FetchCampaignByIdSuspenseQueryHookResult = ReturnType<typeof useFetchCampaignByIdSuspenseQuery>;
export type FetchCampaignByIdQueryResult = Apollo.QueryResult<FetchCampaignByIdQuery, FetchCampaignByIdQueryVariables>;
export const FetchCampaignStatsDocument = gql`
    query FetchCampaignStats($campaignId: ID!) {
  fetchCampaignStats(campaignId: $campaignId) {
    userError {
      message
    }
    data {
      completed
      inProgress
      remaining
      failed
      totalDuration
      totalCost
    }
  }
}
    `;

/**
 * __useFetchCampaignStatsQuery__
 *
 * To run a query within a React component, call `useFetchCampaignStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchCampaignStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchCampaignStatsQuery({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *   },
 * });
 */
export function useFetchCampaignStatsQuery(baseOptions: Apollo.QueryHookOptions<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables> & ({ variables: FetchCampaignStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>(FetchCampaignStatsDocument, options);
      }
export function useFetchCampaignStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>(FetchCampaignStatsDocument, options);
        }
export function useFetchCampaignStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>(FetchCampaignStatsDocument, options);
        }
export type FetchCampaignStatsQueryHookResult = ReturnType<typeof useFetchCampaignStatsQuery>;
export type FetchCampaignStatsLazyQueryHookResult = ReturnType<typeof useFetchCampaignStatsLazyQuery>;
export type FetchCampaignStatsSuspenseQueryHookResult = ReturnType<typeof useFetchCampaignStatsSuspenseQuery>;
export type FetchCampaignStatsQueryResult = Apollo.QueryResult<FetchCampaignStatsQuery, FetchCampaignStatsQueryVariables>;
export const GetTotalPagesForCampaignDocument = gql`
    query GetTotalPagesForCampaign($campaignId: String!, $itemsPerPage: Int) {
  getTotalPagesForCampaign(campaignId: $campaignId, itemsPerPage: $itemsPerPage) {
    totalPages
    totalLeads
  }
}
    `;

/**
 * __useGetTotalPagesForCampaignQuery__
 *
 * To run a query within a React component, call `useGetTotalPagesForCampaignQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTotalPagesForCampaignQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTotalPagesForCampaignQuery({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *      itemsPerPage: // value for 'itemsPerPage'
 *   },
 * });
 */
export function useGetTotalPagesForCampaignQuery(baseOptions: Apollo.QueryHookOptions<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables> & ({ variables: GetTotalPagesForCampaignQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>(GetTotalPagesForCampaignDocument, options);
      }
export function useGetTotalPagesForCampaignLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>(GetTotalPagesForCampaignDocument, options);
        }
export function useGetTotalPagesForCampaignSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>(GetTotalPagesForCampaignDocument, options);
        }
export type GetTotalPagesForCampaignQueryHookResult = ReturnType<typeof useGetTotalPagesForCampaignQuery>;
export type GetTotalPagesForCampaignLazyQueryHookResult = ReturnType<typeof useGetTotalPagesForCampaignLazyQuery>;
export type GetTotalPagesForCampaignSuspenseQueryHookResult = ReturnType<typeof useGetTotalPagesForCampaignSuspenseQuery>;
export type GetTotalPagesForCampaignQueryResult = Apollo.QueryResult<GetTotalPagesForCampaignQuery, GetTotalPagesForCampaignQueryVariables>;
export const CreateCampaignDocument = gql`
    mutation CreateCampaign($campaignName: String!, $userId: String!) {
  createCampaign(campaignName: $campaignName, userId: $userId) {
    userError {
      message
    }
    data {
      id
      name
      user_id
      created_at
    }
  }
}
    `;
export type CreateCampaignMutationFn = Apollo.MutationFunction<CreateCampaignMutation, CreateCampaignMutationVariables>;

/**
 * __useCreateCampaignMutation__
 *
 * To run a mutation, you first call `useCreateCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCampaignMutation, { data, loading, error }] = useCreateCampaignMutation({
 *   variables: {
 *      campaignName: // value for 'campaignName'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useCreateCampaignMutation(baseOptions?: Apollo.MutationHookOptions<CreateCampaignMutation, CreateCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCampaignMutation, CreateCampaignMutationVariables>(CreateCampaignDocument, options);
      }
export type CreateCampaignMutationHookResult = ReturnType<typeof useCreateCampaignMutation>;
export type CreateCampaignMutationResult = Apollo.MutationResult<CreateCampaignMutation>;
export type CreateCampaignMutationOptions = Apollo.BaseMutationOptions<CreateCampaignMutation, CreateCampaignMutationVariables>;
export const AddLeadsToCampaignDocument = gql`
    mutation AddLeadsToCampaign($campaignId: String!, $leads: [LeadInput!]!) {
  addLeadsToCampaign(campaignId: $campaignId, leads: $leads) {
    userError {
      message
    }
    data {
      id
      name
      leads_count
    }
  }
}
    `;
export type AddLeadsToCampaignMutationFn = Apollo.MutationFunction<AddLeadsToCampaignMutation, AddLeadsToCampaignMutationVariables>;

/**
 * __useAddLeadsToCampaignMutation__
 *
 * To run a mutation, you first call `useAddLeadsToCampaignMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddLeadsToCampaignMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addLeadsToCampaignMutation, { data, loading, error }] = useAddLeadsToCampaignMutation({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *      leads: // value for 'leads'
 *   },
 * });
 */
export function useAddLeadsToCampaignMutation(baseOptions?: Apollo.MutationHookOptions<AddLeadsToCampaignMutation, AddLeadsToCampaignMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddLeadsToCampaignMutation, AddLeadsToCampaignMutationVariables>(AddLeadsToCampaignDocument, options);
      }
export type AddLeadsToCampaignMutationHookResult = ReturnType<typeof useAddLeadsToCampaignMutation>;
export type AddLeadsToCampaignMutationResult = Apollo.MutationResult<AddLeadsToCampaignMutation>;
export type AddLeadsToCampaignMutationOptions = Apollo.BaseMutationOptions<AddLeadsToCampaignMutation, AddLeadsToCampaignMutationVariables>;
export const EnqueueCampaignJobDocument = gql`
    mutation EnqueueCampaignJob($campaignId: String!, $pacingPerSecond: Int = 1) {
  enqueueCampaignJob(campaignId: $campaignId, pacingPerSecond: $pacingPerSecond) {
    userError {
      message
    }
    success
  }
}
    `;
export type EnqueueCampaignJobMutationFn = Apollo.MutationFunction<EnqueueCampaignJobMutation, EnqueueCampaignJobMutationVariables>;

/**
 * __useEnqueueCampaignJobMutation__
 *
 * To run a mutation, you first call `useEnqueueCampaignJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnqueueCampaignJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enqueueCampaignJobMutation, { data, loading, error }] = useEnqueueCampaignJobMutation({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *      pacingPerSecond: // value for 'pacingPerSecond'
 *   },
 * });
 */
export function useEnqueueCampaignJobMutation(baseOptions?: Apollo.MutationHookOptions<EnqueueCampaignJobMutation, EnqueueCampaignJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EnqueueCampaignJobMutation, EnqueueCampaignJobMutationVariables>(EnqueueCampaignJobDocument, options);
      }
export type EnqueueCampaignJobMutationHookResult = ReturnType<typeof useEnqueueCampaignJobMutation>;
export type EnqueueCampaignJobMutationResult = Apollo.MutationResult<EnqueueCampaignJobMutation>;
export type EnqueueCampaignJobMutationOptions = Apollo.BaseMutationOptions<EnqueueCampaignJobMutation, EnqueueCampaignJobMutationVariables>;
export const StopCampaignJobDocument = gql`
    mutation StopCampaignJob($campaignId: String!) {
  stopCampaignJob(campaignId: $campaignId) {
    userError {
      message
    }
    success
  }
}
    `;
export type StopCampaignJobMutationFn = Apollo.MutationFunction<StopCampaignJobMutation, StopCampaignJobMutationVariables>;

/**
 * __useStopCampaignJobMutation__
 *
 * To run a mutation, you first call `useStopCampaignJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStopCampaignJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [stopCampaignJobMutation, { data, loading, error }] = useStopCampaignJobMutation({
 *   variables: {
 *      campaignId: // value for 'campaignId'
 *   },
 * });
 */
export function useStopCampaignJobMutation(baseOptions?: Apollo.MutationHookOptions<StopCampaignJobMutation, StopCampaignJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<StopCampaignJobMutation, StopCampaignJobMutationVariables>(StopCampaignJobDocument, options);
      }
export type StopCampaignJobMutationHookResult = ReturnType<typeof useStopCampaignJobMutation>;
export type StopCampaignJobMutationResult = Apollo.MutationResult<StopCampaignJobMutation>;
export type StopCampaignJobMutationOptions = Apollo.BaseMutationOptions<StopCampaignJobMutation, StopCampaignJobMutationVariables>;
export const GetMultipleAvailablePhoneIdsDocument = gql`
    query GetMultipleAvailablePhoneIds($count: Int!) {
  getMultipleAvailablePhoneIds(count: $count)
}
    `;

/**
 * __useGetMultipleAvailablePhoneIdsQuery__
 *
 * To run a query within a React component, call `useGetMultipleAvailablePhoneIdsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMultipleAvailablePhoneIdsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMultipleAvailablePhoneIdsQuery({
 *   variables: {
 *      count: // value for 'count'
 *   },
 * });
 */
export function useGetMultipleAvailablePhoneIdsQuery(baseOptions: Apollo.QueryHookOptions<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables> & ({ variables: GetMultipleAvailablePhoneIdsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>(GetMultipleAvailablePhoneIdsDocument, options);
      }
export function useGetMultipleAvailablePhoneIdsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>(GetMultipleAvailablePhoneIdsDocument, options);
        }
export function useGetMultipleAvailablePhoneIdsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>(GetMultipleAvailablePhoneIdsDocument, options);
        }
export type GetMultipleAvailablePhoneIdsQueryHookResult = ReturnType<typeof useGetMultipleAvailablePhoneIdsQuery>;
export type GetMultipleAvailablePhoneIdsLazyQueryHookResult = ReturnType<typeof useGetMultipleAvailablePhoneIdsLazyQuery>;
export type GetMultipleAvailablePhoneIdsSuspenseQueryHookResult = ReturnType<typeof useGetMultipleAvailablePhoneIdsSuspenseQuery>;
export type GetMultipleAvailablePhoneIdsQueryResult = Apollo.QueryResult<GetMultipleAvailablePhoneIdsQuery, GetMultipleAvailablePhoneIdsQueryVariables>;