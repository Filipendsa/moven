import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShieldCheck, HeartHandshake, Compass, Users } from "lucide-react";

export default function HomePage() {
  const whatsappCommunityUrl =
    "https://wa.me/5511972246881?text=Ol%C3%A1%20Henrique!%20Quero%20fazer%20parte%20da%20comunidade%20MOVEN%20e%20tirar%20d%C3%BAvidas.";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navegação Fixa com Blur */}
      <nav className="sticky top-0 z-30 bg-[#072119]/95 backdrop-blur-md border-b border-[#8fa66a]/20">
        <div className="max-w-5xl mx-auto px-5 min-h-[58px] flex items-center justify-between overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="text-[#e9e1d0] font-heading font-bold text-lg tracking-wider flex items-center gap-2"
          >
            <span className="text-[#8fa66a]">MOVEN</span>
            <span className="text-xs text-[#8fa66a]/80 font-normal hidden sm:inline">
              · Núcleo de Missões
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-heading font-medium">
            <Link
              href="#sobre"
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="#escola"
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              Escola
            </Link>
            <Link
              href="#datas"
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              Datas
            </Link>
            <Link
              href="#valores"
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              Valores
            </Link>
            <Link
              href="#amazonas"
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              Missão Amazonas
            </Link>
            <Link
              href="/inscricao"
              className="bg-[#8fa66a] text-[#072119] px-4 py-1.5 rounded-full font-semibold hover:bg-[#e9e1d0] transition-colors text-xs uppercase tracking-wide"
            >
              Inscrição
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-[#072119] text-[#e9e1d0] pt-12 pb-16 text-center border-b border-[#8fa66a]/20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="relative w-full max-w-[500px] h-48 mx-auto mb-4">
            <Image
              src="/images/moven-logo.jpg"
              alt="MOVEN, Núcleo de Missões, Igreja UNASP-HT"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight max-w-2xl mx-auto mb-4 leading-tight">
            Movidos pelo amor. Enviados para servir.
          </h1>

          <p className="text-base sm:text-lg text-[#d5cfbf] max-w-xl mx-auto mb-8">
            Faça parte da primeira turma da Escola de Missões e viaje com a
            gente para a Missão Amazonas, em julho de 2027.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              href="/inscricao?modalidade=ESCOLA"
              className="inline-block bg-[#8fa66a] text-[#072119] font-heading font-semibold px-7 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#e9e1d0] hover:border-[#e9e1d0] transition-colors shadow-lg"
            >
              Inscrever na Escola de Missões
            </Link>
            <Link
              href="/inscricao?modalidade=MISSAO"
              className="inline-block text-[#e9e1d0] font-heading font-semibold px-7 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#8fa66a] hover:text-[#072119] transition-colors"
            >
              Inscrever na Missão Amazonas
            </Link>
            <a
              href={whatsappCommunityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#8fa66a] font-heading font-semibold px-6 py-3.5 rounded-full border-2 border-[#8fa66a]/40 hover:border-[#8fa66a] hover:bg-[#8fa66a]/10 transition-colors"
            >
              <Users className="w-5 h-5" />
              Entrar na Comunidade
            </a>
          </div>

          {/* Fatos em Destaque */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#e9e1d0]/20 rounded-2xl overflow-hidden border border-[#e9e1d0]/20 text-left">
            <div className="bg-[#072119] p-4 sm:p-5">
              <b className="block text-xl sm:text-2xl font-heading text-[#8fa66a]">
                29/11/2026
              </b>
              <span className="text-xs sm:text-sm text-[#cfc9b8]">
                Aula inaugural, às 16h
              </span>
            </div>
            <div className="bg-[#072119] p-4 sm:p-5">
              <b className="block text-xl sm:text-2xl font-heading text-[#8fa66a]">
                8 encontros
              </b>
              <span className="text-xs sm:text-sm text-[#cfc9b8]">
                Quinzenais, aos domingos
              </span>
            </div>
            <div className="bg-[#072119] p-4 sm:p-5">
              <b className="block text-xl sm:text-2xl font-heading text-[#8fa66a]">
                19 a 29/07/2027
              </b>
              <span className="text-xs sm:text-sm text-[#cfc9b8]">
                Missão Amazonas
              </span>
            </div>
            <div className="bg-[#072119] p-4 sm:p-5">
              <b className="block text-xl sm:text-2xl font-heading text-[#8fa66a]">
                28 vagas
              </b>
              <span className="text-xs sm:text-sm text-[#cfc9b8]">
                Para a missão de barco
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Seção 1: O que é o MOVEN */}
      <section id="sobre" className="py-16">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-[var(--ink)]">
              O que é o MOVEN
            </h2>
            <p className="mb-4">
              MOVEN é o Núcleo de Missões da Igreja UNASP-HT. O nome é uma
              palavra criada para expressar movimento, propósito e missão.
            </p>
            <p className="mb-4">
              O número 7 aparece de forma sutil na logo. Ele representa o sétimo
              dia, nossa identidade adventista, e nos lembra de que o Deus que
              nos convida a descansar em Seu amor também nos chama a
              compartilhá-lo com o mundo.
            </p>
            <p className="mb-4">
              Seguimos o modelo do Serviço Voluntário Adventista (SVA) e somos um
              braço da igreja. Nossos objetivos:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--ink)]">
              <li>
                Estabelecer o núcleo de missões de forma permanente na igreja.
              </li>
              <li>
                Capacitar pessoas a fazer discípulos por meio do serviço, onde
                estiverem.
              </li>
              <li>Capacitar pessoas a contagiar e treinar outras para a missão.</li>
            </ul>
          </div>
          <div className="md:col-span-5 bg-[var(--card)] p-6 rounded-2xl border border-[var(--terra)]/20">
            <h3 className="text-xl font-semibold mb-4 text-[var(--ink)] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[var(--terra)]" />
              Base bíblica
            </h3>
            <div className="border-l-4 border-[var(--terra)] pl-4 mb-4">
              <b className="block font-heading text-[var(--ink)]">
                2 Coríntios 5:14
              </b>
              <span className="text-sm text-[var(--mut)]">
                O amor de Cristo nos impulsiona.
              </span>
            </div>
            <div className="border-l-4 border-[var(--terra)] pl-4 mb-4">
              <b className="block font-heading text-[var(--ink)]">
                João 13:34-35
              </b>
              <span className="text-sm text-[var(--mut)]">
                O amor é a marca dos discípulos de Jesus.
              </span>
            </div>
            <div className="border-l-4 border-[var(--terra)] pl-4">
              <b className="block font-heading text-[var(--ink)]">
                Mateus 28:19
              </b>
              <span className="text-sm text-[var(--mut)]">
                Somos chamados a ir e fazer discípulos.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: Escola de Missões */}
      <section id="escola" className="py-16 bg-[var(--card)]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3 text-[var(--ink)]">
            Escola de Missões
          </h2>
          <p className="max-w-2xl mb-8 text-[var(--ink)]/90">
            De novembro a junho, você aprende a servir na prática: cada encontro
            tem 30 minutos de prática missionária e dois blocos de teoria e
            prática.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--ink)]">
                Como funciona
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-[var(--ink)]">
                <li>
                  8 encontros quinzenais, aos domingos, das 16h às 18h30
                </li>
                <li>Retiro, visita de choque cultural e formatura</li>
                <li>
                  7 ações voluntárias em grupo nos domingos sem aula
                </li>
                <li>
                  Estudo bíblico, Pequeno Grupo e atividades missionárias
                  pessoais
                </li>
                <li>
                  Curso online Passaporte para a Missão (SVA) e leitura do
                  livro Passaporte
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--ink)]">
                O que você vai estudar
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Estudo bíblico por descoberta",
                  "Chamado missionário",
                  "Evangelismo",
                  "Cultura e contextualização",
                  "Saúde mental",
                  "Primeiros socorros",
                  "Doutrinas da igreja",
                  "Realidade ribeirinha",
                  "Vida no barco",
                  "Oficinas: crianças, saúde, construção e música",
                ].map((item, idx) => (
                  <span
                    key={idx}
                    className="border border-[#8fa66a] text-[var(--ink)] rounded-full px-3.5 py-1 text-xs sm:text-sm bg-[#8fa66a]/10"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-[var(--ink)]">
            Critérios para Certificação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border-t-4 border-[var(--terra)] pt-3 bg-white/40 dark:bg-black/20 p-4 rounded-b-xl">
              <b className="block text-3xl font-heading text-[var(--ink)]">
                70%
              </b>
              <span className="text-sm text-[var(--mut)]">da nota total</span>
            </div>
            <div className="border-t-4 border-[var(--terra)] pt-3 bg-white/40 dark:bg-black/20 p-4 rounded-b-xl">
              <b className="block text-3xl font-heading text-[var(--ink)]">
                80%
              </b>
              <span className="text-sm text-[var(--mut)]">
                de presença nas aulas e atividades
              </span>
            </div>
            <div className="border-t-4 border-[var(--terra)] pt-3 bg-white/40 dark:bg-black/20 p-4 rounded-b-xl">
              <b className="block text-3xl font-heading text-[var(--ink)]">
                SVA
              </b>
              <span className="text-sm text-[var(--mut)]">
                curso online Passaporte para a Missão concluído
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: Datas Importantes */}
      <section id="datas" className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-[var(--ink)]">
            Datas importantes
          </h2>
          <p className="text-[var(--mut)] mb-8">
            Do lançamento ao culto de retorno, em nove meses.
          </p>

          <ol className="relative border-l-2 border-[#8fa66a] ml-3 sm:ml-4 space-y-6">
            {[
              {
                date: "14/11/2026",
                title: "Lançamento no culto de sábado",
                desc: "Inscrições abertas na saída do culto",
                highlight: true,
              },
              {
                date: "29/11/2026",
                title: "Aula inaugural, às 16h",
                desc: "Encontro 1",
                highlight: true,
              },
              {
                date: "13/12/2026",
                title: "Encontro 2",
              },
              {
                date: "14/12 a 16/01",
                title: "Pausa de fim de ano",
                desc: "Curso online SVA, leitura do livro e ação de Natal (20/12)",
              },
              {
                date: "17/01 a 04/04/2027",
                title: "Encontros 3 a 8",
                desc: "17/01, 31/01, 14/02, 28/02, 14/03 e 04/04",
              },
              {
                date: "30/04 a 02/05",
                title: "Retiro de comunhão e consagração",
              },
              {
                date: "16/05/2027",
                title: "Visita de choque cultural",
                desc: "Mesquita e comunidade árabe",
              },
              {
                date: "12/06/2027",
                title: "Formatura e culto de envio",
                highlight: true,
              },
              {
                date: "19 a 29/07/2027",
                title: "Missão Amazonas",
                desc: "10 dias de serviço de barco pelas comunidades ribeirinhas",
                highlight: true,
              },
              {
                date: "07/08/2027",
                title: "Culto de retorno",
                desc: "Relatório, fotos e testemunhos",
              },
            ].map((item, idx) => (
              <li key={idx} className="relative pl-6 sm:pl-8">
                <span
                  className={`absolute -left-[7px] top-1.5 rounded-full ${
                    item.highlight
                      ? "w-4 h-4 bg-[#8fa66a] -left-[9px] border-2 border-[var(--bg)]"
                      : "w-3 h-3 bg-[var(--bg)] border-2 border-[#8fa66a]"
                  }`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <span className="sm:col-span-3 font-heading font-semibold text-[var(--terra)] text-sm sm:text-base">
                    {item.date}
                  </span>
                  <div className="sm:col-span-9">
                    <span
                      className={`block text-[var(--ink)] ${
                        item.highlight ? "font-bold text-lg" : "font-medium"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.desc && (
                      <small className="block text-[var(--mut)] text-xs sm:text-sm">
                        {item.desc}
                      </small>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Seção 4: Valores e Inscrição */}
      <section id="valores" className="py-16 bg-[#072119] text-[#e9e1d0]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-2">Valores</h2>
          <p className="text-[#d5cfbf] mb-8">
            A escola e a missão são cobradas separadamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card Escola */}
            <div className="bg-[#12302a] border border-[#8fa66a]/30 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8fa66a] font-semibold">
                  Módulo 1
                </span>
                <h3 className="text-2xl font-bold mt-1 mb-2">
                  Escola de Missões
                </h3>
                <div className="text-4xl font-heading font-bold text-[#e9e1d0] my-3">
                  R$ 168,42{" "}
                  <small className="text-sm font-normal text-[#cfc9b8]">
                    valor único
                  </small>
                </div>
                <p className="text-sm text-[#cfc9b8] mb-4">
                  Sem mensalidade. Inclui a pasta do aluno:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#d5cfbf] mb-6">
                  <li>Livro Passaporte</li>
                  <li>Camiseta e squeeze</li>
                  <li>Caderno, lápis e caneta</li>
                </ul>
              </div>
              <Link
                href="/inscricao?modalidade=ESCOLA"
                className="w-full text-center bg-[#8fa66a] text-[#072119] font-heading font-semibold py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors"
              >
                Inscrever na Escola
              </Link>
            </div>

            {/* Card Missão */}
            <div className="bg-[#12302a] border border-[#8fa66a]/30 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8fa66a] font-semibold">
                  Módulo 2
                </span>
                <h3 className="text-2xl font-bold mt-1 mb-2">
                  Missão Amazonas
                </h3>
                <div className="text-4xl font-heading font-bold text-[#e9e1d0] my-3">
                  R$ 2.463,16{" "}
                  <small className="text-sm font-normal text-[#cfc9b8]">
                    por pessoa
                  </small>
                </div>
                <p className="text-sm text-[#cfc9b8] mb-4">
                  Parcele em até 7x. Vagas limitadas (28 vagas):
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#d5cfbf] mb-6">
                  <li>Traslado do aeroporto até o Instituto</li>
                  <li>Kit: sacochila, camisa, chapéu e garrafinha</li>
                  <li>Três refeições ovolactovegetarianas por dia</li>
                  <li>Passagem aérea São Paulo–Manaus não inclusa</li>
                </ul>
              </div>
              <Link
                href="/inscricao?modalidade=MISSAO"
                className="w-full text-center bg-[#8fa66a] text-[#072119] font-heading font-semibold py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors"
              >
                Inscrever na Missão
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 5: Missão Amazonas 2027 Detalhes */}
      <section id="amazonas" className="py-16">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-[var(--ink)]">
              Missão Amazonas 2027
            </h2>
            <p className="mb-4">
              Em parceria com a Missão Noroeste, vamos passar 10 dias de barco
              pelos rios do Amazonas, no formato do projeto Salva-Vidas
              Amazônia. Serão ações de construção, evangelismo, saúde básica e
              apoio na cozinha, junto às comunidades ribeirinhas.
            </p>
            <p>
              Os voluntários dormem em redes, com mosquiteiro fornecido. Quem vai
              à missão precisa ser certificado pela escola e ter concluído o
              curso online do SVA.
            </p>
          </div>
          <div className="md:col-span-5 bg-[var(--card)] p-6 rounded-2xl border border-[var(--terra)]/20">
            <h3 className="text-xl font-semibold mb-4 text-[var(--ink)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--terra)]" />
              Antes de viajar
            </h3>
            <ul className="list-disc pl-5 space-y-3 text-sm text-[var(--ink)]">
              <li>Cadastro no SVA / VividFaith, com documentos</li>
              <li>Passagem São Paulo–Manaus, comprada individualmente</li>
              <li>Vacinas em dia, incluindo febre amarela</li>
              <li>
                Menores de 16 anos vão com os responsáveis. De 16 a 17 anos, com
                termo assinado pelos pais.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Seção 6: CTA Central de Inscrição */}
      <section id="inscricao" className="py-16 bg-[#072119] text-center text-[#e9e1d0]">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3">
            Inscreva-se Agora
          </h2>
          <p className="text-[#d5cfbf] mb-8">
            Escolha o que combina com você. Quem vai à missão pode se inscrever
            nos dois juntos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/inscricao?modalidade=ESCOLA"
              className="bg-[#8fa66a] text-[#072119] font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors shadow-lg"
            >
              Escola de Missões
            </Link>
            <Link
              href="/inscricao?modalidade=MISSAO"
              className="text-[#e9e1d0] font-heading font-semibold px-8 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#8fa66a] hover:text-[#072119] transition-colors"
            >
              Missão Amazonas
            </Link>
            <Link
              href="/inscricao?modalidade=AMBOS"
              className="bg-[var(--terra)] text-[#e9e1d0] font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-[var(--terra)]/80 transition-colors shadow-lg"
            >
              Inscrever em Ambos
            </Link>
          </div>
        </div>
      </section>

      {/* Seção WhatsApp / Contato */}
      <section className="py-16 bg-[#8fa66a] text-[#072119] text-center">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3">
            Ficou com dúvida ou quer entrar na comunidade?
          </h2>
          <p className="text-[#072119]/90 mb-8 max-w-xl mx-auto">
            Fale diretamente com o Henrique pelo WhatsApp ou tire dúvidas sobre a
            primeira turma da Escola de Missões.
          </p>
          <a
            href="https://wa.me/5511972246881?text=Ol%C3%A1%20Henrique!%20Quero%20saber%20mais%20sobre%20o%20MOVEN."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-semibold px-8 py-4 rounded-full hover:bg-[var(--terra)] transition-colors shadow-lg text-lg"
          >
            <MessageCircle className="w-6 h-6 text-[#8fa66a]" />
            +55 11 97224-6881
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#072119] text-[#cfc9b8] py-8 border-t border-[#8fa66a]/20 text-center text-sm">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-[#e9e1d0]">
              MOVEN · Núcleo de Missões · Igreja UNASP-HT
            </div>
            <div className="text-xs text-[#cfc9b8]/80">
              Mais que um núcleo, um movimento.
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/privacidade"
              className="hover:text-[#8fa66a] transition-colors"
            >
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link
              href="/termos"
              className="hover:text-[#8fa66a] transition-colors"
            >
              Termos de Uso
            </Link>
            <span>•</span>
            <Link
              href="/admin/login"
              className="hover:text-[#8fa66a] transition-colors opacity-60 hover:opacity-100"
            >
              Painel Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
