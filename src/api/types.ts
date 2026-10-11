import type { components } from "./schema";

type Schemas = components["schemas"];

export type User = Schemas["UserOut"];
