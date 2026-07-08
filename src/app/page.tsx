import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold text-maroon mb-2">Sri Sabari Ladies Hostel</h1>
      <p className="text-gray-600 mb-8">A Right Place for Ladies Hostel and Paying Guests</p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-6 py-3 bg-maroon text-white rounded-lg shadow hover:opacity-90"
        >
          New Inmate Registration
        </Link>
        <Link
          href="/admin"
          className="px-6 py-3 border border-maroon text-maroon rounded-lg hover:bg-maroon hover:text-white"
        >
          Admin Login
        </Link>
      </div>
    </main>
  );
}
