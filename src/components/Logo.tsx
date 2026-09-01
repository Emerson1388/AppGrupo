type LogoProps = {
  className?: string
}

export function Logo({ className = "h-12 w-auto" }: LogoProps) {
  return (
    <div className="inline-flex rounded-xl bg-black px-2 py-1.5">
      <img
        src="/logo-plasts-run.png"
        alt="Plast's Run"
        className={`object-contain object-left ${className}`}
      />
    </div>
  )
}
