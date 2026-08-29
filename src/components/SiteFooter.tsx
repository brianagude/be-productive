export function SiteFooter() {
  return (
    <footer className="mt-auto p-4">
      <p className="text-sm">
        ©{new Date().getFullYear()} <button className="border-none outline-none underline">credits</button>
      </p>
    </footer>
  )
}
