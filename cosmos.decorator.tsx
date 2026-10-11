import type { ReactNode } from "react"

export default ({ children }: { children: ReactNode }) => (
  <div style={{ minHeight: "100vh", background: "#f6f8fa" }}>{children}</div>
)
