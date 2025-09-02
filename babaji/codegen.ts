import { CodegenConfig } from "@graphql-codegen/cli";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.VITE_GRAPHQL_URL as string;
const secret = process.env.VITE_HASURA_GRAPHQL_ADMIN_SECRET as string;
console.log("URL: ", url);
console.log("Secret: ", secret);

const config: CodegenConfig = {
    schema: [
        {
            [url]: {
                headers: {
                    "x-hasura-admin-secret": secret,
                },
            },
        },
    ],
    documents: ["**/*/queries.ts"],
    generates: {
        "./types/gql/": {
            preset: "client",
            plugins: [],
            config: {
                namingConvention: "keep",
                gqlTagName: "gql",
            },
        },
    },
    ignoreNoDocuments: true,
};

export default config;