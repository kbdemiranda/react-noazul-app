const BANK_LOGOS: { pattern: RegExp; src: string }[] = [
  { pattern: /99(?:app)?/i, src: '/logos/99.png' },
  { pattern: /abn\s*amro/i, src: '/logos/abn-amro.png' },
  { pattern: /agibank/i, src: '/logos/agibank.png' },
  { pattern: /agora\s*investimentos/i, src: '/logos/agora-investimentos.png' },
  { pattern: /alelo/i, src: '/logos/alelo.png' },
  { pattern: /amazon/i, src: '/logos/amazon.png' },
  { pattern: /american\s*express|amex/i, src: '/logos/american-express.png' },
  { pattern: /astropay/i, src: '/logos/astropay.png' },
  { pattern: /banco\s*inter|\binter\b/i, src: '/logos/banco-inter.png' },
  { pattern: /banco\s*do\s*brasil|\bbb\b/i, src: '/logos/banco-do-brasil.png' },
  { pattern: /brb/i, src: '/logos/brb.png' },
  { pattern: /btg\s*pactual|\bbtg\b/i, src: '/logos/btg-pactual.png' },
  { pattern: /c6\s*bank/i, src: '/logos/c6-bank.png' },
  { pattern: /caixa/i, src: '/logos/caixa.png' },
  { pattern: /caju/i, src: '/logos/caju.png' },
  { pattern: /credicard/i, src: '/logos/credicard.png' },
  { pattern: /diners\s*club/i, src: '/logos/diners-club.png' },
  { pattern: /elo/i, src: '/logos/elo.png' },
  { pattern: /hipercard/i, src: '/logos/hipercard.png' },
  { pattern: /nubank/i, src: '/logos/nubank.png' },
  { pattern: /ita[uú]/i, src: '/logos/itau.png' },
  { pattern: /mastercard/i, src: '/logos/mastercard.png' },
  { pattern: /mercado\s*pago/i, src: '/logos/mercado-pago.png' },
  { pattern: /paypal/i, src: '/logos/paypal.png' },
  { pattern: /picpay/i, src: '/logos/picpay.png' },
  { pattern: /revolut/i, src: '/logos/revolut.png' },
  { pattern: /safra/i, src: '/logos/safra.png' },
  { pattern: /santander/i, src: '/logos/santander.png' },
  { pattern: /visa/i, src: '/logos/visa.png' },
  { pattern: /wise/i, src: '/logos/wise.png' },
]

function findLogo(name: string): string | null {
  return BANK_LOGOS.find((entry) => entry.pattern.test(name))?.src ?? null
}

interface BankLogoProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

/** Real logo for known banks/issuers (matched against account.bankName or card.issuer); falls back to an initial-letter avatar. */
export function BankLogo({ name, logoUrl, size = 36, className = '' }: BankLogoProps) {
  const logo = logoUrl ?? findLogo(name)

  if (logo) {
    return (
      <span
        className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-white ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={logo} alt={name} className="h-full w-full object-cover" />
      </span>
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-brand-100 font-heading font-semibold text-brand-800 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
