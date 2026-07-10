import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Política de privacidade" };

/** RASCUNHO — alinhado à LGPD; revisar com advogado antes do lançamento. */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-deep">
          Rascunho para revisão jurídica · atualizado em julho de 2026
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Política de privacidade
        </h1>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink/75">
          <section>
            <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>1. Quem somos</h2>
            <p className="mt-2">
              O {BRAND.name} é uma plataforma de intermediação de viagens
              compartilhadas operada por {BRAND.legalName}, controladora dos dados
              pessoais tratados neste serviço, nos termos da LGPD (Lei 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>2. Dados que tratamos e por quê</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Cadastro</strong> (nome, e-mail, telefone, senha com hash): criar e proteger sua conta — execução de contrato.</li>
              <li><strong>Verificação de identidade</strong> (documento, CPF, selfie, CNH de motoristas): segurança da comunidade e prevenção a fraudes — execução de contrato e legítimo interesse. Processada por provedor de KYC especializado.</li>
              <li><strong>Viagens e reservas</strong> (rotas, horários, veículo, placa): operar a intermediação — execução de contrato.</li>
              <li><strong>Pagamentos</strong>: processados por instituição parceira; não armazenamos números completos de cartão.</li>
              <li><strong>Mensagens do chat</strong>: viabilizar os combinados e apurar denúncias — execução de contrato e legítimo interesse.</li>
              <li><strong>Avaliações</strong>: reputação pública da comunidade — legítimo interesse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>3. Compartilhamento</h2>
            <p className="mt-2">
              Compartilhamos dados apenas com: (i) o outro participante da viagem
              (nome, foto, avaliações e, após reserva confirmada, ponto de encontro
              e dados do veículo); (ii) quem receber o link de acompanhamento
              gerado por você; (iii) operadores essenciais — pagamento, KYC,
              e-mail, infraestrutura; (iv) autoridades, mediante obrigação legal.
              Não vendemos dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>4. Seus direitos</h2>
            <p className="mt-2">
              Você pode solicitar acesso, correção, portabilidade, anonimização ou
              eliminação dos seus dados, além de revogar consentimentos, pelo
              e-mail {BRAND.supportEmail}. Respondemos nos prazos da LGPD.
              Avaliações públicas podem ser mantidas de forma anonimizada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>5. Retenção e segurança</h2>
            <p className="mt-2">
              Mantemos dados enquanto a conta existir e pelos prazos legais após o
              encerramento (registros de aplicação: 6 meses, Marco Civil;
              documentos fiscais: 5 anos). Usamos criptografia em trânsito,
              hashing de senhas e controle de acesso por função.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
