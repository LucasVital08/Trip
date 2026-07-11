/**
 * Preserva o que o usuário digitou quando uma server action retorna erro.
 *
 * O React 19 reseta formulários não-controlados após cada action; sem isto,
 * um erro de validação apagaria os campos preenchidos. O padrão: a action
 * devolve os valores enviados em `state.values` e o formulário os usa como
 * defaultValue no re-render (o reset do React aplica o defaultValue novo).
 */
export function formValues(
  formData: FormData,
  omit: string[] = []
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key.startsWith("$ACTION")) continue; // campos internos do React
    if (omit.includes(key)) continue;
    out[key] = value;
  }
  return out;
}
