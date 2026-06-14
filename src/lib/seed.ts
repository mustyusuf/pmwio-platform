import { prisma } from "@/lib/db";
import { hashPassword, generateReference } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

const DEMO_PASSWORD = "Password123";
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/** Wipes all data and inserts a coherent demo dataset. Returns login credentials. */
export async function seedDatabase() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentApproval.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.document.deleteMany();
  await prisma.termReport.deleteMany();
  await prisma.application.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.project.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  const hash = await hashPassword(DEMO_PASSWORD);
  const mk = (name: string, email: string, role: string, userId: string, country?: string) =>
    prisma.user.create({ data: { name, email, role, userId, country, passwordHash: hash } });

  // Quorum: 2 of the board and 2 of the executives must approve. Empowerment open.
  await prisma.settings.create({ data: { id: "singleton", boardQuorum: 2, executiveQuorum: 2, empowermentOpen: true } });

  const exec1 = await mk("Prof. H. T. Yusuf", "executive@pmwio.org", ROLES.EXECUTIVE, "PMW-EXEC01");
  const exec2 = await mk("Dr. Salamatu Bako", "executive2@pmwio.org", ROLES.EXECUTIVE, "PMW-EXEC02");
  const board1 = await mk("Hajiya Amina Lawal", "board@pmwio.org", ROLES.BOARD, "PMW-BOARD1");
  const board2 = await mk("Alhaji Musa Idris", "board2@pmwio.org", ROLES.BOARD, "PMW-BOARD2");
  const board3 = await mk("Hauwa Abubakar", "board3@pmwio.org", ROLES.BOARD, "PMW-BOARD3");
  const admin = await mk("Ibrahim Musa", "admin@pmwio.org", ROLES.ADMIN, "PMW-ADMIN1");
  const finance = await mk("Maryam Sule", "finance@pmwio.org", ROLES.FINANCE, "PMW-FIN001");
  const member1 = await mk("Aisha Bello", "member@pmwio.org", ROLES.MEMBER, "PMW-MEMB01", "Nigeria");
  const member2 = await mk("Fatima Sani", "member2@pmwio.org", ROLES.MEMBER, "PMW-MEMB02", "Ghana");
  const coordinator = await prisma.user.create({
    data: { name: "Sani Abdullahi", email: "coordinator@pmwio.org", role: ROLES.COORDINATOR, userId: "PMW-COORD1", country: "Nigeria", passwordHash: hash, states: JSON.stringify(["Kwara", "Oyo", "Lagos"]) },
  });

  const board = [board1, board2, board3];
  const execs = [exec1, exec2];
  const members = [member1, member2];

  const categories = ["SCHOLARSHIP", "EMPOWERMENT", "ORPHANAGE"] as const;
  const countries = ["Nigeria", "Ghana", "United Kingdom", "United States"];
  const names = [
    "Maryam Adamu", "Zainab Okeke", "Hauwa Danjuma", "Sadiq Aliyu", "Rukayya Bala",
    "Halima Yakubu", "Nafisa Garba", "Aliyu Sule", "Bilkisu Umar", "Suleiman Tijani",
    "Khadija Mohammed", "Umar Faruk", "Jamila Ahmed",
  ];

  // pay: how far an approved application's payment has progressed.
  type Spec = { status: string; day: number; pay?: "COMPLETED" | "PENDING_EXECUTIVE" | "PENDING_BOARD" | "NONE" };
  const specs: Spec[] = [
    { status: "APPROVED", day: 150, pay: "COMPLETED" },
    { status: "APPROVED", day: 120, pay: "COMPLETED" },
    { status: "APPROVED", day: 85, pay: "COMPLETED" },
    { status: "APPROVED", day: 50, pay: "PENDING_EXECUTIVE" },
    { status: "APPROVED", day: 25, pay: "PENDING_BOARD" },
    { status: "APPROVED", day: 8, pay: "NONE" },
    { status: "PENDING_EXECUTIVE", day: 16 },
    { status: "PENDING_EXECUTIVE", day: 11 },
    { status: "PENDING_BOARD", day: 9 },
    { status: "PENDING_BOARD", day: 6 },
    { status: "PENDING_REFEREE", day: 4 },
    { status: "PENDING_REFEREE", day: 2 },
    { status: "REFEREE_REJECTED", day: 40 },
  ];

  const credentials = [
    { role: "Executive", email: "executive@pmwio.org", userId: exec1.userId },
    { role: "Board Member", email: "board@pmwio.org", userId: board1.userId },
    { role: "Administrator", email: "admin@pmwio.org", userId: admin.userId },
    { role: "Finance Officer", email: "finance@pmwio.org", userId: finance.userId },
    { role: "State Coordinator", email: "coordinator@pmwio.org", userId: coordinator.userId },
    { role: "Member / Referee", email: "member@pmwio.org", userId: member1.userId },
  ];

  const amounts = [50000, 75000, 120000, 200000, 90000];

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const category = categories[i % categories.length];
    const country = countries[i % countries.length];
    // Scholarships are nominated by the State Coordinator; others by a Member.
    const referee = category === "SCHOLARSHIP" ? coordinator : members[i % members.length];
    const name = names[i];
    const createdAt = daysAgo(s.day);
    const amount = amounts[i % amounts.length];

    const beneficiary = await prisma.user.create({
      data: {
        name, email: `beneficiary${i + 1}@example.com`, role: ROLES.BENEFICIARY,
        userId: `PMW-BEN${String(i + 1).padStart(3, "0")}`, country, passwordHash: hash, createdAt,
      },
    });

    const [firstName, ...rest] = name.split(" ");
    const lastName = rest.join(" ") || "—";
    const formData = JSON.stringify({
      firstName, lastName,
      guardianName: `${["Mr.", "Mrs."][i % 2]} ${lastName}`,
      guardianRelationship: i % 2 === 0 ? "Father" : "Mother",
      guardianPhone: "+234801234567" + (i % 10),
      nin: `${10000000000 + i * 137}`,
      address: `${10 + i} Demo Street, ${country}`,
      ...(category === "SCHOLARSHIP"
        ? {
            schoolName: "Government Secondary School", schoolClass: `JSS${(i % 3) + 1}`, academicYear: "2025/2026",
            state: ["Kwara", "Oyo", "Lagos", "Ogun", "Osun"][i % 5],
            term: "First term 2025/2026",
            schoolType: ["Primary", "Secondary"][i % 2],
            schoolOwnership: ["Public", "Federal", "State"][i % 3],
            studentCategory: i % 2 === 0 ? "Brilliant" : "Needy",
          }
        : {}),
      ...(category === "ORPHANAGE"
        ? { classType: ["Primary", "Secondary", "Tertiary"][i % 3], need: ["Clothing", "Health", "Feeding", "Tuition", "Stipends"][i % 5] }
        : {}),
    });

    const app = await prisma.application.create({
      data: {
        reference: generateReference(),
        category, status: s.status,
        fullName: name, email: beneficiary.email, country,
        details: `Requesting ${category.toLowerCase()} support. Demo application #${i + 1}.`,
        formData,
        referredByCode: referee.userId, referredById: referee.id, beneficiaryId: beneficiary.id,
        boardRecommendation: ["PENDING_EXECUTIVE", "APPROVED", "REJECTED"].includes(s.status) ? "APPROVE" : null,
        amountRequested: s.status === "APPROVED" ? amount : null,
        ...(category === "SCHOLARSHIP" && s.status === "APPROVED"
          ? { scholarshipStart: daysAgo(s.day), scholarshipEnd: daysAhead(180) }
          : {}),
        createdAt, updatedAt: createdAt,
      },
    });

    const review = (reviewerId: string, role: string, recommendation: string, comment: string, dayOffset: number) =>
      prisma.review.create({ data: { applicationId: app.id, reviewerId, reviewerRole: role, recommendation, comment, createdAt: daysAgo(s.day - dayOffset) } });

    if (s.status === "REFEREE_REJECTED") {
      await review(referee.id, "REFEREE", "REJECT", "Unable to confirm I know this applicant.", 0);
    } else if (s.status !== "PENDING_REFEREE") {
      await review(referee.id, "REFEREE", "CONFIRM", "I personally know this beneficiary and can vouch for them.", 1);

      // Board votes
      if (s.status === "PENDING_BOARD") {
        await review(board1.id, "BOARD", "RECOMMEND_APPROVE", "Documents verified.", 1.5);
      } else {
        await review(board1.id, "BOARD", "RECOMMEND_APPROVE", "Documents verified.", 2);
        await review(board2.id, "BOARD", "RECOMMEND_APPROVE", "Assessment complete; recommend approval.", 2.2);
      }

      // Executive votes
      if (s.status === "PENDING_EXECUTIVE") {
        await review(exec1.id, "EXECUTIVE", "APPROVE", "Supportive — awaiting second executive.", 2.5);
      } else if (s.status === "APPROVED") {
        await review(exec1.id, "EXECUTIVE", "APPROVE", "Approved.", 3);
        await review(exec2.id, "EXECUTIVE", "APPROVE", "Concur — approved.", 3.2);
      } else if (s.status === "REJECTED") {
        await review(exec1.id, "EXECUTIVE", "REJECT", "Does not meet criteria.", 3);
        await review(exec2.id, "EXECUTIVE", "REJECT", "Agree, reject.", 3.2);
      }
    }

    // Payments for approved applications.
    if (s.status === "APPROVED" && s.pay && s.pay !== "NONE") {
      const pay = await prisma.payment.create({
        data: {
          applicationId: app.id, amount, method: "Bank transfer", reference: `TRF-${app.reference}`,
          createdById: finance.id,
          status: s.pay,
          approvedById: s.pay === "COMPLETED" ? exec1.id : null,
          createdAt: daysAgo(s.day - 4),
          paidAt: s.pay === "COMPLETED" ? daysAgo(s.day - 6) : null,
        },
      });
      const pa = (approverId: string, role: string, decision: string, d: number) =>
        prisma.paymentApproval.create({ data: { paymentId: pay.id, approverId, role, decision, createdAt: daysAgo(s.day - d) } });

      if (s.pay === "PENDING_BOARD") {
        await pa(board1.id, "BOARD", "APPROVE", 4.5);
      } else if (s.pay === "PENDING_EXECUTIVE") {
        await pa(board1.id, "BOARD", "APPROVE", 4.5);
        await pa(board2.id, "BOARD", "APPROVE", 4.6);
      } else if (s.pay === "COMPLETED") {
        await pa(board1.id, "BOARD", "APPROVE", 5);
        await pa(board2.id, "BOARD", "APPROVE", 5.1);
        await pa(exec1.id, "EXECUTIVE", "APPROVE", 5.5);
        await pa(exec2.id, "EXECUTIVE", "APPROVE", 5.6);
      }
    }

    if (i % 2 === 0) {
      await prisma.document.create({ data: { applicationId: app.id, name: "National ID", type: "Identification", reference: "id-card.pdf", submittedAt: createdAt } });
      await prisma.document.create({ data: { applicationId: app.id, name: category === "SCHOLARSHIP" ? "School result" : "Support letter", type: "Supporting", reference: "doc.pdf", submittedAt: createdAt } });
    }
  }

  // A member's empowerment application (members-only), pending board review.
  const empApp = await prisma.application.create({
    data: {
      reference: generateReference(),
      category: "EMPOWERMENT",
      status: "PENDING_BOARD",
      fullName: member1.name,
      email: member1.email,
      phone: "+2348100000001",
      country: member1.country,
      details: "Capital to expand my tailoring business.",
      amountRequested: 180000,
      formData: JSON.stringify({
        purpose: "Expand my tailoring business",
        coverLetter: "I have run a small tailoring stall for three years and want to buy two more machines and train two apprentices.",
        whyNeeded: "Demand has outgrown my single machine and I am turning away orders.",
        sustainabilityPlan: "Profits from increased output will cover running costs and repay into the community fund.",
      }),
      referredByCode: member2.userId,
      referredById: member2.id, // optional endorsing member
      beneficiaryId: member1.id,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  });
  await prisma.review.create({ data: { applicationId: empApp.id, reviewerId: board1.id, reviewerRole: "BOARD", recommendation: "RECOMMEND_APPROVE", comment: "Strong, viable plan.", createdAt: daysAgo(3) } });

  await prisma.project.createMany({
    data: [
      { name: "2026 Public-School Scholarship Drive", category: "SCHOLARSHIP", status: "ACTIVE", startDate: daysAgo(90) },
      { name: "Widows Empowerment Cohort 4", category: "EMPOWERMENT", status: "ACTIVE", startDate: daysAgo(45) },
      { name: "Orphan Care Home — Kano", category: "ORPHANAGE", status: "ACTIVE", startDate: daysAgo(200) },
      { name: "Ramadan Food Distribution", category: "EMPOWERMENT", status: "COMPLETED", startDate: daysAgo(120) },
    ],
  });
  await prisma.activity.createMany({
    data: [
      { title: "Board review meeting", date: daysAhead(5), location: "Abuja HQ" },
      { title: "Scholarship award ceremony", date: daysAhead(20), location: "Kano" },
      { title: "Empowerment skills workshop", date: daysAhead(12), location: "Accra" },
    ],
  });
  await prisma.activityLog.create({ data: { userId: admin.id, action: "SYSTEM_SEEDED", detail: "Demo data loaded" } });

  // Demo term reports from the coordinator on approved scholarship beneficiaries.
  const approvedScholarships = await prisma.application.findMany({ where: { category: "SCHOLARSHIP", status: "APPROVED" }, take: 3 });
  for (let i = 0; i < approvedScholarships.length; i++) {
    const a = approvedScholarships[i];
    await prisma.termReport.create({
      data: {
        applicationId: a.id, coordinatorId: coordinator.id,
        session: "2025/2026", term: ["First term", "Second term"][i % 2],
        position: 2 + i, classSize: 34,
        performance: "Strong and consistent performance this term; punctual, attentive and actively participates in class.",
        createdAt: daysAgo(20),
      },
    });
  }

  // A couple of admin-defined custom form fields (form builder demo).
  await prisma.formField.createMany({
    data: [
      { category: "SCHOLARSHIP", label: "Parent / guardian occupation", name: "parentOccupation", type: "text", required: false, order: 1 },
      { category: "ORPHANAGE", label: "Any special needs?", name: "specialNeeds", type: "textarea", required: false, order: 1 },
      { category: "ALL", label: "How did you hear about us?", name: "referralSource", type: "select", options: JSON.stringify(["Friend", "Social media", "Religious leader", "Other"]), required: false, order: 1 },
    ],
  });

  return { password: DEMO_PASSWORD, credentials };
}
