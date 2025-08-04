// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT, // Change to your backend endpoint
    // credentials: "include", // Only if using cookies for auth
  }),
  cache: new InMemoryCache(),
});

export default client;
