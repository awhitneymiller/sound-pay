"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const PAYMENT_CATEGORIES = [
  "Studio",
  "Travel",
  "Merch",
  "Equipment",
  "Live Shows",
  "Marketing",
  "Miscellaneous",
] as const;

const TODAY = "2026-04-30";

type Category = (typeof PAYMENT_CATEGORIES)[number];
type MemberStatus = "paid" | "pending" | "unpaid";
type PaymentStatus = MemberStatus;
type ViewKey = "dashboard" | "balances" | "expenses" | "payments" | "revenue" | "reports" | "members";
type ModalType = "expense" | "request" | "send" | "invite" | null;

type Member = {
  id: string;
  name: string;
  role: string;
  split: number;
  balance: number;
  isCurrentUser?: boolean;
};

type MemberRow = Member & {
  status: MemberStatus;
};

type Expense = {
  id: string;
  date: string;
  description: string;
  category: Category;
  paidBy: string;
  amount: number;
  status: "approved" | "review";
};

type Payment = {
  id: string;
  memberId: string;
  direction: "request" | "pay";
  amount: number;
  date: string;
  category: Category;
  status: PaymentStatus;
  receiptLabel: string;
  receiptNote: string;
};

type PaymentRow = Payment & {
  memberName: string;
};

type GigPayout = {
  id: string;
  gigTitle: string;
  venue: string;
  market: string;
  showDate: string;
  payoutDate: string;
  amount: number;
  payoutMethod: string;
};

type Activity = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  tone: "positive" | "negative" | "neutral";
};

type SnapshotItem = {
  id: string;
  text: string;
  tone: Activity["tone"];
};

