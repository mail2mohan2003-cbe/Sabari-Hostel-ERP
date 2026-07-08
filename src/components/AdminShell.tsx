import Link from "next/link";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/occupants", label: "Occupants" },
  { href: "/admin/rooms", label: "Rooms & Inmates" },
  { href: "/admin/billing", label: "EB Billing" },
  { href: "/admin/payments", label: "Payments & Dues" },
];

export default function AdminShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-maroon text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold leading-tight">Sri Sabari Ladies Hostel</p>
            <p className="text-xs opacity-80 leading-tight">Admin Console</p>
          </div>
          <LogoutButton />
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-2 whitespace-nowrap border-b-2 ${
                active === item.href
                  ? "border-white font-semibold"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
