// Texto da política de privacidade, em linguagem simples.
// Ao alterar o conteúdo, atualizar VERSAO_TERMOS em textosLegais.js.
// Pontos a validar com a psicóloga estão marcados com "VALIDAR".

export const SECOES_POLITICA = [
  {
    titulo: 'Quem cuida dos seus dados',
    paragrafos: [
      'Os dados deste aplicativo são tratados pela psicóloga Bruna Sartori Caetano (CRP 06/106.364), responsável pelo seu acompanhamento.',
      // VALIDAR: canal oficial de contato para assuntos de privacidade.
      'Para qualquer dúvida ou pedido sobre seus dados, fale diretamente com ela pelos canais de atendimento que você já usa.',
    ],
  },
  {
    titulo: 'Quais dados guardamos',
    itens: [
      'Cadastro: nome, e-mail e, se você informou, WhatsApp.',
      'O que você registra: humor, emoções, situações, ansiedade, sono, energia, movimento, acontecimentos, reflexões semanais e registros de pensamento.',
      'Registros da psicóloga: ficha, histórico, anotações clínicas e medicações. Só ela tem acesso a esses registros.',
      'Seus aceites: a data e a hora em que você aceitou os termos e o uso de dados de saúde.',
    ],
  },
  {
    titulo: 'Para que usamos',
    paragrafos: [
      'Exclusivamente para apoiar o seu acompanhamento psicológico: organizar o que você registra entre as sessões e ajudar a psicóloga a preparar os encontros.',
      'São dados de saúde, considerados sensíveis pela Lei Geral de Proteção de Dados (LGPD). Por isso, só são usados com o seu consentimento específico e, no caso dos registros da psicóloga, também para cumprir as normas da profissão.',
    ],
  },
  {
    titulo: 'O que nunca fazemos',
    itens: [
      'Não vendemos nem compartilhamos seus dados com empresas, anunciantes ou outras pessoas.',
      'Não usamos seus dados para publicidade.',
      'Não fazemos diagnósticos automáticos. Os resumos do aplicativo só descrevem o que você registrou; quem interpreta é a sua psicóloga, junto com você.',
    ],
  },
  {
    titulo: 'Quem tem acesso',
    paragrafos: [
      'Só você e a sua psicóloga. Os dados ficam guardados em servidores no Brasil (São Paulo), com regras de segurança que impedem que um usuário veja os dados de outro.',
      'As empresas que fornecem a hospedagem atuam apenas como prestadoras de serviço técnico e não usam seus dados para nenhum outro fim.',
    ],
  },
  {
    titulo: 'Sigilo profissional',
    paragrafos: [
      'Além da LGPD, tudo o que você registra está protegido pelo sigilo profissional da Psicologia, previsto no Código de Ética Profissional do Psicólogo.',
    ],
  },
  {
    titulo: 'Por quanto tempo guardamos',
    paragrafos: [
      // VALIDAR: prazo de retenção definido com a psicóloga (e aplicado automaticamente no banco).
      'Seus registros ficam guardados enquanto durar o acompanhamento. Depois, os registros profissionais da psicóloga são mantidos pelo prazo mínimo exigido pelo Conselho Federal de Psicologia e, então, excluídos.',
    ],
  },
  {
    titulo: 'Seus direitos',
    paragrafos: ['Na página “Meus dados”, dentro do aplicativo, você pode a qualquer momento:'],
    itens: [
      'Baixar uma cópia de tudo o que você registrou.',
      'Corrigir seus registros, editando qualquer dia.',
      'Apagar os registros que você fez.',
      'Revogar o consentimento para o uso de dados de saúde. A partir daí, nenhum novo registro é feito.',
      'Pedir o encerramento da sua conta.',
    ],
  },
  {
    titulo: 'Segurança',
    paragrafos: [
      'A conexão com o aplicativo é criptografada, o acesso é feito com a sua senha e cada pessoa só enxerga o que lhe diz respeito.',
    ],
  },
  {
    titulo: 'Este aplicativo não é um canal de emergência',
    paragrafos: [
      'Os registros não são acompanhados em tempo real. Em uma situação de crise, ligue para o CVV (188, 24 horas) ou para o SAMU (192).',
    ],
  },
]
