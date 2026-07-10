import type { NotificationPayload, NotificationProvider } from "./types";

class ConsoleNotificationProvider implements NotificationProvider {
  readonly name = "console";
  async send(p: NotificationPayload): Promise<void> {
    console.log(
      `[notify:${p.kind}] para=${p.to.name} <${p.to.email}> | ${p.subject} | ${p.body}`
    );
  }
}

let instance: NotificationProvider | null = null;

export function getNotificationProvider(): NotificationProvider {
  if (instance) return instance;
  // Gancho: case "resend": new ResendProvider(process.env.RESEND_API_KEY)
  instance = new ConsoleNotificationProvider();
  return instance;
}

/** Dispara sem bloquear o fluxo principal (notificação é best-effort). */
export function notify(payload: NotificationPayload): void {
  getNotificationProvider()
    .send(payload)
    .catch((err) => console.error("[notify] falha ao enviar", err));
}

export type { NotificationProvider, NotificationPayload } from "./types";
