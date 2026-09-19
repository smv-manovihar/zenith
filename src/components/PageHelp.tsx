import type { ReactNode } from "react"

export interface HelpSectionData {
  title: string
  content: ReactNode
}

export function HelpSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-1.5">
      <h4 className="text-xs font-black tracking-widest text-foreground uppercase">
        {title}
      </h4>
      <div className="text-muted-foreground">{children}</div>
    </section>
  )
}

export function HelpSteps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-1.5 pl-4">{children}</ol>
}

export function HelpBullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-4">{children}</ul>
}
