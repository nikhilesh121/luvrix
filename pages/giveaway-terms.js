import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import { FiShield, FiArrowLeft } from "react-icons/fi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default function GiveawayTerms() {
  return (
    <Layout title="Giveaway Terms & Conditions" description="Read the official rules and terms for Luvrix giveaways.">
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/giveaway-terms`} />
      </Head>

      <div className="min-h-screen bg-white dark:bg-gray-900 py-12 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/giveaway" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 inline-flex items-center gap-1">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to Giveaways
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
              <FiShield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Giveaway Terms & Conditions</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: February 2026</p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Free Entry</h2>
              <p>
                Participation in all Luvrix giveaways is completely free. No purchase, payment, or monetary
                contribution of any kind is required to enter, participate, or be eligible for any giveaway.
                There is no fee to join, and no payment will ever increase your chances of winning.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. No Purchase Required</h2>
              <p>
                No purchase is necessary to enter or win any giveaway hosted on Luvrix. Any optional support
                features available on the platform are entirely separate from giveaway participation and do
                not affect eligibility, entry, or chances of winning in any way.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Task-Based Eligibility</h2>
              <p>
                Certain giveaways may require participants to complete specific tasks (such as visiting a page,
                following an account, answering a quiz, or inviting friends) to become eligible for the prize
                drawing. These tasks are always free to complete and are designed to ensure genuine engagement.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All tasks are free to complete</li>
                <li>Required tasks must be completed for eligibility</li>
                <li>Optional tasks earn additional points but are not mandatory</li>
                <li>Points determine eligibility, not ranking or advantage</li>
                <li>Meeting the required point threshold makes a participant eligible — all eligible participants have equal chances</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Random Winner Selection</h2>
              <p>
                Winners are selected randomly from the pool of eligible participants. The selection process
                is fair, unbiased, and does not favor any participant over another. All eligible participants
                have an equal chance of being selected as the winner.
              </p>
              <p>
                In some cases, an administrator may manually select a winner from the eligible pool. However,
                manual selection is restricted to eligible participants only, and all selections are logged
                in an immutable audit trail for transparency and accountability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Physical Prizes Only</h2>
              <p>
                All giveaway prizes are physical items only. Luvrix does not offer cash prizes, cash equivalents,
                gift cards with cash value, cryptocurrency, or any form of monetary reward through its
                giveaway system. Prize details are clearly stated on each giveaway page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Platform Discretion</h2>
              <p>
                Luvrix reserves the right to modify, suspend, or cancel any giveaway at its sole discretion,
                including but not limited to cases of suspected fraud, technical issues, or insufficient
                participation. In the event of cancellation, no prizes will be awarded and no liability
                shall be incurred by Luvrix.
              </p>
              <p>
                Luvrix also reserves the right to disqualify any participant who violates these terms,
                engages in fraudulent behavior, uses automated systems, or otherwise attempts to manipulate
                the giveaway process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Support Disclaimer</h2>
              <p>
                Supporting Luvrix through any optional contribution, donation, or premium feature does
                <strong> not</strong> affect your chances of winning any giveaway. Support is entirely
                optional and separate from the giveaway system. Giveaway eligibility and winner selection
                are based solely on task completion and random selection.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. Data Usage</h2>
              <p>
                Participant data collected during giveaway participation (including name, email, and
                task completion records) is used solely for the purposes of administering the giveaway,
                verifying eligibility, and contacting winners. This data is handled in accordance with
                our <Link href="/privacy" className="text-purple-600 dark:text-purple-400 underline">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Eligibility</h2>
              <p>
                Giveaways are open to registered users of Luvrix. Participants must have a valid account
                and comply with all applicable laws and regulations in their jurisdiction. Luvrix giveaways
                are designed to be compliant with Indian law and applicable international regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. Contact</h2>
              <p>
                For questions about giveaway terms, eligibility, or prize delivery, please contact us
                through our <Link href="/contact" className="text-purple-600 dark:text-purple-400 underline">Contact Page</Link>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              By participating in any Luvrix giveaway, you agree to these terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
