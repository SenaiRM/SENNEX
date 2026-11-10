export const EMAIL_REGEX = /\S+@\S+\.\S+/;
export const REQUIRED_MSG = 'Preencha todos os campos obrigatórios';
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MIN_LENGTH_MSG = `A senha deve conter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
export const PASSWORD_MISMATCH_MSG = 'As senhas não coincidem';

export function validateEmail(email: string): string | undefined {
  if (!email) return REQUIRED_MSG;
  if (!EMAIL_REGEX.test(email)) return 'E-mail inválido';
  return undefined;
}

export function validateRequired(value: string): string | undefined {
  return value ? undefined : REQUIRED_MSG;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return REQUIRED_MSG;
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_MIN_LENGTH_MSG;
  return undefined;
}

export function validatePasswordsMatch(password: string, confirmPassword: string): string | undefined {
  return password === confirmPassword ? undefined : PASSWORD_MISMATCH_MSG;
}
