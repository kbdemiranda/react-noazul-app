import { type ReactNode } from 'react'
import { BrandMark } from './BrandMark'

interface AuthSplitLayoutProps {
  heading: string
  description: string
  children: ReactNode
}

/** Full-bleed desktop split used by every auth-family screen (login, signup, onboarding): brand panel left, form panel right. */
export function AuthSplitLayout({ heading, description, children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden w-1/2 flex-col justify-center bg-linear-to-br from-brand-900 to-brand-500 p-16 text-white lg:flex xl:p-24">
        <div className="mx-auto w-full max-w-lg">
          <span className="mb-8 flex items-center gap-2 font-heading text-2xl font-semibold">
            <BrandMark size={26} className="text-white" />
            NoAzul
          </span>
          <h2 className="mb-4 font-heading text-4xl font-semibold text-white">{heading}</h2>
          <p className="text-base text-white/75">{description}</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-page px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <span className="mb-7 flex items-center gap-2 font-heading text-lg font-semibold text-ink lg:hidden">
            <BrandMark size={20} />
            NoAzul
          </span>
          {children}
        </div>
      </div>
    </div>
  )
}