type NavItem = {
  id: ViewKey;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

type PaymentFormState = {
  memberId: string;
  amount: string;
  category: Category;
  date: string;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { id: "balances", label: "Balances", icon: BalanceIcon },
  { id: "expenses", label: "Expenses", icon: ExpenseIcon },
  { id: "payments", label: "Payments", icon: PaymentIcon },
  { id: "revenue", label: "Revenue", icon: RevenueIcon },
  { id: "reports", label: "Reports", icon: ReportIcon },
  { id: "members", label: "Members", icon: MembersIcon },
];

const initialMembers: Member[] = [
  { id: "m-1", name: "Roy Atlas", role: "Manager", split: 25, balance: 50, isCurrentUser: true },
  { id: "m-2", name: "Scott Miller", role: "Guitar", split: 25, balance: -100 },
  { id: "m-3", name: "Emerson Davis", role: "Merch", split: 25, balance: 50 },
  { id: "m-4", name: "Aiden Cole", role: "Drums", split: 25, balance: 0 },
];

const initialExpenses: Expense[] = [
  {
    id: "e-1",
    date: "2026-04-18",
    description: "Studio Rental",
    category: "Studio",
    paidBy: "Roy Atlas",
    amount: 150,
    status: "approved",
  },
  {
    id: "e-2",
    date: "2026-04-10",
    description: "Tour Van Fuel",
    category: "Travel",
    paidBy: "Aiden Cole",
    amount: 120,
    status: "approved",
  },
  {
    id: "e-3",
    date: "2026-04-04",
    description: "Merch Printing",
    category: "Merch",
    paidBy: "Emerson Davis",
    amount: 80,
    status: "review",
  },
  {
    id: "e-4",
    date: "2026-03-28",
    description: "Guitar Strings",
    category: "Equipment",
    paidBy: "Scott Miller",
    amount: 30,
    status: "approved",
  },
];

const initialPayments: Payment[] = [
  {
    id: "p-1",
    memberId: "m-2",
    direction: "request",
    amount: 100,
    date: "2026-04-26",
    category: "Merch",
    status: "pending",
    receiptLabel: "Venmo Request",
    receiptNote: "Merch table payout request sent after the Friday night set.",
  },
  {
    id: "p-2",
    memberId: "m-3",
    direction: "pay",
    amount: 50,
    date: "2026-04-19",
    category: "Studio",
    status: "unpaid",
    receiptLabel: "Bank Transfer Draft",
    receiptNote: "Studio reimbursement drafted for Emerson but not sent yet.",
  },
  {
    id: "p-3",
    memberId: "m-4",
    direction: "pay",
    amount: 40,
    date: "2026-04-12",
    category: "Travel",
    status: "paid",
    receiptLabel: "Fuel Reimbursement Receipt",
    receiptNote: "Tour van fuel repayment cleared with Aiden after rehearsal week.",
  },
];

const initialGigPayouts: GigPayout[] = [
  {
    id: "g-1",
    gigTitle: "Love On Tour Opener",
    venue: "Madison Square Garden",
    market: "New York, NY",
    showDate: "2026-04-25",
    payoutDate: "2026-04-28",
    amount: 1800,
    payoutMethod: "ACH",
  },
  {
    id: "g-2",
    gigTitle: "Short n' Sweet Tour Opener",
    venue: "The Forum",
    market: "Inglewood, CA",
    showDate: "2026-04-11",
    payoutDate: "2026-04-12",
    amount: 1450,
    payoutMethod: "Venue transfer",
  },
  {
    id: "g-3",
    gigTitle: "The Eras Tour Opening Set",
    venue: "Red Rocks Amphitheatre",
    market: "Morrison, CO",
    showDate: "2026-03-29",
    payoutDate: "2026-04-02",
    amount: 2200,
    payoutMethod: "Wire",
  },
  {
    id: "g-4",
    gigTitle: "Cowboy Carter Tour Opener",
    venue: "Hollywood Bowl",
    market: "Los Angeles, CA",
    showDate: "2026-03-15",
    payoutDate: "2026-03-18",
    amount: 950,
    payoutMethod: "ACH",
  },
];

const monthlyRevenue = [2200, 2500, 2880, 3400, 3100, 3600];
const monthlyExpenses = [1700, 1800, 1810, 1980, 2050, 1960];
const monthLabels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isIntroFading, setIsIntroFading] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRow | null>(null);
  const [activity, setActivity] = useState<Activity[]>([
    {
      id: "a-1",
      title: "Scott still owes you",
      detail: "Merch payout request went out on Apr 26",
      amount: 100,
      tone: "positive",
    },
    {
      id: "a-2",
      title: "Studio expense logged",
      detail: "Roy covered April rehearsal time for the band",
      amount: -150,
      tone: "neutral",
    },
    {
      id: "a-3",
      title: "Aiden paid you",
      detail: "Travel reimbursement is fully cleared",
      amount: 40,
      tone: "positive",
    },
  ]);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "Studio" as Category,
    amount: "",
    paidBy: "Roy Atlas",
    date: TODAY,
  });
  const [requestForm, setRequestForm] = useState<PaymentFormState>(() =>
    createPaymentForm(getDefaultRequestMemberId(initialMembers)),
  );
  const [sendForm, setSendForm] = useState<PaymentFormState>(() => createPaymentForm(getDefaultSendMemberId(initialMembers)));
  const [inviteForm, setInviteForm] = useState({
    name: "",
    role: "Bandmate",
    split: "25",
  });

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsIntroFading(true), 1000);
    const hideTimer = window.setTimeout(() => setShowIntro(false), 1700);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const currentUser = useMemo(
    () => members.find((member) => member.isCurrentUser) ?? members[0],
    [members],
  );

  const bandmates = useMemo(
    () => members.filter((member) => !member.isCurrentUser),
    [members],
  );

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const paymentRows = useMemo<PaymentRow[]>(
    () =>
      payments.map((payment) => ({
        ...payment,
        memberName: membersById.get(payment.memberId)?.name ?? "Bandmate",
      })),
    [membersById, payments],
  );

  const latestPaymentByMember = useMemo(() => {
    const lookup = new Map<string, PaymentRow>();

    paymentRows.forEach((payment) => {
      if (!lookup.has(payment.memberId)) {
        lookup.set(payment.memberId, payment);
      }
    });

    return lookup;
  }, [paymentRows]);

  const balanceRows = useMemo<MemberRow[]>(
    () =>
      bandmates.map((member) => ({
        ...member,
        status: getBandmateStatus(member, latestPaymentByMember),
      })),
    [bandmates, latestPaymentByMember],
  );

  const bandmateStatusById = useMemo(
    () => new Map(balanceRows.map((member) => [member.id, member.status])),
    [balanceRows],
  );

  const currentUserStatus: MemberStatus = useMemo(() => {
    const netBalance = balanceRows.reduce((sum, member) => sum - member.balance, 0);

    if (netBalance === 0) {
      return "paid";
    }

    return balanceRows.some((member) => member.status === "pending") ? "pending" : "unpaid";
  }, [balanceRows]);

  const memberRows = useMemo<MemberRow[]>(
    () =>
      members.map((member) => ({
        ...member,
        status: member.isCurrentUser ? currentUserStatus : bandmateStatusById.get(member.id) ?? "paid",
      })),
    [bandmateStatusById, currentUserStatus, members],
  );

  const totals = useMemo(() => {
    const youAreOwed = balanceRows
      .filter((member) => member.balance < 0)
      .reduce((sum, member) => sum + Math.abs(member.balance), 0);
    const youOwe = balanceRows
      .filter((member) => member.balance > 0)
      .reduce((sum, member) => sum + member.balance, 0);

    return {
      youAreOwed,
      youOwe,
      netBalance: youAreOwed - youOwe,
      recentExpensesLabel: `${expenses.length} logged`,
    };
  }, [balanceRows, expenses.length]);

  const snapshotItems = useMemo<SnapshotItem[]>(() => {
    const sorted = [...balanceRows].sort((left, right) => Math.abs(right.balance) - Math.abs(left.balance));

    return sorted.slice(0, 3).map((member) => ({
      id: member.id,
      text: describeMemberBalance(member),
      tone: member.balance < 0 ? "positive" : member.balance > 0 ? "negative" : "neutral",
    }));
  }, [balanceRows]);

  const closeModal = () => setActiveModal(null);

  const closeReceiptPreview = () => setSelectedReceipt(null);

  const openExpenseModal = () => {
    setExpenseForm({
      description: "",
      category: "Studio",
      amount: "",
      paidBy: currentUser?.name ?? "Roy Atlas",
      date: TODAY,
    });
    setActiveModal("expense");
  };

  const openRequestModal = () => {
    setRequestForm(createPaymentForm(getDefaultRequestMemberId(members)));
    setActiveModal("request");
  };

  const openSendModal = () => {
    setSendForm(createPaymentForm(getDefaultSendMemberId(members)));
    setActiveModal("send");
  };

  const openRequestForMember = (member: MemberRow) => {
    setRequestForm({
      memberId: member.id,
      amount: String(Math.abs(member.balance)),
      category: getSuggestedCategory(member.id, latestPaymentByMember),
      date: TODAY,
    });
    setActiveModal("request");
  };

  const openSendForMember = (member: MemberRow) => {
    setSendForm({
      memberId: member.id,
      amount: String(Math.abs(member.balance)),
      category: getSuggestedCategory(member.id, latestPaymentByMember),
      date: TODAY,
    });
    setActiveModal("send");
  };

  const addActivity = (title: string, detail: string, amount: number, tone: Activity["tone"]) => {
    const entry: Activity = {
      id: `a-${Date.now()}`,
      title,
      detail,
      amount,
      tone,
    };
    setActivity((current) => [entry, ...current].slice(0, 8));
  };

  const submitExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const newExpense: Expense = {
      id: `e-${Date.now()}`,
      description: expenseForm.description.trim(),
      category: expenseForm.category,
      paidBy: expenseForm.paidBy,
      amount,
      date: expenseForm.date,
      status: "review",
    };

    setExpenses((current) => [newExpense, ...current]);
    addActivity(
      "Expense created",
      `${newExpense.description} was logged by ${newExpense.paidBy}`,
      -newExpense.amount,
      "neutral",
    );
    setExpenseForm({
      description: "",
      category: "Studio",
      amount: "",
      paidBy: currentUser?.name ?? "Roy Atlas",
      date: TODAY,
    });
    closeModal();
  };

  const submitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const member = membersById.get(requestForm.memberId);
    const amount = Number(requestForm.amount);

    if (!member || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      memberId: member.id,
      direction: "request",
      amount,
      date: requestForm.date,
      category: requestForm.category,
      status: "pending",
      receiptLabel: "Payment Request",
      receiptNote: `${member.name} was asked to send ${formatCurrency(amount)} for ${requestForm.category.toLowerCase()}.`,
    };

    setPayments((current) => [newPayment, ...current]);
    addActivity(
      "Payment request logged",
      `${member.name} owes you ${formatCurrency(amount)}`,
      amount,
      "positive",
    );
    setRequestForm(createPaymentForm(getDefaultRequestMemberId(members)));
    closeModal();
  };

  const submitSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const member = membersById.get(sendForm.memberId);
    const amount = Number(sendForm.amount);

    if (!member || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      memberId: member.id,
      direction: "pay",
      amount,
      date: sendForm.date,
      category: sendForm.category,
      status: "pending",
      receiptLabel: "Outgoing Transfer",
      receiptNote: `${formatCurrency(amount)} is queued to go out to ${member.name} for ${sendForm.category.toLowerCase()}.`,
    };

    setPayments((current) => [newPayment, ...current]);
    addActivity(
      "Payment queued",
      `You still owe ${member.name} ${formatCurrency(amount)}`,
      -amount,
      "negative",
    );
    setSendForm(createPaymentForm(getDefaultSendMemberId(members)));
    closeModal();
  };

  const submitInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const split = Number(inviteForm.split);
    if (!inviteForm.name.trim() || Number.isNaN(split) || split <= 0) {
      return;
    }

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: inviteForm.name.trim(),
      role: inviteForm.role,
      split,
      balance: 0,
    };

    setMembers((current) => [...current, newMember]);
    addActivity("Member invited", `${newMember.name} joined with a ${newMember.split}% split`, 0, "neutral");
    setInviteForm({ name: "", role: "Bandmate", split: "25" });
    closeModal();
  };

  return (
    <main className="app-root">
      {showIntro ? (
        <div className="app-intro" data-state={isIntroFading ? "fading" : "visible"} aria-hidden="true">
          <div className="app-intro-panel">
            <LogoLockup className="app-intro-logo" priority />
          </div>
        </div>
      ) : null}

      <div className="app-container">
        <header className="app-topbar app-card">
          <div className="flex items-center gap-4">
            <LogoLockup className="app-header-logo" priority />
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--ink-300)]">
                Atlas Touring
              </p>
              <p className="text-sm text-[var(--ink-100)]">Band Ledger Workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="app-button-primary" onClick={openExpenseModal}>
              Add Expense
            </button>
            <button className="app-button-secondary" onClick={openRequestModal}>
              Request Payment
            </button>
            <button className="app-button-secondary" onClick={openSendModal}>
              Send Payment
            </button>
            <button className="app-avatar" aria-label="Current user">
              {getInitials(currentUser?.name ?? "Roy Atlas")}
            </button>
          </div>
        </header>

        <div className="app-shell app-card">
          <aside className="app-sidebar">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className="app-nav-item"
                  data-active={activeView === item.id}
                  onClick={() => setActiveView(item.id)}
                >
                  {item.icon({ className: "h-4 w-4" })}
                  {item.label}
                </button>
              ))}
            </nav>

            <button className="app-button-secondary w-full" onClick={() => setActiveModal("invite")}>
              Invite Member
            </button>
          </aside>

          <section className="app-content">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="You Are Owed" value={formatCurrency(totals.youAreOwed)} tone="positive" />
              <MetricCard label="You Owe" value={formatCurrency(totals.youOwe)} tone="negative" />
              <MetricCard
                label="Balance"
                value={formatCurrency(totals.netBalance)}
                tone={totals.netBalance > 0 ? "positive" : totals.netBalance < 0 ? "negative" : "neutral"}
              />
              <MetricCard label="Recent Expenses" value={totals.recentExpensesLabel} tone="neutral" />
            </div>

            {activeView === "dashboard" && (
              <DashboardView
                expenses={expenses}
                payments={paymentRows}
                snapshotItems={snapshotItems}
                activity={activity}
                onOpenReceipt={setSelectedReceipt}
              />
            )}
            {activeView === "balances" && (
              <BalancesView
                members={balanceRows}
                onRequestForMember={openRequestForMember}
                onSendForMember={openSendForMember}
              />
            )}
            {activeView === "expenses" && <ExpensesView expenses={expenses} onAdd={openExpenseModal} />}
            {activeView === "payments" && (
              <PaymentsView
                payments={paymentRows}
                onRequest={openRequestModal}
                onSend={openSendModal}
                onOpenReceipt={setSelectedReceipt}
              />
            )}
            {activeView === "revenue" && <RevenueView payouts={initialGigPayouts} members={members} />}
            {activeView === "reports" && <ReportsView />}
            {activeView === "members" && <MembersView members={memberRows} onInvite={() => setActiveModal("invite")} />}
          </section>
        </div>
      </div>

      {activeModal === "expense" && (
        <Modal title="Add Expense" description="Log a shared band expense." onClose={closeModal}>
          <form className="space-y-4" onSubmit={submitExpense}>
            <Field label="Description">
              <input
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                className="app-input"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, category: event.target.value as Category }))
                  }
                  className="app-input"
                >
                  {PAYMENT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (USD)">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Paid By">
                <select
                  value={expenseForm.paidBy}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, paidBy: event.target.value }))}
                  className="app-input"
                >
                  {members.map((member) => (
                    <option key={member.id}>{member.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
            </div>
            <ModalActions close={closeModal} submitLabel="Create Expense" />
          </form>
        </Modal>
      )}

      {activeModal === "request" && (
        <Modal title="Request Payment" description="Log money a bandmate still owes you." onClose={closeModal}>
          <form className="space-y-4" onSubmit={submitRequest}>
            <Field label="Member">
              <select
                value={requestForm.memberId}
                onChange={(event) => setRequestForm((current) => ({ ...current, memberId: event.target.value }))}
                className="app-input"
              >
                {bandmates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (USD)">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={requestForm.amount}
                  onChange={(event) => setRequestForm((current) => ({ ...current, amount: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
              <Field label="Category">
                <select
                  value={requestForm.category}
                  onChange={(event) =>
                    setRequestForm((current) => ({ ...current, category: event.target.value as Category }))
                  }
                  className="app-input"
                >
                  {PAYMENT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Date">
              <input
                type="date"
                value={requestForm.date}
                onChange={(event) => setRequestForm((current) => ({ ...current, date: event.target.value }))}
                className="app-input"
                required
              />
            </Field>
            <ModalActions close={closeModal} submitLabel="Create Request" />
          </form>
        </Modal>
      )}

      {activeModal === "send" && (
        <Modal title="Send Payment" description="Log money you need to send a bandmate." onClose={closeModal}>
          <form className="space-y-4" onSubmit={submitSend}>
            <Field label="Member">
              <select
                value={sendForm.memberId}
                onChange={(event) => setSendForm((current) => ({ ...current, memberId: event.target.value }))}
                className="app-input"
              >
                {bandmates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (USD)">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={sendForm.amount}
                  onChange={(event) => setSendForm((current) => ({ ...current, amount: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
              <Field label="Category">
                <select
                  value={sendForm.category}
                  onChange={(event) =>
                    setSendForm((current) => ({ ...current, category: event.target.value as Category }))
                  }
                  className="app-input"
                >
                  {PAYMENT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Date">
              <input
                type="date"
                value={sendForm.date}
                onChange={(event) => setSendForm((current) => ({ ...current, date: event.target.value }))}
                className="app-input"
                required
              />
            </Field>
            <ModalActions close={closeModal} submitLabel="Log Payment" />
          </form>
        </Modal>
      )}

      {activeModal === "invite" && (
        <Modal title="Invite Member" description="Add another band member to the workspace." onClose={closeModal}>
          <form className="space-y-4" onSubmit={submitInvite}>
            <Field label="Full Name">
              <input
                value={inviteForm.name}
                onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
                className="app-input"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role">
                <input
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
              <Field label="Split (%)">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={inviteForm.split}
                  onChange={(event) => setInviteForm((current) => ({ ...current, split: event.target.value }))}
                  className="app-input"
                  required
                />
              </Field>
            </div>
            <ModalActions close={closeModal} submitLabel="Invite" />
          </form>
        </Modal>
      )}

      {selectedReceipt && (
        <Modal
          title={selectedReceipt.receiptLabel}
          description=""
          onClose={closeReceiptPreview}
        >
          <div className="space-y-4">
            <div className="app-subcard">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--ink-100)]">
                  <PaperclipIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedReceipt.memberName}</p>
                  <p className="text-sm text-[var(--ink-200)]">
                    {getPaymentDirectionText(selectedReceipt.direction)} · {selectedReceipt.category}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ReceiptDatum label="Amount" value={formatCurrency(selectedReceipt.amount)} />
                <ReceiptDatum label="Status" value={selectedReceipt.status} />
                <ReceiptDatum label="Date" value={formatDate(selectedReceipt.date)} />
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">Receipt Notes</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-100)]">{selectedReceipt.receiptNote}</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={closeReceiptPreview} className="app-button-primary">
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function DashboardView({
  expenses,
  payments,
  snapshotItems,
  activity,
  onOpenReceipt,
}: {
  expenses: Expense[];
  payments: PaymentRow[];
  snapshotItems: SnapshotItem[];
  activity: Activity[];
  onOpenReceipt: (payment: PaymentRow) => void;
}) {
  const latestExpense = expenses[0];
  const latestPayment = payments[0];

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="app-card p-5">
        <header className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Band Money Snapshot</h2>
            <p className="text-sm text-[var(--ink-200)]">Quick context for who owes what and what moved lately</p>
          </div>
          <span className="app-status app-status-neutral">Live</span>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="app-subcard">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--ink-300)]">Latest Expense</p>
            <p className="mt-2 text-xl font-semibold text-white">{latestExpense?.description ?? "No expenses yet"}</p>
            <p className="mt-1 text-sm text-[var(--ink-200)]">
              {latestExpense
                ? `${latestExpense.paidBy} · ${formatCurrency(latestExpense.amount)} · ${formatDate(latestExpense.date)}`
                : "-"}
            </p>
          </div>
          <div className="app-subcard">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--ink-300)]">Latest Payment</p>
            <p className="mt-2 text-xl font-semibold text-white">{latestPayment?.memberName ?? "No payments yet"}</p>
            <p className="mt-1 text-sm text-[var(--ink-200)]">
              {latestPayment
                ? `${getPaymentDirectionText(latestPayment.direction)} · ${formatCurrency(latestPayment.amount)}`
                : "-"}
            </p>
            {latestPayment ? (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--cyan)]"
                onClick={() => onOpenReceipt(latestPayment)}
              >
                <PaperclipIcon className="h-4 w-4" />
                View Receipt
              </button>
            ) : null}
          </div>
        </div>

        <section className="mt-4 app-subcard">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-lg font-semibold text-white">Members Snapshot</h3>
            <p className="mt-1 text-sm text-[var(--ink-200)]">Unpaid balances at a glance</p>
          </div>
          <div className="mt-4 space-y-3">
            {snapshotItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--ink-100)]">{item.text}</p>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    item.tone === "positive"
                      ? "bg-[#6ee7b5]"
                      : item.tone === "negative"
                        ? "bg-[#ff8f8f]"
                        : "bg-[var(--ink-200)]"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="app-card p-5">
        <h3 className="border-b border-white/10 pb-3 text-xl font-semibold text-white">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {activity.map((entry) => (
            <article key={entry.id} className="app-subcard">
              <p className="text-sm font-semibold text-white">{entry.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-200)]">{entry.detail}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  entry.tone === "positive"
                    ? "text-[#6ee7b5]"
                    : entry.tone === "negative"
                      ? "text-[#ff8f8f]"
                      : "text-[var(--ink-100)]"
                }`}
              >
                {entry.amount === 0 ? "No amount" : formatCurrency(entry.amount)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BalancesView({
  members,
  onRequestForMember,
  onSendForMember,
}: {
  members: MemberRow[];
  onRequestForMember: (member: MemberRow) => void;
  onSendForMember: (member: MemberRow) => void;
}) {
  const membersWhoOweYou = members.filter((member) => member.balance < 0);
  const membersYouOwe = members.filter((member) => member.balance > 0);

  return (
    <div className="mt-6 space-y-4">
      <section className="app-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Band Balances</h2>
            <p className="mt-1 text-sm text-[var(--ink-200)]">Clear member-by-member balances from your point of view</p>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-[var(--ink-300)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Split</th>
                <th className="px-5 py-3 font-semibold">Balance</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const action = getBalanceAction(member, onRequestForMember, onSendForMember);

                return (
                  <tr key={member.id} className="border-b border-white/6 last:border-b-0">
                    <td className="px-5 py-4 text-white">{member.name}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{member.role}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{member.split}%</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{formatCurrency(Math.abs(member.balance))}</p>
                      <p className="mt-1 text-xs text-[var(--ink-200)]">{getBalanceLabel(member.balance)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={member.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className={action.className}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="app-card p-5">
          <h3 className="text-lg font-semibold text-white">Who Owes You</h3>
          <div className="mt-3 space-y-2">
            {membersWhoOweYou.length === 0 ? <p className="text-sm text-[var(--ink-200)]">Nobody owes you right now.</p> : null}
            {membersWhoOweYou.map((member) => (
              <p key={member.id} className="text-sm text-[var(--ink-100)]">
                {member.name} owes you{" "}
                <span className="font-semibold text-[#6ee7b5]">{formatCurrency(Math.abs(member.balance))}</span>
              </p>
            ))}
          </div>
        </section>
        <section className="app-card p-5">
          <h3 className="text-lg font-semibold text-white">Who You Owe</h3>
          <div className="mt-3 space-y-2">
            {membersYouOwe.length === 0 ? <p className="text-sm text-[var(--ink-200)]">You are all caught up.</p> : null}
            {membersYouOwe.map((member) => (
              <p key={member.id} className="text-sm text-[var(--ink-100)]">
                You owe {member.name}{" "}
                <span className="font-semibold text-[#ff8f8f]">{formatCurrency(member.balance)}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ExpensesView({ expenses, onAdd }: { expenses: Expense[]; onAdd: () => void }) {
  return (
    <div className="mt-6 space-y-4">
      <section className="app-card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Expenses</h2>
            <p className="text-sm text-[var(--ink-200)]">Shared costs for rehearsals, travel, merch, and more</p>
          </div>
          <button className="app-button-primary" onClick={onAdd}>
            Add Expense
          </button>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-[var(--ink-300)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Paid By</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((entry) => (
                <tr key={entry.id} className="border-b border-white/6 last:border-b-0">
                  <td className="px-5 py-4 text-[var(--ink-100)]">{formatDate(entry.date)}</td>
                  <td className="px-5 py-4 text-white">{entry.description}</td>
                  <td className="px-5 py-4 text-[var(--ink-100)]">{entry.category}</td>
                  <td className="px-5 py-4 text-[var(--ink-100)]">{entry.paidBy}</td>
                  <td className="px-5 py-4 font-semibold text-white">{formatCurrency(entry.amount)}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={entry.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {expenses.map((entry) => (
            <article key={entry.id} className="app-subcard">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{entry.description}</p>
                  <p className="text-sm text-[var(--ink-200)]">
                    {formatDate(entry.date)} · {entry.category}
                  </p>
                </div>
                <StatusPill status={entry.status} />
              </div>
              <p className="mt-2 text-sm text-[var(--ink-100)]">Paid by {entry.paidBy}</p>
              <p className="mt-1 font-semibold text-white">{formatCurrency(entry.amount)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PaymentsView({
  payments,
  onRequest,
  onSend,
  onOpenReceipt,
}: {
  payments: PaymentRow[];
  onRequest: () => void;
  onSend: () => void;
  onOpenReceipt: (payment: PaymentRow) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <section className="app-card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Payments</h2>
            <p className="text-sm text-[var(--ink-200)]">Track what bandmates need to send or receive</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="app-button-secondary" onClick={onRequest}>
              Request Payment
            </button>
            <button className="app-button-primary" onClick={onSend}>
              Send Payment
            </button>
          </div>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-[var(--ink-300)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/6 last:border-b-0">
                  <td className="px-5 py-4 text-[var(--ink-100)]">{formatDate(payment.date)}</td>
                  <td className="px-5 py-4 text-white">{payment.memberName}</td>
                  <td className="px-5 py-4 text-[var(--ink-100)]">{getPaymentDirectionText(payment.direction)}</td>
                  <td className="px-5 py-4 text-[var(--ink-100)]">{payment.category}</td>
                  <td className="px-5 py-4 font-semibold text-white">{formatCurrency(payment.amount)}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={payment.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cyan)]"
                      onClick={() => onOpenReceipt(payment)}
                    >
                      <PaperclipIcon className="h-4 w-4" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {payments.map((payment) => (
            <article key={payment.id} className="app-subcard">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{payment.memberName}</p>
                  <p className="text-sm text-[var(--ink-200)]">
                    {formatDate(payment.date)} · {payment.category}
                  </p>
                </div>
                <StatusPill status={payment.status} />
              </div>
              <p className="mt-2 text-sm text-[var(--ink-100)]">{getPaymentDirectionText(payment.direction)}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{formatCurrency(payment.amount)}</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cyan)]"
                  onClick={() => onOpenReceipt(payment)}
                >
                  <PaperclipIcon className="h-4 w-4" />
                  Receipt
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RevenueView({ payouts, members }: { payouts: GigPayout[]; members: Member[] }) {
  const totalRevenue = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const latestPayout = payouts[0];
  const highestPayout = payouts.reduce<GigPayout | null>(
    (top, payout) => (top && top.amount > payout.amount ? top : payout),
    null,
  );
  const paidToNames = useMemo(() => {
    const preferred = members.filter((member) => !member.isCurrentUser);
    const candidates = (preferred.length >= 3 ? preferred : members).slice(0, 3).map((member) => member.name);

    return candidates.length ? candidates : ["-"];
  }, [members]);

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="app-subcard">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">Total Gig Revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#6ee7b5]">{formatCurrency(totalRevenue)}</p>
          <p className="mt-2 text-sm text-[var(--ink-200)]">{payouts.length} paid gigs logged</p>
        </article>
        <article className="app-subcard">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">Latest Payout</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            {latestPayout ? formatCurrency(latestPayout.amount) : "-"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-200)]">
            {latestPayout ? `${latestPayout.gigTitle} on ${formatDate(latestPayout.payoutDate)}` : "No payout yet"}
          </p>
        </article>
        <article className="app-subcard">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">Top Paying Gig</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            {highestPayout ? formatCurrency(highestPayout.amount) : "-"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-200)]">{highestPayout?.gigTitle ?? "No gigs logged"}</p>
        </article>
      </div>

      <section className="app-card overflow-hidden">
        <header className="border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Revenue</h2>
            <p className="text-sm text-[var(--ink-200)]">
              Track what each gig paid, when it landed, and where the show happened
            </p>
          </div>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-[var(--ink-300)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Gig</th>
                <th className="px-5 py-3 font-semibold">Venue</th>
                <th className="px-5 py-3 font-semibold">Show Date</th>
                <th className="px-5 py-3 font-semibold">Paid On</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Paid to</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, index) => {
                const paidTo = paidToNames[index % paidToNames.length];

                return (
                  <tr key={payout.id} className="border-b border-white/6 last:border-b-0">
                    <td className="px-5 py-4 text-white">{payout.gigTitle}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">
                      <div>
                        <p>{payout.venue}</p>
                        <p className="mt-1 text-sm text-[var(--ink-200)]">{payout.market}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{formatDate(payout.showDate)}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{formatDate(payout.payoutDate)}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{payout.payoutMethod}</td>
                    <td className="px-5 py-4 text-[var(--ink-100)]">{paidTo}</td>
                    <td className="px-5 py-4 font-semibold text-white">{formatCurrency(payout.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {payouts.map((payout, index) => {
            const paidTo = paidToNames[index % paidToNames.length];

            return (
              <article key={payout.id} className="app-subcard">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{payout.gigTitle}</p>
                    <p className="text-sm text-[var(--ink-200)]">
                      {payout.venue} · {payout.market}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(payout.amount)}</p>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-100)]">
                  <p>Show date: {formatDate(payout.showDate)}</p>
                  <p>Paid on: {formatDate(payout.payoutDate)}</p>
                  <p>Method: {payout.payoutMethod}</p>
                  <p>Paid to: {paidTo}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ReportsView() {
  const net = monthlyRevenue.map((value, index) => value - monthlyExpenses[index]);

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
      <section className="app-card p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Revenue vs Expenses</h2>
            <p className="mt-1 text-sm text-[var(--ink-200)]">Last six months</p>
          </div>
          <div className="text-right">
            <button type="button" className="app-button-primary">
              Generate Tax Report
            </button>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-6 items-end gap-3">
          {monthLabels.map((month, index) => (
            <div key={month} className="text-center">
              <div className="mx-auto flex h-44 items-end justify-center gap-2">
                <span
                  className="w-3 rounded-t bg-[#4de7b1]"
                  style={{ height: `${Math.max(18, (monthlyRevenue[index] / 4000) * 100)}%` }}
                />
                <span
                  className="w-3 rounded-t bg-[#ff8f8f]"
                  style={{ height: `${Math.max(18, (monthlyExpenses[index] / 4000) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--ink-300)]">{month}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-card p-5">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Balance per Month</h2>

        <div className="mt-5 space-y-3">
          {monthLabels.map((month, index) => (
            <article key={month} className="app-subcard flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--ink-100)]">{month} 2026</span>
              <span className={net[index] >= 0 ? "font-semibold text-[#6ee7b5]" : "font-semibold text-[#ff8f8f]"}>
                {formatCurrency(net[index])}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MembersView({ members, onInvite }: { members: MemberRow[]; onInvite: () => void }) {
  return (
    <div className="mt-6 space-y-4">
      <section className="app-card p-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Members</h2>
            <p className="text-sm text-[var(--ink-200)]">Roles, splits, and where each person stands</p>
          </div>
          <button className="app-button-primary" onClick={onInvite}>
            Invite Member
          </button>
        </header>

        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <article key={member.id} className="app-subcard grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{member.name}</p>
                  {member.isCurrentUser ? <span className="app-status app-status-neutral">You</span> : null}
                </div>
                <p className="text-sm text-[var(--ink-200)]">{member.role}</p>
              </div>
              <p className="text-sm text-[var(--ink-100)]">Split {member.split}%</p>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--ink-300)]">
                  Current Balance
                </p>
                <p className={member.balance >= 0 ? "mt-2 text-sm font-semibold text-[#6ee7b5]" : "mt-2 text-sm font-semibold text-[#ff8f8f]"}>
                  {formatCurrency(member.balance)}
                </p>
              </div>
              <StatusPill status={member.status} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="app-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="app-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button className="app-close" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-200)]">{description}</p>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-300)]">{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ close, submitLabel }: { close: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" onClick={close} className="app-button-secondary">
        Cancel
      </button>
      <button type="submit" className="app-button-primary">
        {submitLabel}
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <article className="app-subcard">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${
          tone === "positive" ? "text-[#6ee7b5]" : tone === "negative" ? "text-[#ff8f8f]" : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function StatusPill({
  status,
}: {
  status: MemberStatus | Expense["status"] | PaymentStatus;
}) {
  const toneClass =
    status === "paid" || status === "approved"
      ? "app-status-positive"
      : status === "pending" || status === "review"
        ? "app-status-warning"
        : status === "unpaid"
          ? "app-status-negative"
          : "app-status-neutral";

  return <span className={`app-status ${toneClass}`}>{status}</span>;
}

function ReceiptDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-300)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function createPaymentForm(memberId: string): PaymentFormState {
  return {
    memberId,
    amount: "",
    category: "Miscellaneous",
    date: TODAY,
  };
}

function getDefaultBandmateId(memberList: Member[]) {
  return memberList.find((member) => !member.isCurrentUser)?.id ?? "";
}

function getDefaultRequestMemberId(memberList: Member[]) {
  return memberList.find((member) => !member.isCurrentUser && member.balance < 0)?.id ?? getDefaultBandmateId(memberList);
}

function getDefaultSendMemberId(memberList: Member[]) {
  return memberList.find((member) => !member.isCurrentUser && member.balance > 0)?.id ?? getDefaultBandmateId(memberList);
}

function getBandmateStatus(member: Member, latestPaymentByMember: Map<string, PaymentRow>): MemberStatus {
  if (member.balance === 0) {
    return "paid";
  }

  return latestPaymentByMember.get(member.id)?.status === "pending" ? "pending" : "unpaid";
}

function getSuggestedCategory(memberId: string, latestPaymentByMember: Map<string, PaymentRow>): Category {
  return latestPaymentByMember.get(memberId)?.category ?? "Miscellaneous";
}

function describeMemberBalance(member: MemberRow) {
  const firstName = member.name.split(" ")[0];

  if (member.balance < 0) {
    return `${firstName} owes you ${formatCurrency(Math.abs(member.balance))}`;
  }

  if (member.balance > 0) {
    return `You owe ${firstName} ${formatCurrency(member.balance)}`;
  }

  return `${firstName} is settled up`;
}

function getBalanceLabel(balance: number) {
  if (balance < 0) {
    return "Owes you";
  }

  if (balance > 0) {
    return "You owe them";
  }

  return "Settled";
}

function getBalanceAction(
  member: MemberRow,
  onRequestForMember: (member: MemberRow) => void,
  onSendForMember: (member: MemberRow) => void,
) {
  if (member.balance < 0) {
    return {
      label: "Request",
      onClick: () => onRequestForMember(member),
      disabled: false,
      className: "app-button-secondary",
    };
  }

  if (member.balance > 0) {
    return {
      label: "Pay",
      onClick: () => onSendForMember(member),
      disabled: false,
      className: "app-button-primary",
    };
  }

  return {
    label:"None",
    onClick: () => undefined,
    disabled: true,
    className:
      "rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--ink-200)] opacity-70 disabled:cursor-not-allowed",
  };
}

function getPaymentDirectionText(direction: Payment["direction"]) {
  return direction === "request" ? "Incoming payment" : "Outgoing payment";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function LogoLockup({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logoandtext.png"
      alt="SoundPay"
      width={708}
      height={454}
      priority={priority}
      className={className}
    />
  );
}

function DashboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 3H9V9H3V3ZM11 3H17V6.5H11V3ZM11 8H17V17H11V8ZM3 11H9V17H3V11Z" fill="currentColor" />
    </svg>
  );
}

function BalanceIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 6.5H17V13.5H3V6.5Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13.5" cy="10" r="1.6" fill="currentColor" />
      <path d="M5.5 6.5V4.8H14.5V6.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ExpenseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 3H15V17H5V3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.8 7.2H12.2M7.8 10H12.2M7.8 12.8H10.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PaymentIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 6.5H16M4 13.5H16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 4L4 6.5L6.5 9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 11L16 13.5L13.5 16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RevenueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 14.5L8 10.5L11 13.5L16 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.5 8.5H16V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4.5V16H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 16V10M10 16V4M16 16V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MembersIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 15C3.5 12.8 5.3 11 7.5 11H8.5C10.7 11 12.5 12.8 12.5 15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 15C10.5 13.2 12 11.7 13.8 11.7H14C15.8 11.7 17.3 13.2 17.3 15" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PaperclipIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 12.5L12.8 7.7C13.8 6.7 15.4 6.7 16.4 7.7C17.4 8.7 17.4 10.3 16.4 11.3L9.8 17.9C8.2 19.5 5.6 19.5 4 17.9C2.4 16.3 2.4 13.7 4 12.1L10.1 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
