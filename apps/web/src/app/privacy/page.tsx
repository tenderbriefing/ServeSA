'use client'

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          Serve SA collects information necessary to provide service delivery reporting and communication services. 
          This includes:
        </p>
        <ul>
          <li>Personal information (name, email, phone number) for account creation</li>
          <li>Location data for accurate service delivery reporting</li>
          <li>Report details including descriptions, photos, and videos</li>
          <li>Communication data between citizens and departments</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process and track service delivery reports</li>
          <li>Facilitate communication between citizens and government departments</li>
          <li>Improve our services and platform functionality</li>
          <li>Generate analytics and reports for government officials</li>
        </ul>

        <h2>3. Data Protection</h2>
        <p>
          Serve SA complies with the Protection of Personal Information Act (POPIA) and implements 
          appropriate security measures to protect your data. We use industry-standard encryption 
          and secure cloud infrastructure.
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          Your information may be shared with relevant government departments and officials 
          for the purpose of addressing service delivery issues. We do not sell or share 
          your personal information with third parties for commercial purposes.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
        </ul>

        <h2>6. Contact Us</h2>
        <p>
          For privacy-related questions or concerns, please contact us at:
          <br />
          Email: privacy@servesa.gov.za
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
