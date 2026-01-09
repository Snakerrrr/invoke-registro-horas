"use client"
import { HourRegistrationForm } from "@/components/hour-registration-form"

export default function HourRegistrationPage() {
  return (
    <div className="min-h-screen bg-white fade-in-up">
      <div className="space-y-6 sm:space-y-8 animate-fade-in p-6">
        <div className="px-4">
          <HourRegistrationForm />
        </div>
      </div>
    </div>
  )
}
