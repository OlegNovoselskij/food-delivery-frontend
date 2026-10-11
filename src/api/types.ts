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
export type Category = Schemas["CategoryOut"];
export type CourseListItem = Schemas["CourseListItem"];
export type Course = Schemas["CourseOut"];
export type CoursePage = Schemas["CoursePage"];
export type Program = Schemas["ProgramOut"];
export type ProgramModule = Schemas["ModuleOut"];
export type LessonSummary = Schemas["LessonSummary"];
export type ReviewPage = Schemas["ReviewPage"];
export type Review = Schemas["ReviewOut"];
export type Enrollment = Schemas["EnrollmentOut"];
export type CertificateVerification = Schemas["CertificateVerifyOut"];
export type PayRequest = Schemas["PayRequest"];
