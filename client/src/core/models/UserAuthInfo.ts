export interface AuthInfo {
  token: string;
}

export interface UserAuthInfo extends AuthInfo {
  userId: string;
  fullName: FullName;
  userName: string;
  roles: string[];
  language: LanguageId
  prevUrl?: string;
}

export interface FullName {
  first: string;
  last: string;
}

export interface LoginInfo {
  email: string;
  secret: string;
}

export interface NewUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phone: string;
  gdpr: boolean;
  language: LanguageId
}

export interface PasswordForgot {
  email: string;
}

export interface PasswordReset {
  key: string;
  password: string;
  password_confirm: string;
}

export interface PasswordKey {
  key: string;
}

export type LanguageId = 'en' | 'ru';
