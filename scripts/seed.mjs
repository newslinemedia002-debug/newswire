// Newswire seed: admin user, storage bucket, sample published articles.
// Run: node scripts/seed.mjs   (reads .env.local from the project root)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(file) {
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

const env = loadEnv(join(root, '.env.local'))
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ADMIN_EMAIL = 'newslinemedia002@gmail.com'
const ADMIN_PASSWORD = '123456'
const ADMIN_NAME = 'Newswire Admin'

async function ensureAdmin() {
  let userId = null
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listErr) throw listErr
  const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL)
  if (existing) {
    userId = existing.id
    // make sure the password is the expected one on re-runs
    await admin.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD, email_confirm: true })
    console.log('admin user already existed, password reset to expected value')
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    })
    if (error) throw error
    userId = data.user.id
    console.log('admin user created')
  }

  const { error: profErr } = await admin
    .from('profiles')
    .update({ role: 'admin', full_name: ADMIN_NAME, email: ADMIN_EMAIL })
    .eq('id', userId)
  if (profErr) throw profErr
  return userId
}

async function ensureBucket() {
  const { error } = await admin.storage.createBucket('covers', { public: true })
  if (error && !/already exists/i.test(error.message)) throw error
  console.log('storage bucket "covers" ready')
}

const SAMPLE = [
  {
    title: 'Kenya Leads East Africa in Digital Newsroom Transformation',
    slug: 'kenya-leads-east-africa-digital-newsroom-transformation',
    category: 'kenya',
    excerpt:
      'From Nairobi to Mombasa, publishers are rebuilding how news reaches millions of readers, with mobile-first newsrooms setting the pace across the region.',
    content: `Nairobi has become the hub of a sweeping digital transformation in East African media, with newsrooms investing heavily in mobile-first publishing, data journalism and audience platforms.

Editors say the shift accelerated as readers moved decisively to smartphones, pushing outlets to rethink everything from breaking news alerts to long-form investigations.

"We are no longer adapting television bulletins for the web. We are building for the reader who opens a story on a two-inch screen during the morning commute," one senior editor at a Nairobi daily said.

Industry analysts note that the change has also opened doors for smaller, independent outlets, who can now reach national audiences without the printing and distribution costs that once favoured established players.

Training remains the biggest challenge, with many organisations running internal programmes to upskill reporters in video basics, analytics and digital verification.

Despite the hurdles, the consensus across the industry is clear: the newsroom of the future in Kenya is already here, and it is being written on mobile screens.`,
    cover_image_url: '/covers/lead.jpg',
    is_featured: true,
    is_breaking: false,
  },
  {
    title: 'Global Markets Rally as Central Banks Signal Rate Cuts',
    slug: 'global-markets-rally-central-banks-signal-rate-cuts',
    category: 'world',
    excerpt:
      'Stocks climbed worldwide after policymakers in Europe and North America hinted that the tightening cycle is finally coming to an end.',
    content: `Global equity markets surged after senior central bank officials signalled that interest rate cuts could arrive sooner than investors had expected.

Shares in banking, property and technology sectors led the gains, while government bonds sold off as traders repriced their expectations for the year ahead.

The rally followed a string of cooler inflation readings across major economies, which have eased pressure on policymakers to keep borrowing costs at multi-year highs.

Analysts cautioned that markets remain sensitive to employment data and energy prices, either of which could delay the easing cycle.

For households, the shift eventually feeds into mortgage rates, savings returns and the cost of borrowing for businesses planning expansion.

The next central bank meetings in London, Frankfurt and Washington are now expected to set the tone for the remainder of the trading year.`,
    cover_image_url: '/covers/world.jpg',
    is_featured: false,
    is_breaking: true,
  },
  {
    title: 'Nairobi Startups Attract Record Venture Funding',
    slug: 'nairobi-startups-attract-record-venture-funding',
    category: 'business',
    excerpt:
      'Kenyan technology startups closed a bumper quarter as investors chased fintech, logistics and climate-tech ventures across the region.',
    content: `Nairobi's technology ecosystem has booked its strongest quarter yet, with startups raising record levels of venture funding across fintech, logistics and climate technology.

Investors point to Kenya's young, connected population and the success of mobile money as a foundation that continues to attract both local and international capital.

Firms focused on payments and lending led the funding tables, followed by companies building supply-chain tools for small traders and agricultural cooperatives.

Founders say the environment is becoming more disciplined, with investors asking tougher questions about path to profitability rather than growth at any cost.

The ripple effect is being felt in the job market, where demand for software engineers, product designers and data analysts continues to outstrip supply.

Industry bodies have called on policymakers to keep the regulatory environment predictable so that the momentum in fundraising is not lost.`,
    cover_image_url: '/covers/business.jpg',
    is_featured: false,
    is_breaking: false,
  },
]

async function ensureArticles(authorId) {
  for (const a of SAMPLE) {
    const { data: found, error: findErr } = await admin
      .from('articles')
      .select('id')
      .eq('slug', a.slug)
      .maybeSingle()
    if (findErr) throw findErr
    const row = {
      ...a,
      author_id: authorId,
      author_name: ADMIN_NAME,
      status: 'published',
      published_at: new Date().toISOString(),
    }
    if (found) {
      const { error } = await admin.from('articles').update(row).eq('id', found.id)
      if (error) throw error
      console.log('updated article:', a.slug)
    } else {
      const { error } = await admin.from('articles').insert(row)
      if (error) throw error
      console.log('inserted article:', a.slug)
    }
  }
  // ensure exactly one featured + one breaking
  await admin.from('articles').update({ is_featured: false }).neq('slug', SAMPLE[0].slug)
  await admin.from('articles').update({ is_breaking: false }).neq('slug', SAMPLE[1].slug)
}

try {
  const adminId = await ensureAdmin()
  console.log('admin profile role set (id ' + adminId + ')')
  await ensureBucket()
  await ensureArticles(adminId)
  console.log('SEED COMPLETE')
} catch (e) {
  console.error('SEED FAILED:', e.message || e)
  process.exit(1)
}
