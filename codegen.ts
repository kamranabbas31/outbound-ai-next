// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/graphql/schemas/*.graphql",
  documents: "./src/graphql/operations/*.graphql",
  generates: {
    "./src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        addDocBlocks: true,
        withMutationFn: true,
        withLazyQueries: true,
      },
    },
  },
};

export default config;
