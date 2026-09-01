const PipelineEtl = require("../src/pipelineEtl");

const criarJobBase = () => ({
  id: "1",
  nome: "carga_vendas_diaria",
  status: "pendente",
  linhasProcessadas: 0,
  linhasComErro: 0,
  tentativas: 0,
  maxTentativas: 3,
  limiteErroPercentual: 5,
  iniciadoEm: null,
  finalizadoEm: null,
  mensagemErro: null,
});

describe("pipeline etl", () => {
  test("deve retornar dados basicos do job", () =>   {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const nome = pipeline.obterNome();
    const status = pipeline.obterStatus();
    const linhas = pipeline.obterLinhasProcessadas();
    const tentativas = pipeline.obterTentativas();

    // Assert
    expect(nome).toBe("carga_vendas_diaria");
    expect(status).toBe("pendente");
    expect(linhas).toBe(0);
    expect(tentativas).toBe(0);
  });

  test("deve identificar corretamente cada estado do job", () => {
    // Arrange
    const pendente = new PipelineEtl(criarJobBase());
    const rodando = new PipelineEtl({ ...criarJobBase(), status: "rodando" });
    const concluido = new PipelineEtl({ ...criarJobBase(), status: "concluido" });
    const comFalha = new PipelineEtl({ ...criarJobBase(), status: "falhou" });

    // Act & Assert
    expect(pendente.estaPendente()).toBe(true);
    expect(pendente.estaRodando()).toBe(false);
    expect(rodando.estaRodando()).toBe(true);
    expect(concluido.estaConcluido()).toBe(true);
    expect(comFalha.falhou()).toBe(true);
    expect(concluido.falhou()).toBe(false);
  });

  test("deve avaliar tentativas e permissao de execucao", () => {
    // Arrange
    const novo = new PipelineEtl(criarJobBase());
    const esgotado = new PipelineEtl({ ...criarJobBase(), tentativas: 3 });
    const rodando = new PipelineEtl({ ...criarJobBase(), status: "rodando" });

    // Act & Assert
    expect(novo.excedeuTentativas()).toBe(false);
    expect(novo.podeExecutar()).toBe(true);
    expect(esgotado.excedeuTentativas()).toBe(true);
    expect(esgotado.podeExecutar()).toBe(false);
    expect(rodando.podeExecutar()).toBe(false);
  });

  test("deve iniciar o job e incrementar tentativas", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const primeiroInicio = pipeline.iniciar();
    const inicioDuplicado = pipeline.iniciar();

    // Assert
    expect(primeiroInicio).toBe(true);
    expect(inicioDuplicado).toBe(false);
    expect(pipeline.obterStatus()).toBe("rodando");
    expect(pipeline.obterTentativas()).toBe(1);
  });

  test("deve registrar linhas somente com job rodando e valor valido", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const antesDeIniciar = pipeline.registrarLinhas(100);
    pipeline.iniciar();
    const valorInvalido = pipeline.registrarLinhas(0);
    const valorValido = pipeline.registrarLinhas(100);

    // Assert
    expect(antesDeIniciar).toBe(false);
    expect(valorInvalido).toBe(false);
    expect(valorValido).toBe(true);
    expect(pipeline.obterLinhasProcessadas()).toBe(100);
  });

  test("deve registrar erros somente com job rodando e valor valido", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const antesDeIniciar = pipeline.registrarErros(5);
    pipeline.iniciar();
    const valorInvalido = pipeline.registrarErros(-1);
    const valorValido = pipeline.registrarErros(5);

    // Assert
    expect(antesDeIniciar).toBe(false);
    expect(valorInvalido).toBe(false);
    expect(valorValido).toBe(true);
  });

  test("deve calcular taxa de erro e comparar com o limite", () => {
    // Arrange
    const semExecucao = new PipelineEtl(criarJobBase());
    const dentroDoLimite = new PipelineEtl({
      ...criarJobBase(),
      linhasProcessadas: 96,
      linhasComErro: 4,
    });
    const acimaDoLimite = new PipelineEtl({
      ...criarJobBase(),
      linhasProcessadas: 90,
      linhasComErro: 10,
    });

    // Act & Assert
    expect(semExecucao.calcularTaxaDeErro()).toBe(0);
    expect(dentroDoLimite.calcularTaxaDeErro()).toBe(4);
    expect(dentroDoLimite.atingiuLimiteDeErro()).toBe(false);
    expect(acimaDoLimite.calcularTaxaDeErro()).toBe(10);
    expect(acimaDoLimite.atingiuLimiteDeErro()).toBe(true);
  });

  test("deve concluir o job quando a taxa de erro esta dentro do limite", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const conclusaoSemIniciar = pipeline.concluir();
    pipeline.iniciar();
    pipeline.registrarLinhas(100);
    const conclusao = pipeline.concluir();

    // Assert
    expect(conclusaoSemIniciar).toBe(false);
    expect(conclusao).toBe(true);
    expect(pipeline.estaConcluido()).toBe(true);
  });

  test("deve falhar na conclusao quando a taxa de erro estoura o limite", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    pipeline.iniciar();
    pipeline.registrarLinhas(80);
    pipeline.registrarErros(20);
    const conclusao = pipeline.concluir();

    // Assert
    expect(conclusao).toBe(false);
    expect(pipeline.falhou()).toBe(true);
    expect(pipeline.job.mensagemErro).toBe("taxa de erro acima do limite");
  });

  test("deve marcar falha manual apenas com job rodando e mensagem valida", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());

    // Act
    const falhaSemIniciar = pipeline.marcarFalha("timeout");
    pipeline.iniciar();
    const falhaSemMensagem = pipeline.marcarFalha("");
    const falhaValida = pipeline.marcarFalha("conexao recusada");

    // Assert
    expect(falhaSemIniciar).toBe(false);
    expect(falhaSemMensagem).toBe(false);
    expect(falhaValida).toBe(true);
    expect(pipeline.obterStatus()).toBe("falhou");
    expect(pipeline.job.mensagemErro).toBe("conexao recusada");
  });

  test("deve permitir retry apenas apos falha e dentro do limite de tentativas", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());
    const esgotado = new PipelineEtl({
      ...criarJobBase(),
      status: "falhou",
      tentativas: 3,
    });

    // Act
    const retrySemFalha = pipeline.tentarNovamente();
    pipeline.iniciar();
    pipeline.marcarFalha("erro de rede");
    const retryValido = pipeline.tentarNovamente();
    const retryEsgotado = esgotado.tentarNovamente();

    // Assert
    expect(retrySemFalha).toBe(false);
    expect(retryValido).toBe(true);
    expect(pipeline.estaPendente()).toBe(true);
    expect(retryEsgotado).toBe(false);
  });

  test("deve executar o pipeline usando o extrator injetado", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());
    const extrator = { extrair: jest.fn(() => ({ linhas: 500, erros: 10 })) };

    // Act
    const sucesso = pipeline.executar(extrator);

    // Assert
    expect(extrator.extrair).toHaveBeenCalledTimes(1);
    expect(sucesso).toBe(true);
    expect(pipeline.obterLinhasProcessadas()).toBe(500);
    expect(pipeline.estaConcluido()).toBe(true);
  });

  test("nao deve executar quando o job nao pode ser iniciado", () => {
    // Arrange
    const pipeline = new PipelineEtl({ ...criarJobBase(), tentativas: 3 });
    const extrator = { extrair: jest.fn() };

    // Act
    const sucesso = pipeline.executar(extrator);

    // Assert
    expect(sucesso).toBe(false);
    expect(extrator.extrair).not.toHaveBeenCalled();
  });

  test("deve gerar resumo do job", () => {
    // Arrange
    const pipeline = new PipelineEtl(criarJobBase());
    const extrator = { extrair: () => ({ linhas: 190, erros: 10 }) };

    // Act
    pipeline.executar(extrator);
    const resumo = pipeline.gerarResumo();

    // Assert
    expect(resumo).toEqual({
      nome: "carga_vendas_diaria",
      status: "concluido",
      linhasProcessadas: 190,
      linhasComErro: 10,
      taxaDeErro: 5,
      tentativas: 1,
    });
  });
});
