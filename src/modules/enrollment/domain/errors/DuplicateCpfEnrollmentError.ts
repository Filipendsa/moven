export class DuplicateCpfEnrollmentError extends Error {
  public readonly code = "DUPLICATE_CPF" as const;
  public readonly cpf: string;

  constructor(cpf: string, message?: string) {
    super(
      message ||
        `Já existe uma inscrição registrada para o CPF ${cpf}. Acesse o Painel do Inscrito para acompanhar seu status ou alterar o tamanho da camisa.`
    );
    this.name = "DuplicateCpfEnrollmentError";
    this.cpf = cpf;
    Object.setPrototypeOf(this, DuplicateCpfEnrollmentError.prototype);
  }
}
