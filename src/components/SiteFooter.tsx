export function SiteFooter() {
  return (
    <footer className="mt-auto p-4 lg:fixed lg:bottom-0 lg:left-0 lg:z-50">
      <p className="text-sm">
        ©{new Date().getFullYear()} <button className="border-none outline-none underline">credits</button>
      </p>
    </footer>
  )
}
