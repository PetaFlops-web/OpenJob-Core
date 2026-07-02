/* eslint-disable no-console */
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { writeFileSync, mkdirSync } from "fs";

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5433,
  database: "openjob_db",
  user: "openjob",
  password: "openjob",
});

const PASSWORD = "password123";

function id(pfx) { return `${pfx}-${nanoid(16)}`; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); }

const RED_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

function makePDF(name, email, skills, experience) {
  const body = [
    `BT /F1 14 Tf 50 700 Td (CV: ${name}) Tj`,
    `0 -25 Td (Email: ${email}) Tj`,
    `0 -40 Td (SKILLS) Tj`,
    ...skills.map((s, i) => `0 -20 Td (${i + 1}. ${s}) Tj`),
    `0 -40 Td (PENGALAMAN) Tj`,
    ...experience.map((e, i) => `0 -20 Td (${i + 1}. ${e}) Tj`),
    `ET`,
  ].join("\n");

  const content = `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${body.length}>>stream
${body}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
0000000${(350 + body.length).toString().padStart(3, "0")} 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
${470 + body.length}
%%EOF`;

  return Buffer.from(content, "ascii");
}

const jobseekers = [
  {
    name: "Dimas Pratama", email: "dimas.pratama@email.com", phone: "0812-3456-7890",
    location: "Jakarta Selatan", bio: "Backend Developer 3 tahun. Spesialis Node.js, Express, PostgreSQL. Membangun sistem pembayaran digital untuk 500K+ pengguna.",
    skills: ["Node.js", "Express", "PostgreSQL", "TypeScript", "Docker", "Redis"],
    experience: ["PT Teknologi Nusantara - Backend Developer (2023-sekarang)", "CV Karya Mandiri - Junior Developer (2021-2023)"],
  },
  {
    name: "Siti Nurhaliza", email: "siti.nurhaliza@email.com", phone: "0856-7890-1234",
    location: "Bandung", bio: "UI/UX Designer. Spesialis design system dan accessibility. Portfolio 30+ proyek startup dan enterprise.",
    skills: ["Figma", "Adobe XD", "Design Systems", "User Research", "HTML/CSS", "Prototyping"],
    experience: ["PT Digital Solusi - UI/UX Designer (2022-sekarang)", "Freelance Designer (2020-2022)"],
  },
  {
    name: "Budi Santoso", email: "budi.santoso@email.com", phone: "0877-1234-5678",
    location: "Surabaya", bio: "Frontend Developer React dan Next.js. Kontributor open-source di 3 proyek.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GraphQL", "Jest"],
    experience: ["PT Digital Solusi - Frontend Developer (2023-sekarang)", "Startup ABC - Frontend Intern (2022)"],
  },
];

const recruiters = [
  { name: "Rina Wijaya", email: "rina.wijaya@email.com", phone: "0811-2233-4455", location: "Jakarta Pusat", bio: "HR Manager 7 tahun pengalaman tech recruitment." },
  { name: "Ahmad Hidayat", email: "ahmad.hidayat@email.com", phone: "0822-3344-5566", location: "Tangerang", bio: "Tech Lead & Hiring Manager di PT Digital Solusi." },
];

const companies = [
  { name: "PT Teknologi Nusantara", location: "Jakarta", description: "Perusahaan teknologi terkemuka fokus solusi digital enterprise. Berdiri 2015, melayani 200+ klien di seluruh Indonesia.", website: "https://teknologi-nusantara.co.id", industry: "Teknologi", company_size: "51-200", email: "hr@teknologi-nusantara.co.id", founded_year: 2015, owner_idx: 0 },
  { name: "CV Karya Mandiri", location: "Bandung", description: "Studio kreatif spesialis UI/UX design, branding, dan web development. Klien dari startup hingga BUMN.", website: "https://karya-mandiri.com", industry: "Desain", company_size: "11-50", email: "hello@karya-mandiri.com", founded_year: 2018, owner_idx: 0 },
  { name: "PT Digital Solusi", location: "Surabaya", description: "IT consulting spesialis cloud infrastructure, DevOps, dan software development. Partner resmi AWS dan Google Cloud.", website: "https://digital-solusi.id", industry: "Teknologi", company_size: "11-50", email: "career@digital-solusi.id", founded_year: 2020, owner_idx: 1 },
];

