class PipelineEtl {
  constructor(job) {
    this.job = job;
  }

  obterNome() {
    return this.job.nome;
  }

  obterStatus() {
    return this.job.status;
  }

  obterLinhasProcessadas() {
    return this.job.linhasProcessadas;
  }

  obterTentativas() {
    return this.job.tentativas;
  }

  obterMensagemErro() {
    return this.job.mensagemErro;
  }

  estaPendente() {
    return this.job.status === "pendente";
  }

  estaRodando() {
    return this.job.status === "rodando";
  }

  estaConcluido() {
    return this.job.status === "concluido";
  }

  falhou() {
    return this.job.status === "falhou";
  }

  excedeuTentativas() {
    return this.job.tentativas >= this.job.maxTentativas;
  }

  podeExecutar() {
    return this.estaPendente() && !this.excedeuTentativas();
  }

  iniciar() {
    if (!this.podeExecutar()) return false;

    this.job.status = "rodando";
    this.job.tentativas += 1;
    this.job.iniciadoEm = new Date();
    this.job.mensagemErro = null;
    return true;
  }

  registrarLinhas(quantidade) {
    if (quantidade <= 0) return false;
    if (!this.estaRodando()) return false;

    this.job.linhasProcessadas += quantidade;
    return true;
  }

  registrarErros(quantidade) {
    if (quantidade <= 0) return false;
    if (!this.estaRodando()) return false;

    this.job.linhasComErro += quantidade;
    return true;
  }

  calcularTaxaDeErro() {
    const total = this.job.linhasProcessadas + this.job.linhasComErro;
    if (total === 0) return 0;

    return Number(((this.job.linhasComErro / total) * 100).toFixed(2));
  }

  atingiuLimiteDeErro() {
    return this.calcularTaxaDeErro() > this.job.limiteErroPercentual;
  }

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

  marcarFalha(mensagem) {
    if (!this.estaRodando()) return false;
    if (!mensagem) return false;

    this.job.status = "falhou";
    this.job.mensagemErro = mensagem;
    this.job.finalizadoEm = new Date();
    return true;
  }

  tentarNovamente() {
    if (!this.falhou()) return false;
    if (this.excedeuTentativas()) return false;

    this.job.status = "pendente";
    return true;
  }

  executar(extrator) {
    if (!this.iniciar()) return false;

    const resultado = extrator.extrair();
    this.registrarLinhas(resultado.linhas);
    this.registrarErros(resultado.erros);

    return this.concluir();
  }

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
