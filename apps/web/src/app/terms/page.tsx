'use client'

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By using ServeSA, you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          ServeSA is a digital platform that enables citizens to report service delivery 
          issues and communicate directly with government departments. The platform 
          facilitates transparency and accountability in public service delivery.
        </p>

        <h2>3. User Responsibilities</h2>
        <p>As a user of ServeSA, you agree to:</p>
        <ul>
          <li>Provide accurate and truthful information</li>
          <li>Use the platform for legitimate service delivery reporting</li>
          <li>Respect other users and government officials</li>
          <li>Not abuse or misuse the platform</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>

        <h2>4. Prohibited Activities</h2>
        <p>You may not:</p>
        <ul>
          <li>Submit false or misleading reports</li>
          <li>Use the platform for commercial purposes</li>
          <li>Harass or abuse other users or officials</li>
          <li>Attempt to hack or compromise the platform</li>
          <li>Violate any laws or regulations</li>
        </ul>

        <h2>5. Government Department Responsibilities</h2>
        <p>
          Government departments using ServeSA agree to:
        </p>
        <ul>
          <li>Respond to citizen reports in a timely manner</li>
          <li>Provide accurate and helpful information</li>
          <li>Maintain professional communication standards</li>
          <li>Follow up on reported issues appropriately</li>
        </ul>

        <h2>6. Limitation of Liability</h2>
        <p>
          ServeSA is provided "as is" without warranties. We are not liable for 
          any damages arising from the use of the platform, including but not 
          limited to service delivery issues or communication problems.
        </p>

        <h2>7. Modifications</h2>
        <p>
          We reserve the right to modify these terms at any time. Users will be 
          notified of significant changes through the platform.
        </p>

        <h2>8. Contact Information</h2>
        <p>
          For questions about these terms, please contact:
          <br />
          Email: legal@servesa.gov.za
          <br />
          Phone: +27 11 123 4567
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
