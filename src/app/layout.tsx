import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sri Sabari Ladies Hostel - ERP",
  description: "Registration, rooms, billing and payments for Sri Sabari Ladies Hostel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
