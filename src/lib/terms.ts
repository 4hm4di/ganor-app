// The Terms, Acceptable use policy and Privacy policy a new host agrees to (ganor.ng, "Last updated").
export const TERMS_VERSION = "2026-11-21"
export const TERMS_URL = "https://ganor.ng/terms.html"
export const PRIVACY_URL = "https://ganor.ng/privacy.html"
export const ACCEPTABLE_USE_URL = "https://ganor.ng/acceptable-use.html"
export const TERMS_REQUIRED = "Tick the box to agree to Ganor's Terms, Acceptable use policy and Privacy policy before you create your account."
export const termsAcceptance = () => ({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION })
