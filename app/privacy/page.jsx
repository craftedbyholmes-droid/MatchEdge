'use client'
export default function PrivacyPage() {
  const h2 = { fontSize: '16px', fontWeight: 700, marginBottom: '8px', marginTop: '28px', color: '#e8e8f0' }
  const p = { color: '#9ca3af', fontSize: '14px', lineHeight: '1.7' }
  const li = { color: '#9ca3af', fontSize: '14px', lineHeight: '1.7', marginBottom: '6px' }
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', marginTop: '32px' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '32px' }}>Last updated: May 2026. This policy explains how MatchEdge collects, uses, and protects your personal data.</p>

      <h2 style={h2}>1. Who We Are</h2>
      <p style={p}>MatchEdge is a football analytics and tipping information platform. References to we, us, and our in this policy refer to the operators of the MatchEdge platform. We are the data controller for personal data collected through this service.</p>

      <h2 style={h2}>2. Data We Collect</h2>
      <p style={p}>We collect the following categories of personal data:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Account data:</strong> Email address and encrypted password, collected at registration.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Subscription data:</strong> Your current plan (Free, Pro, Edge, or Day Pass) and subscription status. Payment processing is handled entirely by Stripe — we do not store card numbers or payment details.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Usage data:</strong> Pages visited, features used, and session information collected automatically via server logs and analytics.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Cookie data:</strong> We use a single functional cookie to record your acceptance of our cookie notice. We do not use advertising or tracking cookies.</li>
      </ul>
      <p style={{ ...p, marginTop: '10px' }}>We do not collect sensitive personal data such as financial information beyond what is necessary for subscription processing, nor do we collect data relating to ethnicity, religion, health, or political views.</p>

      <h2 style={h2}>3. How We Use Your Data</h2>
      <p style={p}>We use the personal data we collect for the following purposes:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li style={li}>To create and manage your account.</li>
        <li style={li}>To process your subscription and manage access to paid features.</li>
        <li style={li}>To send transactional emails such as email verification, password reset, and subscription confirmation. We do not send unsolicited marketing emails without your consent.</li>
        <li style={li}>To detect and prevent fraud, abuse, or breach of our Terms and Conditions.</li>
        <li style={li}>To improve the platform based on aggregated, anonymised usage data.</li>
      </ul>

      <h2 style={h2}>4. Legal Basis for Processing</h2>
      <p style={p}>We process your personal data on the following legal bases under UK GDPR:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Contract performance:</strong> Processing necessary to provide the service you have subscribed to.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Legitimate interests:</strong> Security monitoring, fraud prevention, and platform improvement.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Legal obligation:</strong> Where we are required to retain or disclose data by law.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Consent:</strong> For any optional communications such as newsletters, where you have explicitly opted in.</li>
      </ul>

      <h2 style={h2}>5. Data Sharing</h2>
      <p style={p}>We do not sell your personal data to third parties. We share data only with the following trusted service providers who process data on our behalf:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Supabase:</strong> Authentication and database hosting. Your account data is stored securely on Supabase infrastructure.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Stripe:</strong> Payment processing. Card data is handled entirely by Stripe and is never transmitted to or stored on our servers.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Vercel:</strong> Platform hosting and edge network delivery.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Anthropic:</strong> AI tip text generation. Match data and persona prompts are sent to the Anthropic API. No personal user data is included in these requests.</li>
      </ul>
      <p style={{ ...p, marginTop: '10px' }}>All third-party processors are required to handle your data in accordance with applicable data protection law.</p>

      <h2 style={h2}>6. Data Retention</h2>
      <p style={p}>We retain your personal data for as long as your account remains active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes. Anonymised, aggregated usage data may be retained indefinitely for platform improvement purposes.</p>

      <h2 style={h2}>7. Your Rights</h2>
      <p style={p}>Under UK GDPR, you have the following rights regarding your personal data:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right of access:</strong> You may request a copy of the personal data we hold about you.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right to rectification:</strong> You may request correction of inaccurate data.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right to erasure:</strong> You may request deletion of your personal data, subject to legal retention obligations.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right to restriction:</strong> You may request that we limit processing of your data in certain circumstances.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right to portability:</strong> You may request your data in a portable, machine-readable format.</li>
        <li style={li}><strong style={{ color: '#e8e8f0' }}>Right to object:</strong> You may object to processing based on legitimate interests.</li>
      </ul>
      <p style={{ ...p, marginTop: '10px' }}>To exercise any of these rights, please contact us using the details in section 10. We will respond within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at www.ico.org.uk.</p>

      <h2 style={h2}>8. Cookies</h2>
      <p style={p}>MatchEdge uses a minimal cookie approach. We set one functional cookie to record your acceptance of our cookie notice. This cookie does not track your activity across other websites and contains no personally identifiable information. We do not use advertising cookies, tracking pixels, or third-party analytics that set cookies on your device.</p>
      <p style={{ ...p, marginTop: '10px' }}>You may disable cookies in your browser settings. Disabling cookies will not affect your ability to use the platform, though your cookie notice acceptance will not be remembered between sessions.</p>

      <h2 style={h2}>9. Security</h2>
      <p style={p}>We take reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include encrypted data transmission via HTTPS, password hashing, row-level security on our database, and access controls limiting data access to authorised personnel only.</p>
      <p style={{ ...p, marginTop: '10px' }}>No system is completely secure. In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and the ICO as required by law.</p>

      <h2 style={h2}>10. Contact and Complaints</h2>
      <p style={p}>For any data protection enquiries, to exercise your rights, or to raise a concern, please contact us at the email address associated with your account or via the contact information published on the platform.</p>
      <p style={{ ...p, marginTop: '10px' }}>If you are not satisfied with our handling of your enquiry, you may contact the Information Commissioner's Office: ico.org.uk | 0303 123 1113.</p>

      <h2 style={h2}>11. Changes to This Policy</h2>
      <p style={p}>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. The date at the top of this page reflects the date of the most recent update. Continued use of the platform following notification of changes constitutes acceptance of the revised policy.</p>

      <div style={{ marginTop: '40px', padding: '16px', background: '#13131a', borderRadius: '8px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        18+ only. MatchEdge does not accept bets. For information and entertainment only.<br />
        <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133 (free, 24/7)
      </div>
    </div>
  )
}