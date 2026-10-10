/**
 * Patterns typical of instructions smuggled into a page or a tool result.
 * Shared by the guardian rule (apps/web) and the merchant checker (apps/mcp-server).
 * Grouped by attack family: [family, regex]. Deterministic on purpose.
 */
export const INJECTION_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  // 1. Overriding prior instructions
  ["override", /\b(ignore|disregard|forget|override)\b.{0,20}\b(previous|prior|above|earlier|all|any|your)\b.{0,20}\b(instructions?|messages?|rules?|guidelines?|prompts?)\b/i],
  ["override", /\b(new|updated|revised|additional) (instructions?|directives?|rules?) (for|to) (the )?(ai|assistant|agent|model)\b/i],
  ["override", /\bignore[zr]? (les |toutes les )?(instructions|consignes|règles|regles)( précédentes| precedentes| antérieures| anterieures)?\b/i],
  ["override", /\b(nouvelles|nouvelles?) (instructions|consignes) pour (l'|le |la )?(ia|assistant|agent)\b/i],

  // 2. Fake system / developer messages and technical markers
  ["system", /\bsystem (notice|prompt|message|override|instruction|directive|alert)s?\b/i],
  ["system", /(\[INST\]|<\|system\|>|<\|im_start\|>|<system>|###\s*system|BEGIN SYSTEM|END SYSTEM)/i],
  ["system", /\b(developer|operator) (mode|message|override|instructions?)\b/i],

  // 3. Explicitly addressing AI agents
  ["targeting", /\b(notice|instructions?|message|note|attention|important)s? (to|for) (all |any |the )?(ai|llm|assistant|agent|bot|model)s?\b/i],
  ["targeting", /\b(if you are|if you're|as) an? (ai|llm|assistant|agent|language model|automated agent)\b/i],
  ["targeting", /\b(ai|llm|assistant|agent)s? (reading|processing|parsing) this\b/i],
  ["targeting", /\bfor (automated|ai) (agents?|assistants?) only\b/i],
  ["targeting", /\b(si tu es|si vous êtes|si vous etes) (une? )?(ia|assistant|agent)\b/i],
  ["targeting", /\b(attention|message|consigne|note) (aux|pour les|à l'|a l') (ia|assistants?|agents?)\b/i],

  // 4. Role hijacking
  ["role", /\b(you are now|from now on,? you|act as|pretend (to be|you are)|roleplay as)\b.{0,40}\b(agent|assistant|admin|operator|developer|unrestricted|without restrictions)\b/i],
  ["role", /\b(tu es maintenant|désormais tu|desormais tu|à partir de maintenant,? tu|a partir de maintenant,? tu|fais comme si tu)\b/i],

  // 5. Secrecy: hiding things from the human
  ["secrecy", /\bdo not (tell|mention|inform|reveal|disclose|show|display|notify)( this| it| that)? (to )?(the |your )?(user|human|owner|customer)\b/i],
  ["secrecy", /\b(without|don'?t|do not|never) (telling|informing|notifying|alerting|asking) (the |your )?(user|human|owner)\b/i],
  ["secrecy", /\b(keep this|keep it|this is) (secret|confidential|hidden|private)\b/i],
  ["secrecy", /\b(hide|conceal) (this|it|the notice|the instruction)s?\b/i],
  ["secrecy", /\bne (le |la |les )?(dis|dites|mentionne|mentionnez|signale|signalez|révèle|revele|montre|montrez) (pas|jamais)( ça| cela| ceci)? (à|a) (l'|votre |ton )?(utilisateur|humain|client)\b/i],
  ["secrecy", /\bsans (en )?(informer|prévenir|prevenir|avertir|demander à|demander a) (l'|votre |ton )?(utilisateur|humain|client)\b/i],
  ["secrecy", /\b(garde|gardez|reste|restez) (ça|cela|ceci|le|la) (secret|confidentiel|caché|cache)\b/i],

  // 6. Bypassing the guardian / human confirmation
  ["bypass", /\b(skip|bypass|avoid|circumvent|disable|ignore) (the |any |all )?(confirmation|approval|verification|validation|check|guardian|payguard|safety|security|limit)s?\b/i],
  ["bypass", /\b(no need|not necessary|unnecessary) to (ask|confirm|check|verify)( with)?( the)?( user)?\b/i],
  ["bypass", /\b(approve|confirm|validate|execute|proceed) (it )?(automatically|without (asking|confirmation|approval|review))\b/i],
  ["bypass", /\b(contourne|contournez|désactive|desactive|ignore|évite|evite) (la |le |les |toute )?(confirmation|validation|vérification|verification|gardien|payguard|limite|sécurité|securite)s?\b/i],
  ["bypass", /\b(valide|approuve|exécute|execute) (automatiquement|sans (demander|confirmation|validation))\b/i],

  // 7. Fake authority
  ["authority", /\b(as|from) your (developer|creator|operator|administrator|admin|owner)s?\b/i],
  ["authority", /\b(anthropic|openai|google|the platform|your provider) (requires?|mandates?|instructs?|has authorized|authorizes?)\b/i],
  ["authority", /\bon behalf of (your )?(developer|operator|anthropic|openai)\b/i],
  ["authority", /\b(de la part de|au nom de) (ton|votre|vos) (développeur|developpeur|opérateur|operateur|administrateur)s?\b/i],

  // 8. Payment redirection and forced tool calls
  ["payment", /\b(payment|wallet|receiving|recipient|destination) address (above|below|listed|shown|on this page)? ?(is|has been|was) (outdated|changed|updated|replaced|moved|incorrect|wrong|no longer valid)\b/i],
  ["payment", /\b(use|send (it|the payment|funds|the funds) to|pay to) (this|the following|the new|our new|a different) (wallet|address)( instead)?\b/i],
  ["payment", /\b(new|updated|correct|official|real) (wallet|payment) address( is)?:?\s*0x[a-f0-9]{40}\b/i],
  ["payment", /\b(send|transfer|pay) \d+([.,]\d+)? ?(avax|eth|usdc|tokens?) to 0x[a-f0-9]{40}\b/i],
  ["payment", /\b(immediately|now|first|instead),? (call|invoke|use|execute|run) (the )?(request_payment|payment tool|tool|function)\b/i],
  ["payment", /\b(call|invoke|use) request_payment\b/i],
  ["payment", /\b(you must|you are required to|you need to|you have to|it is mandatory to) (send|pay|transfer|call|invoke)\b/i],
  ["payment", /\b(l'adresse|adresse) (de paiement|du portefeuille|du wallet) (a changé|a change|est obsolète|est obsolete|n'est plus valide|est incorrecte)\b/i],
  ["payment", /\b(envoie|envoyez|transfère|transferez|paie|payez) \d+([.,]\d+)? ?(avax|eth|usdc) (à|a|vers) 0x[a-f0-9]{40}\b/i],
  ["payment", /\b(utilise|utilisez|envoie|envoyez) (plutôt |plutot )?(cette|la nouvelle|l'autre) adresse\b/i],
  ["payment", /\b(appelle|appelez|utilise|utilisez) (l'outil |la fonction )?request_payment\b/i],

  // 9. Threats and rewards aimed at the agent
  ["pressure", /\b(or|otherwise|else) (your|the) (user|account|access|session) will be (penali[sz]ed|suspended|blocked|terminated|charged|lost)\b/i],
  ["pressure", /\b(to|in order to) (pass|complete|finish) (the )?(verification|validation|security check|identity check)\b/i],
  ["pressure", /\b(failure to comply|non-compliance) (will|may) result\b/i],
  ["pressure", /\b(sinon|faute de quoi) (le |votre |ton )?(compte|accès|acces|utilisateur) sera (suspendu|bloqué|bloque|pénalisé|penalise|fermé|ferme)\b/i],
];

export interface InjectionMatch {
  family: string;
  pattern: string;
}

/** Exported for tests and for the dashboard detail page (which patterns fired). */
export function findInjections(text: string): InjectionMatch[] {
  return INJECTION_PATTERNS.filter(([, re]) => re.test(text)).map(([family, re]) => ({ family, pattern: re.source }));
}
