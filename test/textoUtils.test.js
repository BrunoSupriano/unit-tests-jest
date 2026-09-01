const TextoUtils = require("../src/textoUtils");

describe("texto utils", () => {
  test("deve inverter a ordem dos caracteres da string", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const invertida = util.inverter("abc");

    // Assert
    expect(invertida).toBe("cba");
  });

  test("deve identificar palíndromos ignorando espaços e pontuação", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const ehPalindromo = util.ehPalindromo("Ame a ema");
    const naoEhPalindromo = util.ehPalindromo("javascript");

    // Assert
    expect(ehPalindromo).toBe(true);
    expect(naoEhPalindromo).toBe(false);
  });

  test("deve capitalizar cada palavra e preservar espaços duplicados", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const capitalizado = util.capitalizar("olá  MUNDO");

    // Assert
    expect(capitalizado).toBe("Olá  Mundo");
  });

  test("deve contar ocorrências de uma substring", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const ocorrencias = util.contarOcorrencias("banana", "na");
    const substringVazia = util.contarOcorrencias("banana", "");

    // Assert
    expect(ocorrencias).toBe(2);
    expect(substringVazia).toBe(0);
  });

  test("deve remover espaços em branco extras", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const semEspacos = util.removerEspacosExtras("  olá   mundo  ");

    // Assert
    expect(semEspacos).toBe("olá mundo");
  });

  test("deve converter texto acentuado em slug", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const slug = util.paraSlug("Olá Mundo!");

    // Assert
    expect(slug).toBe("ola-mundo");
  });

  test("deve truncar o texto adicionando reticências quando excede o tamanho", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const truncado = util.truncar("texto longo", 5);
    const semTruncar = util.truncar("curto", 10);

    // Assert
    expect(truncado).toBe("texto...");
    expect(semTruncar).toBe("curto");
  });

  test("deve lançar erro ao truncar com tamanho negativo", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const acaoInvalida = () => util.truncar("texto", -1);

    // Assert
    expect(acaoInvalida).toThrow("O tamanho não pode ser negativo");
  });

  test("deve contar o número de palavras ignorando espaços extras", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const palavras = util.contarPalavras("  um   dois três ");

    // Assert
    expect(palavras).toBe(3);
  });

  test("deve validar se o texto contém somente letras", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const apenasLetras = util.somenteLetras("Café");
    const comNumeros = util.somenteLetras("abc123");

    // Assert
    expect(apenasLetras).toBe(true);
    expect(comNumeros).toBe(false);
  });

  test("deve substituir todas as ocorrências de uma substring", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const substituido = util.substituirTudo("a-b-c", "-", "_");

    // Assert
    expect(substituido).toBe("a_b_c");
  });

  test("deve lançar erro ao substituir com alvo vazio", () => {
    // Arrange
    const util = new TextoUtils();

    // Act
    const acaoInvalida = () => util.substituirTudo("texto", "", "x");

    // Assert
    expect(acaoInvalida).toThrow("O alvo não pode ser vazio");
  });
});
