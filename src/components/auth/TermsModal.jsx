import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText } from 'lucide-react'

const TERMS_TEXT = `# NEUTRON TERMS AND CONDITIONS

**Effective Date:** July 1, 2026

Welcome to Neutron.

These Terms and Conditions ("Terms") govern your access to and use of the Neutron platform, including its mobile applications, websites, marketplace features, communication systems, content-sharing services, and all related services.

By creating an account, accessing, or using Neutron, you agree to be bound by these Terms. If you do not agree with these Terms, you must not use Neutron.

---

# 1. ELIGIBILITY

To use Neutron, you must:

* Be at least 18 years of age.
* Have the legal capacity to enter into binding agreements.
* Comply with all applicable laws and regulations.

By using Neutron, you represent and warrant that you meet these requirements.

---

# 2. ABOUT NEUTRON

Neutron is a social networking and asset marketplace platform that enables users to:

* Create profiles.
* Share posts, media, and updates.
* Communicate through messaging features.
* Participate in groups and communities.
* Publish graphs, market insights, and business information.
* List, promote, discover, and negotiate transactions involving assets and opportunities.

Neutron serves only as a technology platform connecting users.

Neutron is not:

* A stock exchange.
* A securities exchange.
* A brokerage.
* A financial institution.
* An investment advisor.
* A legal advisor.
* A tax advisor.
* A real estate agency.
* A valuation service.

Users remain solely responsible for their decisions and transactions.

---

# 3. USER ACCOUNTS

Users are responsible for:

* Maintaining account security.
* Protecting passwords and credentials.
* Ensuring information remains accurate.
* Monitoring activity conducted through their account.

Users are fully responsible for actions performed using their accounts.

Neutron may suspend, restrict, or terminate accounts that violate these Terms or pose security, legal, or operational risks.

---

# 4. USER CONTENT

Users may upload content including:

* Posts.
* Images.
* Videos.
* Documents.
* Listings.
* Comments.
* Messages.
* Graphs and analytics.

Users retain ownership of their content.

By posting content on Neutron, users grant Neutron a worldwide, non-exclusive, royalty-free license to host, display, distribute, reproduce, and promote such content solely for operating and improving the platform.

Users represent that they possess all rights necessary to publish the content they upload.

---

# 5. ASSET LISTINGS

Users may create listings relating to:

* Real estate.
* Businesses.
* Startups.
* Mobile applications.
* Websites.
* Domain names.
* Software products.
* Intellectual property.
* Trademarks.
* Copyrights.
* Music rights.
* Business opportunities.
* Digital assets.
* Other legally transferable assets.

Users are solely responsible for:

* Ownership claims.
* Listing accuracy.
* Asset legality.
* Supporting documentation.
* Transferability rights.

Neutron does not guarantee ownership, value, authenticity, legality, or quality of any listing.

---

# 6. TRANSACTIONS

All negotiations and transactions occur directly between users.

Neutron does not become a party to any agreement, contract, sale, transfer, investment, acquisition, partnership, or business arrangement entered into by users.

Users are solely responsible for conducting independent due diligence before entering into any transaction.

---

# 7. INVESTMENT RISK WARNING

Listings, discussions, projections, graphs, financial statements, valuations, opinions, forecasts, and business information available on Neutron may be created by users.

Neutron does not verify all information appearing on the platform.

Neutron makes no guarantees regarding:

* Profitability.
* Investment returns.
* Business performance.
* Asset appreciation.
* Financial projections.

All investments and transactions involve risk.

Users assume full responsibility for their financial decisions.

---

# 8. PAYMENT AND ESCROW DISCLAIMER

Neutron may allow users to communicate regarding payment arrangements and escrow arrangements.

Neutron does not guarantee:

* Completion of payments.
* Validity of escrow arrangements.
* Release of funds.
* Asset delivery.
* Transfer completion.

Users engage in transactions entirely at their own risk.

Neutron shall not be liable for losses resulting from:

* Fraud.
* Non-payment.
* Payment disputes.
* Escrow disputes.
* Asset transfer disputes.
* Misrepresentation by users.

---

# 9. PROHIBITED ACTIVITIES

Users may not:

* Commit fraud.
* Misrepresent ownership.
* Impersonate individuals or organizations.
* Publish false information.
* Upload malicious software.
* Circumvent platform security.
* Engage in money laundering.
* Promote illegal activities.
* Infringe intellectual property rights.
* Harass, threaten, or abuse others.
* Manipulate prices or market activity.
* Create deceptive listings.

Neutron reserves the right to investigate suspected violations and take appropriate action.

---

# 10. INTELLECTUAL PROPERTY

The Neutron platform, including its software, features, design elements, interfaces, branding, logos, trademarks, and technology, is protected by applicable intellectual property laws.

Users may not:

* Copy.
* Modify.
* Reverse engineer.
* Redistribute.
* Commercially exploit.

any portion of Neutron without authorization.

---

# 11. IDENTITY AND OWNERSHIP VERIFICATION

Neutron may request verification documents at any time, including:

* Government-issued identification.
* Ownership records.
* Corporate documents.
* Supporting evidence relating to listings.

Failure to provide requested information may result in restrictions, removal of listings, or account suspension.

---

# 12. CONTENT MODERATION

Neutron reserves the right to:

* Remove content.
* Remove listings.
* Restrict visibility.
* Suspend accounts.
* Permanently ban users.

where content or activity appears unlawful, misleading, harmful, fraudulent, abusive, or otherwise inconsistent with these Terms.

---

# 13. PRIVACY

By using Neutron, users consent to the collection, storage, processing, and use of information necessary for platform functionality, security, moderation, and improvement.

Additional privacy practices may be described in a separate Privacy Policy.

---

# 14. DISCLAIMER OF WARRANTIES

Neutron is provided on an "AS IS" and "AS AVAILABLE" basis.

Neutron makes no warranties regarding:

* Availability.
* Reliability.
* Security.
* Accuracy.
* Completeness.
* Performance.
* Suitability for any purpose.

Use of the platform is entirely at the user's own risk.

---

# 15. LIMITATION OF LIABILITY

To the maximum extent permitted by law, Neutron and its founders, developers, administrators, affiliates, and representatives shall not be liable for:

* Financial losses.
* Investment losses.
* Property losses.
* Business losses.
* Lost profits.
* Lost opportunities.
* Data loss.
* Reputation damage.
* User disputes.
* Transaction failures.

Users assume all risks associated with platform use.

---

# 16. INDEMNIFICATION

Users agree to defend, indemnify, and hold harmless Neutron and its operators from claims, liabilities, damages, losses, costs, and expenses arising from:

* User conduct.
* User content.
* Transactions.
* Violations of these Terms.
* Violations of law.
* Intellectual property disputes.

---

# 17. ACCOUNT SUSPENSION AND TERMINATION

Neutron may suspend, restrict, or terminate any account at any time if:

* Terms are violated.
* Fraud is suspected.
* Security concerns arise.
* Legal obligations require action.
* Platform integrity is threatened.

---

# 18. CHANGES TO THESE TERMS

Neutron may update these Terms at any time.

Continued use of the platform after changes become effective constitutes acceptance of the revised Terms.

---

# 19. GOVERNING LAW

These Terms shall be governed and interpreted in accordance with the laws of India.

Users agree that any legal dispute arising from the use of Neutron shall be resolved under applicable Indian law.

---

# 20. ACCEPTANCE OF TERMS

By creating an account, accessing, browsing, posting content, communicating with users, listing assets, participating in transactions, or otherwise using Neutron, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.`

function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '20px 0 10px' }}>{line.slice(2)}</h1>
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '16px 0 8px' }}>{line.slice(3)}</h2>
    if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />
    if (line.startsWith('* ')) return <li key={i} style={{ color: '#d1d5db', fontSize: 13, lineHeight: 1.7, marginLeft: 20 }}>{line.slice(2)}</li>
    if (line === '') return <br key={i} />
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>')
    return <p key={i} style={{ margin: '4px 0', fontSize: 13, color: '#d1d5db', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export default function TermsModal({ open, onClose, onAgree }) {
  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '640px', maxHeight: '80vh',
              background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={16} color="#00D2FF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>Terms & Conditions</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Please read carefully before proceeding</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}>
              {renderMarkdown(TERMS_TEXT)}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', gap: '10px', padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
            }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: '#9ca3af',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => { onAgree(); onClose() }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                I Agree
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