const categoryNames = ["Teknologi", "Keuangan", "Pendidikan", "Kesehatan", "Desain", "Marketing"];

const jobTemplates = [
  { company_idx: 0, title: "Backend Developer", description: "Backend Developer untuk membangun REST API scalable. Node.js, Express, PostgreSQL.\n\nTanggung jawab:\n- Merancang REST API\n- Menulis unit test dan integration test\n- Code review dan mentoring\n- Optimasi performa database", job_type: "full-time", experience_level: "mid", location_type: "hybrid", location_city: "Jakarta", salary_min: 12000000, salary_max: 20000000, status: "open", requirements: ["Node.js", "Express", "PostgreSQL", "REST API", "Git"], benefits: ["BPJS", "Remote 2 hari/minggu", "MacBook Pro", "Budget belajar 10jt/tahun"] },
  { company_idx: 0, title: "DevOps Engineer", description: "DevOps Engineer untuk kelola infrastruktur AWS dengan Terraform.\n\nTanggung jawab:\n- Infrastruktur AWS\n- CI/CD pipeline\n- Monitoring Prometheus/Grafana\n- Incident response", job_type: "full-time", experience_level: "senior", location_type: "remote", location_city: null, salary_min: 18000000, salary_max: 30000000, status: "open", requirements: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"], benefits: ["BPJS", "Fully remote", "Laptop spek tinggi", "Equity"] },
  { company_idx: 1, title: "UI/UX Designer", description: "UI/UX Designer untuk mendesain antarmuka web dan mobile apps.\n\nTanggung jawab:\n- User research dan usability testing\n- Wireframe, prototype, high-fidelity design\n- Design system\n- Kolaborasi dengan developer", job_type: "full-time", experience_level: "mid", location_type: "onsite", location_city: "Bandung", salary_min: 8000000, salary_max: 15000000, status: "open", requirements: ["Figma", "Design Systems", "User Research", "Prototyping"], benefits: ["BPJS", "Snack & kopi gratis", "Tim kreatif", "Flexible hours"] },
  { company_idx: 1, title: "Graphic Designer", description: "Graphic Designer untuk branding dan social media.\n\nTanggung jawab:\n- Aset visual social media\n- Branding dan logo\n- Marketing collateral\n- Kolaborasi tim konten", job_type: "part-time", experience_level: "entry", location_type: "remote", location_city: null, salary_min: 3000000, salary_max: 6000000, status: "open", requirements: ["Adobe Illustrator", "Photoshop", "Branding", "Typography"], benefits: ["Remote", "Jam kerja fleksibel", "Portfolio building"] },
  { company_idx: 2, title: "Frontend Developer", description: "Frontend Developer React dan Next.js.\n\nTanggung jawab:\n- Fitur frontend React/Next.js\n- Responsive design\n- Unit test Jest\n- Code review", job_type: "full-time", experience_level: "mid", location_type: "hybrid", location_city: "Surabaya", salary_min: 10000000, salary_max: 18000000, status: "open", requirements: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Jest"], benefits: ["BPJS", "Hybrid working", "Laptop", "Learning budget"] },
  { company_idx: 2, title: "Data Analyst", description: "Data Analyst untuk membantu keputusan berbasis data.\n\nTanggung jawab:\n- Analisis user behavior\n- Dashboard dan report\n- A/B testing\n- Presentasi ke stakeholders", job_type: "full-time", experience_level: "mid", location_type: "onsite", location_city: "Surabaya", salary_min: 9000000, salary_max: 16000000, status: "open", requirements: ["SQL", "Python", "Excel", "Data Visualization"], benefits: ["BPJS", "Bonus tahunan", "Training"] },
];

async function seed() {
  console.log("🌱 Seeding database...\n");

  mkdirSync("src/profile/uploads", { recursive: true });
  mkdirSync("src/companies/uploads", { recursive: true });
  mkdirSync("src/documents/pdf", { recursive: true });

  const hash = await bcrypt.hash(PASSWORD, 10);

  const jobseekerUsers = [];
  const recruiterUsers = [];

  for (const js of jobseekers) {
    const uid = id("user");
    const avatarPath = `src/profile/uploads/${uid}.png`;
    writeFileSync(avatarPath, RED_PNG);
    await pool.query(
      `INSERT INTO users(id, name, email, password, role, phone, location, bio, avatar, mfa_enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [uid, js.name, js.email, hash, "jobseeker", js.phone, js.location, js.bio, avatarPath, false]
    );
    jobseekerUsers.push({ ...js, id: uid });

    for (const skill of js.skills) {
      await pool.query(
        `INSERT INTO user_skills(id, user_id, name, created_at, updated_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT (user_id, name) DO NOTHING`,
        [id("skill"), uid, skill, daysAgo(30), daysAgo(30)]
      );
    }

    await pool.query(
      `INSERT INTO notification_preferences(user_id, email_application, email_interview, push_application, push_interview, websocket_enabled) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id) DO NOTHING`,
      [uid, true, true, true, true, true]
    );
  }

  for (const r of recruiters) {
    const uid = id("user");
    const avatarPath = `src/profile/uploads/${uid}.png`;
    writeFileSync(avatarPath, RED_PNG);
    await pool.query(
      `INSERT INTO users(id, name, email, password, role, phone, location, bio, avatar, mfa_enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [uid, r.name, r.email, hash, "recruiter", r.phone, r.location, r.bio, avatarPath, false]
    );
    recruiterUsers.push({ ...r, id: uid });
  }

  console.log(`  3 jobseeker, 2 recruiter`);

  const catIds = [];
  for (const name of categoryNames) {
    const cid = id("category");
    await pool.query(`INSERT INTO categories(id, name) VALUES($1,$2)`, [cid, name]);
    catIds.push(cid);
  }
  console.log(`  6 categories`);

  const createdCompanies = [];
  for (const c of companies) {
    const cid = id("company");
    const owner = recruiterUsers[c.owner_idx];
    const logoPath = `src/companies/uploads/${cid}.png`;
    writeFileSync(logoPath, RED_PNG);
    await pool.query(
      `INSERT INTO companies(id, name, location, description, user_id, website, industry, company_size, logo_url, email, founded_year) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [cid, c.name, c.location, c.description, owner.id, c.website, c.industry, c.company_size, logoPath, c.email, c.founded_year]
    );
    createdCompanies.push({ id: cid, owner_id: owner.id, ...c });
  }
  console.log(`  3 companies`);

  const createdJobs = [];
  for (const j of jobTemplates) {
    const jid = id("job");
    const co = createdCompanies[j.company_idx];
    const cat = catIds[j.company_idx % catIds.length];
    await pool.query(
      `INSERT INTO jobs(id, company_id, category_id, title, description, job_type, experience_level, location_type, location_city, salary_min, salary_max, is_salary_visible, status, requirements, benefits, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())`,
      [jid, co.id, cat, j.title, j.description, j.job_type, j.experience_level, j.location_type, j.location_city, j.salary_min, j.salary_max, true, j.status, JSON.stringify(j.requirements), JSON.stringify(j.benefits)]
    );
    createdJobs.push({ id: jid, ...j, company_id: co.id });
  }
  console.log(`  6 jobs`);

  const createdDocs = [];
  for (const js of jobseekerUsers) {
    const did = id("document");
    const pdfPath = `src/documents/pdf/${did}.pdf`;
    const pdf = makePDF(js.name, js.email, js.skills, js.experience);
    writeFileSync(pdfPath, pdf);

    await pool.query(
      `INSERT INTO documents(id, file_url, user_id) VALUES($1,$2,$3)`,
      [did, pdfPath, js.id]
    );

    const atsScore = parseFloat((65 + Math.random() * 25).toFixed(2));
    await pool.query(
      `INSERT INTO cv_analysis(id, document_id, user_id, ats_score, skills, experience_years, education_level, raw_text, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id("cv-analysis"), did, js.id, atsScore, JSON.stringify(js.skills), js.skills.length, "Bachelor", "CV content for " + js.name, daysAgo(14)]
    );
    createdDocs.push({ id: did, user_id: js.id, ats_score: atsScore });
  }
  console.log(`  3 documents + ATS scans`);

  const createdApps = [];
  for (let i = 0; i < jobseekerUsers.length; i++) {
    const js = jobseekerUsers[i];
    const doc = createdDocs[i];
    const j1 = createdJobs[i * 2 % createdJobs.length];
    const j2 = createdJobs[(i * 2 + 1) % createdJobs.length];

    for (const [idx, job] of [j1, j2].entries()) {
      const aid = id("application");
      const useDoc = idx === 0 ? doc.id : null;
      const atsScore = idx === 0 ? doc.ats_score : null;
      const status = idx === 0 ? "reviewed" : "pending";

      await pool.query(
        `INSERT INTO application(id, job_id, user_id, status, document_id, ats_score, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [aid, job.id, js.id, status, useDoc, atsScore, daysAgo(14 - idx * 4), daysAgo(14 - idx * 4)]
      );
      createdApps.push({ id: aid, user_id: js.id, job_id: job.id, company_id: job.company_id, status });
    }
  }
  console.log(`  6 applications`);

  const interviewConfigs = [
    { appIdx: 0, status: "scheduled", offset: 3 },
    { appIdx: 1, status: "completed", offset: -5 },
    { appIdx: 2, status: "scheduled", offset: 2 },
    { appIdx: 3, status: "cancelled", offset: -1 },
  ];
  for (const cfg of interviewConfigs) {
    const app = createdApps[cfg.appIdx];
    const co = createdCompanies.find(c => c.id === app.company_id);
    const intId = id("interview");
    const scheduledAt = cfg.offset > 0 ? daysFromNow(cfg.offset) : daysAgo(Math.abs(cfg.offset));

    await pool.query(
      `INSERT INTO interviews(id, application_id, company_id, user_id, job_id, scheduled_at, duration_minutes, timezone, interview_type, meeting_link, meeting_platform, status, notes, reminder_sent, created_by, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [intId, app.id, app.company_id, app.user_id, app.job_id, scheduledAt, 60, "Asia/Jakarta", "video", "https://meet.google.com/abc-defg-hij", "gmeet", cfg.status, cfg.status === "scheduled" ? "Mohon konfirmasi kehadiran via aplikasi." : cfg.status === "completed" ? "Interview berjalan lancar. Kandidat qualified." : "Dibatalkan oleh kandidat.", false, co.owner_id, daysAgo(8), daysAgo(8)]
    );
  }
  console.log(`  4 interviews (2 scheduled, 1 completed, 1 cancelled)`);

  for (const js of jobseekerUsers) {
    for (let i = 0; i < 2; i++) {
      const job = createdJobs[(i + jobseekerUsers.indexOf(js)) % createdJobs.length];
      await pool.query(
        `INSERT INTO bookmark(id, job_id, user_id) VALUES($1,$2,$3)`,
        [id("bookmark"), job.id, js.id]
      );
    }
  }
  console.log(`  6 bookmarks`);

  const notifTemplates = [
    { type: "application_update", title: "Lamaran Diterima", message: "Selamat! Lamaran Anda telah diterima. Tim akan menghubungi Anda segera." },
    { type: "interview_scheduled", title: "Interview Dijadwalkan", message: "Interview telah dijadwalkan. Silakan cek detail di halaman interview." },
    { type: "application_update", title: "Lamaran Direview", message: "Lamaran Anda sedang direview oleh recruiter. Harap tunggu." },
  ];
  for (const js of jobseekerUsers) {
    for (let i = 0; i < 3; i++) {
      const t = notifTemplates[i];
      const job = createdJobs[createdApps.find(a => a.user_id === js.id)?.job_id] || createdJobs[i];
      await pool.query(
        `INSERT INTO notifications(id, user_id, type, title, message, data, read, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id("notification"), js.id, t.type, t.title, t.message, JSON.stringify({ job_id: job.id }), i === 0, daysAgo(10 - i)]
      );
    }
  }
  console.log(`  9 notifications`);

  await pool.end();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed Selesai");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✉️  Login (password: password123):");
  console.log("   Jobseeker:  dimas.pratama@email.com");
  console.log("   Jobseeker:  siti.nurhaliza@email.com");
  console.log("   Jobseeker:  budi.santoso@email.com");
  console.log("   Recruiter:  rina.wijaya@email.com");
  console.log("   Recruiter:  ahmad.hidayat@email.com");
  console.log("\n📊  Data:");
  console.log("   3 jobseeker, 2 recruiter");
  console.log("   6 categories, 3 companies");
  console.log("   6 jobs, 6 applications");
  console.log("   3 documents + ATS scans");
  console.log("   4 interviews, 6 bookmarks, 9 notifications");
  console.log("");
}

seed().catch(e => { console.error(e); process.exit(1); });