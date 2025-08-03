// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:4000/graphql", // Change to your backend endpoint
    // credentials: "include", // Only if using cookies for auth
  }),
  cache: new InMemoryCache(),
});

export default client;
