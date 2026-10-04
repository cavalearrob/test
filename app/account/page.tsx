"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = { full_name: string; email: string };
type Study = {
  id: string;
  status: string;
  availability: string;
  endpoint_a_name: string;
  endpoint_b_name: string;
  frequency_band: string;
  licensed_channel_pairs: number;
  pricing_cents: number;
  currency: string;
  created_at: string;
  entitled: boolean;
};

function formatCents(cents: number, currency: string) {
  return `${currency === "USD" ? "$" : currency + " "}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  availability_checked: "Checked",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studies, setStudies] = useState<Study[] | null>(null);
  const justPaid = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "success";

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (!response.ok) { window.location.assign("/sign-in?return_to=/account"); return; }
      const body = (await response.json()) as { user: User };
      setUser(body.user);
    });
    fetch("/api/studies").then(async (response) => {
      if (!response.ok) return;
      const body = (await response.json()) as { studies: Study[] };
      setStudies(body.studies);
    });
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand">COORVANTA</Link>
        <p className="eyebrow">CUSTOMER WORKSPACE</p>
        <h1>{user ? `Welcome, ${user.full_name}.` : "Opening your workspace…"}</h1>
        <p>Start with a free availability review, then purchase the detailed link study only after a positive review.</p>
        <p style={{ marginTop: "1rem" }}><Link className="button full" href="/check-link">Start a free link review</Link></p>
        <p className="form-note">Need help first? <a href="mailto:sales@coorvanta.com?subject=Coorvanta%20pricing%20question">Ask Coorvanta Sales about pricing</a>.</p>
        {user && (
          <>
            <p>{user.email}</p>
            {justPaid && <p className="form-note"><b>Payment received.</b> This page updates once Coorvanta&apos;s payment webhook confirms it — refresh in a few seconds if the study below still shows &quot;Awaiting payment&quot;.</p>}
            <p>Your organization&rsquo;s included services unlock after its first verified purchase. Until then, link checks disclose only limited availability status.</p>

            <h2 style={{ marginTop: "1.5rem" }}>Your studies</h2>
            {studies === null && <p>Loading studies…</p>}
            {studies && studies.length === 0 && <p>No studies yet. Your free link review is the next step.</p>}
            {studies && studies.length > 0 && (
              <table className="studies-table">
                <thead>
                  <tr><th>Route</th><th>Band</th><th>Pairs</th><th>Price</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {studies.map((study) => (
                    <tr key={study.id}>
                      <td>{study.endpoint_a_name} → {study.endpoint_b_name}</td>
                      <td>{study.frequency_band}</td>
                      <td>{study.licensed_channel_pairs}</td>
                      <td>{formatCents(study.pricing_cents, study.currency)}</td>
                      <td>{study.entitled ? "Paid — detail unlocked" : (statusLabel[study.status] ?? study.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <form action="/api/auth/logout" method="post" style={{ marginTop: "1.5rem" }}><button className="button full">Sign out</button></form>
          </>
        )}
      </section>
    </main>
  );
}
