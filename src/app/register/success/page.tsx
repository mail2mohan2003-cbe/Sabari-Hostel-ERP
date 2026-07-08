import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center bg-white rounded-xl shadow p-10">
        <h1 className="text-2xl font-bold text-maroon mb-4">Registration Received</h1>
        <p className="text-gray-600 mb-6">
          Thank you! Your registration has been submitted to Sri Sabari Ladies Hostel. Our office
          will review your details and confirm your room allotment shortly. A confirmation link
          will be sent to your parent/guardian by email and WhatsApp/SMS once approved.
        </p>
        <Link href="/" className="text-maroon underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
