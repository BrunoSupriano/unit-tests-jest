class PipelineEtl {
  constructor(job) {
    this.job = job;
  }

  // 1
  obterNome() {
    return this.job.nome;
  }

  // 2
  obterStatus() {
    return this.job.status;
  }

  // 3
  obterLinhasProcessadas() {
    return this.job.linhasProcessadas;
  }

  // 4
  obterTentativas() {
    return this.job.tentativas;
  }

  // 5
  estaPendente() {
    return this.job.status === "pendente";
  }

  // 6
  estaRodando() {
    return this.job.status === "rodando";
  }

  // 7
  estaConcluido() {
    return this.job.status === "concluido";
  }

  // 8
  falhou() {
    return this.job.status === "falhou";
  }

  // 9
  excedeuTentativas() {
    return this.job.tentativas >= this.job.maxTentativas;
  }

  // 10
  podeExecutar() {
    return this.estaPendente() && !this.excedeuTentativas();
  }

  // 11
  iniciar() {
    if (!this.podeExecutar()) return false;

    this.job.status = "rodando";
    this.job.tentativas += 1;
    this.job.iniciadoEm = new Date();
    this.job.mensagemErro = null;
    return true;
  }

  // 12
  registrarLinhas(quantidade) {
    if (quantidade <= 0) return false;
    if (!this.estaRodando()) return false;

    this.job.linhasProcessadas += quantidade;
    return true;
  }

  // 13
  registrarErros(quantidade) {
    if (quantidade <= 0) return false;
    if (!this.estaRodando()) return false;

    this.job.linhasComErro += quantidade;
    return true;
  }

  // 14
  calcularTaxaDeErro() {
    const total = this.job.linhasProcessadas + this.job.linhasComErro;
    if (total === 0) return 0;

    return Number(((this.job.linhasComErro / total) * 100).toFixed(2));
  }

  // 15
  atingiuLimiteDeErro() {
    return this.calcularTaxaDeErro() > this.job.limiteErroPercentual;
  }

  // 16
  concluir() {
    if (!this.estaRodando()) return false;

    this.job.finalizadoEm = new Date();

    if (this.atingiuLimiteDeErro()) {
      this.job.status = "falhou";
      this.job.mensagemErro = "taxa de erro acima do limite";
      return false;
    }

    this.job.status = "concluido";
    return true;
  }

  // 17
  marcarFalha(mensagem) {
    if (!this.estaRodando()) return false;
    if (!mensagem) return false;

    this.job.status = "falhou";
    this.job.mensagemErro = mensagem;
    this.job.finalizadoEm = new Date();
    return true;
  }

  // 18
  tentarNovamente() {
    if (!this.falhou()) return false;
    if (this.excedeuTentativas()) return false;

    this.job.status = "pendente";
    return true;
  }

  // 19
  executar(extrator) {
    if (!this.iniciar()) return false;

    const resultado = extrator.extrair();
    this.registrarLinhas(resultado.linhas);
    this.registrarErros(resultado.erros);

    return this.concluir();
  }

  // 20
  gerarResumo() {
    return {
      nome: this.job.nome,
      status: this.job.status,
      linhasProcessadas: this.job.linhasProcessadas,
      linhasComErro: this.job.linhasComErro,
      taxaDeErro: this.calcularTaxaDeErro(),
      tentativas: this.job.tentativas,
    };
  }
}

module.exports = PipelineEtl;
