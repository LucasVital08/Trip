import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { PLATFORM } from "@/config/platform";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Termos de uso" };

/**
 * RASCUNHO de termos de uso, redigido de forma coerente com o enquadramento
 * de marketplace de intermediação (a plataforma conecta, não transporta).
 * Deve ser revisado por advogado antes do lançamento.
 */
export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-deep">
          Rascunho para revisão jurídica · atualizado em julho de 2026
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Termos de uso
        </h1>

        <div className="prose-trip mt-8 space-y-8 text-[15px] leading-relaxed text-ink/75">
          <Section n="1" title="O que o Trip é (e o que não é)">
            <p>
              O {BRAND.name} (“Plataforma”), operado por {BRAND.legalName}, é um
              serviço de tecnologia que <strong>intermedia</strong> o contato entre
              motoristas dispostos a compartilhar os assentos livres de seus
              veículos em viagens que já realizariam (“Motoristas”) e pessoas
              interessadas em ocupar esses assentos (“Passageiros”).
            </p>
            <p>
              A Plataforma <strong>não é uma empresa de transporte</strong>, não
              presta serviço de transporte de passageiros, não possui frota, não
              emprega motoristas e não define rotas ou horários. O acordo de
              carona é celebrado <strong>diretamente entre Motorista e
              Passageiro</strong>; o {BRAND.name} fornece a infraestrutura de
              descoberta, reserva, pagamento e reputação que suporta esse acordo.
            </p>
          </Section>

          <Section n="2" title="Cadastro e verificação">
            <p>
              Para usar a Plataforma é preciso ter 18 anos ou mais e prestar
              informações verdadeiras. Motoristas devem obrigatoriamente concluir
              a verificação de identidade (documento oficial + selfie) e manter
              CNH válida e veículo em condições legais e mecânicas de rodar.
              Informações falsas ensejam suspensão ou banimento.
            </p>
          </Section>

          <Section n="3" title="Preços, taxa de serviço e pagamentos">
            <p>
              O preço por assento é <strong>definido livremente pelo
              Motorista</strong>. A Plataforma pode exibir sugestões de faixa de
              preço, meramente referenciais. Sobre cada reserva incide a{" "}
              <strong>taxa de serviço do {BRAND.name}</strong> (atualmente{" "}
              {PLATFORM.feePercent}% do valor definido pelo Motorista), exibida de
              forma destacada antes da confirmação, que remunera a intermediação,
              o processamento do pagamento e as ferramentas de segurança.
            </p>
            <p>
              O pagamento é processado por instituição de pagamento parceira. O
              valor do Motorista fica retido e é repassado após a conclusão da
              viagem. Pagamentos fora da Plataforma quebram estes Termos e
              retiram do usuário as proteções de reembolso e suporte.
            </p>
          </Section>

          <Section n="4" title="Cancelamentos e reembolsos">
            <p>Cancelamento pelo Passageiro: reembolso integral com 24h ou mais de antecedência da saída; 50% entre 24h e 3h; sem reembolso a menos de 3h. Cancelamento pelo Motorista: reembolso integral ao Passageiro, sem exceção. Cancelamentos recorrentes pelo Motorista podem levar à suspensão do perfil.</p>
          </Section>

          <Section n="5" title="Conduta e segurança">
            <p>
              É proibido: dirigir sob efeito de álcool ou substâncias; transportar
              mais passageiros que o número de cintos; assédio ou discriminação de
              qualquer natureza; uso comercial disfarçado (transporte remunerado
              habitual e profissional travestido de carona); fraude em avaliações.
              A Plataforma pode remover conteúdo, suspender ou banir contas, e
              cooperará com autoridades quando exigido por lei.
            </p>
          </Section>

          <Section n="6" title="Responsabilidades">
            <p>
              O {BRAND.name} responde pela disponibilidade e correção da
              intermediação: busca, reserva, processamento do pagamento, repasse e
              ferramentas de segurança. O Motorista responde pela condução, pelo
              veículo, por seguros e obrigações legais aplicáveis; Motorista e
              Passageiro respondem pelos compromissos que assumem um com o outro.
              A Plataforma não garante a realização da viagem, mas garante o
              reembolso conforme a Seção 4 quando ela não acontece.
            </p>
          </Section>

          <Section n="7" title="Propriedade intelectual, dados e foro">
            <p>
              A marca, a interface e o software são do {BRAND.name}. O tratamento
              de dados pessoais está descrito na Política de Privacidade. Estes
              Termos são regidos pelas leis brasileiras; fica eleito o foro do
              domicílio do usuário, como manda o CDC.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
