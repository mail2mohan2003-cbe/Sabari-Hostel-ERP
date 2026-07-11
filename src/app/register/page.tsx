"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  fullName: string;
  dob: string;
  mobile: string;
  email: string;
  fatherMotherName: string;
  fatherMotherMobile: string;
  permanentAddress: string;
  occupationType: string;
  institutionAddress: string;
  institutionPhone: string;
  localGuardianName: string;
  localGuardianContact: string;
  localGuardianAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  foodPreference: string;
  addressProof: string;
  idProof: string;
  preferredJoiningDate: string;
  expectedDurationMonths: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  fullName: "",
  dob: "",
  mobile: "",
  email: "",
  fatherMotherName: "",
  fatherMotherMobile: "",
  permanentAddress: "",
  occupationType: "Student",
  institutionAddress: "",
  institutionPhone: "",
  localGuardianName: "",
  localGuardianContact: "",
  localGuardianAddress: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  foodPreference: "Veg",
  addressProof: "",
  idProof: "",
  preferredJoiningDate: "",
  expectedDurationMonths: "",
};

function isValidMobile(v: string) {
  return /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "").replace(/^\+?91/, ""));
}

function isValidLoosePhone(v: string) {
  const digits = v.replace(/[\s-]/g, "").replace(/^\+/, "");
  return /^\d{6,15}$/.test(digits);
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.fullName.trim() || form.fullName.trim().length < 2) {
    errors.fullName = "Enter the full name (at least 2 characters).";
  }

  if (!form.dob) {
    errors.dob = "Date of birth is required.";
  } else if (new Date(form.dob) > new Date()) {
    errors.dob = "Date of birth cannot be in the future.";
  }

  if (!form.mobile.trim()) {
    errors.mobile = "Mobile number is required.";
  } else if (!isValidMobile(form.mobile)) {
    errors.mobile = "Enter a valid 10-digit mobile number.";
  }

  if (form.email.trim() && !isValidEmail(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.fatherMotherName.trim() || form.fatherMotherName.trim().length < 2) {
    errors.fatherMotherName = "Father/Mother name is required.";
  }

  if (!form.fatherMotherMobile.trim()) {
    errors.fatherMotherMobile = "Father/Mother mobile number is required.";
  } else if (!isValidMobile(form.fatherMotherMobile)) {
    errors.fatherMotherMobile = "Enter a valid 10-digit mobile number.";
  }

  if (!form.permanentAddress.trim() || form.permanentAddress.trim().length < 5) {
    errors.permanentAddress = "Enter your full permanent address.";
  }

  if (!form.institutionAddress.trim() || form.institutionAddress.trim().length < 2) {
    errors.institutionAddress = "College/Institute/Company address is required.";
  }

  if (form.institutionPhone.trim() && !isValidLoosePhone(form.institutionPhone)) {
    errors.institutionPhone = "Enter a valid phone number.";
  }

  if (form.localGuardianContact.trim() && !isValidLoosePhone(form.localGuardianContact)) {
    errors.localGuardianContact = "Enter a valid contact number.";
  }

  if (!form.emergencyContactName.trim() || form.emergencyContactName.trim().length < 2) {
    errors.emergencyContactName = "Emergency contact name is required.";
  }

  if (!form.emergencyContactRelation.trim()) {
    errors.emergencyContactRelation = "Relation is required.";
  }

  if (!form.emergencyContactPhone.trim()) {
    errors.emergencyContactPhone = "Emergency contact number is required.";
  } else if (!isValidMobile(form.emergencyContactPhone)) {
    errors.emergencyContactPhone = "Enter a valid 10-digit mobile number.";
  }

  if (!form.preferredJoiningDate) {
    errors.preferredJoiningDate = "Preferred date of joining is required.";
  }

  if (form.expectedDurationMonths.trim()) {
    const n = Number(form.expectedDurationMonths);
    if (!Number.isInteger(n) || n < 1) {
      errors.expectedDurationMonths = "Enter a whole number of months (1 or more).";
    }
  }

  if (!form.addressProof.trim() || form.addressProof.trim().length < 2) {
    errors.addressProof = "Address proof type is required.";
  }

  if (!form.idProof.trim() || form.idProof.trim().length < 2) {
    errors.idProof = "ID proof type is required.";
  }

  return errors;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

function fieldClass(hasError?: string) {
  return `w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-500 bg-red-50 focus:ring-red-400"
      : "border-gray-300 focus:ring-maroon"
  }`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please check the form and try again.");
      }
      router.push("/register/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-maroon">SRI SABARI LADIES HOSTEL</h1>
          <p className="text-sm italic text-gray-500">A Right Place for Ladies Hostel and Paying Guests</p>
          <h2 className="mt-4 inline-block border border-maroon rounded px-4 py-1 text-maroon font-semibold">
            REGISTRATION FORM
          </h2>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Fields marked <span className="text-red-600">*</span> are mandatory.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Full Name" required error={errors.fullName}>
            <input
              data-error={!!errors.fullName}
              className={fieldClass(errors.fullName)}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </Field>

          <Field label="Date of Birth" required error={errors.dob}>
            <input
              data-error={!!errors.dob}
              type="date"
              className={fieldClass(errors.dob)}
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mobile No" required error={errors.mobile}>
              <input
                data-error={!!errors.mobile}
                className={fieldClass(errors.mobile)}
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Field>
            <Field label="Email ID" error={errors.email}>
              <input
                data-error={!!errors.email}
                type="email"
                className={fieldClass(errors.email)}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Father / Mother Name" required error={errors.fatherMotherName}>
              <input
                data-error={!!errors.fatherMotherName}
                className={fieldClass(errors.fatherMotherName)}
                value={form.fatherMotherName}
                onChange={(e) => update("fatherMotherName", e.target.value)}
              />
            </Field>
            <Field label="Father / Mother Mobile No" required error={errors.fatherMotherMobile}>
              <input
                data-error={!!errors.fatherMotherMobile}
                className={fieldClass(errors.fatherMotherMobile)}
                value={form.fatherMotherMobile}
                onChange={(e) => update("fatherMotherMobile", e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Field>
          </div>

          <Field label="Permanent Residential Address" required error={errors.permanentAddress}>
            <textarea
              data-error={!!errors.permanentAddress}
              rows={3}
              className={fieldClass(errors.permanentAddress)}
              value={form.permanentAddress}
              onChange={(e) => update("permanentAddress", e.target.value)}
            />
          </Field>

          <Field label="Are you Student / Trainee / Employee" required>
            <select
              className={fieldClass()}
              value={form.occupationType}
              onChange={(e) => update("occupationType", e.target.value)}
            >
              <option>Student</option>
              <option>Trainee</option>
              <option>Employee</option>
            </select>
          </Field>

          <Field label="Your College / Institute / Company Address" required error={errors.institutionAddress}>
            <textarea
              data-error={!!errors.institutionAddress}
              rows={2}
              className={fieldClass(errors.institutionAddress)}
              value={form.institutionAddress}
              onChange={(e) => update("institutionAddress", e.target.value)}
            />
          </Field>

          <Field label="College / Institute / Company Phone No" error={errors.institutionPhone}>
            <input
              data-error={!!errors.institutionPhone}
              className={fieldClass(errors.institutionPhone)}
              value={form.institutionPhone}
              onChange={(e) => update("institutionPhone", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Local Guardian Name">
              <input
                className={fieldClass()}
                value={form.localGuardianName}
                onChange={(e) => update("localGuardianName", e.target.value)}
              />
            </Field>
            <Field label="Local Guardian Contact No" error={errors.localGuardianContact}>
              <input
                data-error={!!errors.localGuardianContact}
                className={fieldClass(errors.localGuardianContact)}
                value={form.localGuardianContact}
                onChange={(e) => update("localGuardianContact", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Local Guardian Address">
            <textarea
              rows={2}
              className={fieldClass()}
              value={form.localGuardianAddress}
              onChange={(e) => update("localGuardianAddress", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Emergency Contact Name" required error={errors.emergencyContactName}>
              <input
                data-error={!!errors.emergencyContactName}
                className={fieldClass(errors.emergencyContactName)}
                value={form.emergencyContactName}
                onChange={(e) => update("emergencyContactName", e.target.value)}
              />
            </Field>
            <Field label="Relation" required error={errors.emergencyContactRelation}>
              <input
                data-error={!!errors.emergencyContactRelation}
                className={fieldClass(errors.emergencyContactRelation)}
                value={form.emergencyContactRelation}
                onChange={(e) => update("emergencyContactRelation", e.target.value)}
              />
            </Field>
            <Field label="Contact No" required error={errors.emergencyContactPhone}>
              <input
                data-error={!!errors.emergencyContactPhone}
                className={fieldClass(errors.emergencyContactPhone)}
                value={form.emergencyContactPhone}
                onChange={(e) => update("emergencyContactPhone", e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of Joining (past or future)" required error={errors.preferredJoiningDate}>
              <input
                data-error={!!errors.preferredJoiningDate}
                type="date"
                className={fieldClass(errors.preferredJoiningDate)}
                value={form.preferredJoiningDate}
                onChange={(e) => update("preferredJoiningDate", e.target.value)}
              />
            </Field>
            <Field
              label="Expected Duration of Stay (months, approx.)"
              error={errors.expectedDurationMonths}
            >
              <input
                data-error={!!errors.expectedDurationMonths}
                type="number"
                min={1}
                className={fieldClass(errors.expectedDurationMonths)}
                value={form.expectedDurationMonths}
                onChange={(e) => update("expectedDurationMonths", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Food Preference" required>
            <select
              className={fieldClass()}
              value={form.foodPreference}
              onChange={(e) => update("foodPreference", e.target.value)}
            >
              <option>Veg</option>
              <option>Non Veg</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Address Proof (type, e.g. Aadhar / Voter ID)" required error={errors.addressProof}>
              <input
                data-error={!!errors.addressProof}
                className={fieldClass(errors.addressProof)}
                value={form.addressProof}
                onChange={(e) => update("addressProof", e.target.value)}
              />
            </Field>
            <Field label="ID Proof (type, e.g. Aadhar / College ID)" required error={errors.idProof}>
              <input
                data-error={!!errors.idProof}
                className={fieldClass(errors.idProof)}
                value={form.idProof}
                onChange={(e) => update("idProof", e.target.value)}
              />
            </Field>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Please bring the original and a photocopy of your address proof and ID proof, along with
            a passport-size photo, at the time of joining.
          </p>

          {Object.keys(errors).length > 0 && (
            <p className="text-red-600 text-sm mb-4">
              Please fix the highlighted field(s) above before submitting.
            </p>
          )}
          {submitError && <p className="text-red-600 text-sm mb-4">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-maroon text-white rounded-md py-3 font-medium disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </main>
  );
}
