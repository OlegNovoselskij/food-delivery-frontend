import type { components } from "./schema";

type Schemas = components["schemas"];

export type User = Schemas["UserOut"];
export type Token = Schemas["Token"];
export type UserUpdate = Schemas["UserUpdate"];
export type LoginRequest = Schemas["LoginRequest"];
export type RegisterRequest = Schemas["RegisterRequest"];
export type VerifyRegistrationRequest = Schemas["VerifyRegistrationRequest"];
export type ResetPasswordRequest = Schemas["ResetPasswordRequest"];
export type GoogleLoginRequest = Schemas["GoogleLoginRequest"];
