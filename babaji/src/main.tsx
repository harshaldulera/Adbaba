import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { createHttpLink } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';

import StyleThemeProvider from './themesystem.tsx';

function makeClient() {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI,
    headers: {
      "X-Hasura-Admin-Secret": import.meta.env.VITE_HASURA_ADMIN_SECRET,
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "network-only",
      },
      mutate: {
        fetchPolicy: "network-only",
      },
      query: {
        fetchPolicy: "network-only",
      },
    },
  });
}

const client = makeClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StyleThemeProvider>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StyleThemeProvider>
)