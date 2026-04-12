// Types
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

export interface Invoice {
  id: string
  number: string
  client: string
  clientId: string
  amountHT: number
  amountTTC: number
  status: InvoiceStatus
  date: string
  dueDate: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  invoiceCount: number
  initials: string
  color: string
}

export interface Member {
  id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "active" | "pending"
  joinedAt: string
  avatar: string
}

// Mock data - Factures
export const invoices: Invoice[] = [
  {
    id: "1",
    number: "FAC-2024-001",
    client: "Entreprise Diallo & Fils",
    clientId: "1",
    amountHT: 450000,
    amountTTC: 540000,
    status: "paid",
    date: "2024-03-15",
    dueDate: "2024-04-15",
  },
  {
    id: "2",
    number: "FAC-2024-002",
    client: "Studio Graphique Bamako",
    clientId: "2",
    amountHT: 280000,
    amountTTC: 336000,
    status: "sent",
    date: "2024-03-18",
    dueDate: "2024-04-18",
  },
  {
    id: "3",
    number: "FAC-2024-003",
    client: "Agence Web Dakar",
    clientId: "3",
    amountHT: 750000,
    amountTTC: 900000,
    status: "overdue",
    date: "2024-02-20",
    dueDate: "2024-03-20",
  },
  {
    id: "4",
    number: "FAC-2024-004",
    client: "Restaurant Le Baobab",
    clientId: "4",
    amountHT: 125000,
    amountTTC: 150000,
    status: "draft",
    date: "2024-03-22",
    dueDate: "2024-04-22",
  },
  {
    id: "5",
    number: "FAC-2024-005",
    client: "Boutique Mode Abidjan",
    clientId: "5",
    amountHT: 380000,
    amountTTC: 456000,
    status: "paid",
    date: "2024-03-10",
    dueDate: "2024-04-10",
  },
  {
    id: "6",
    number: "FAC-2024-006",
    client: "Cabinet Conseil Lomé",
    clientId: "6",
    amountHT: 620000,
    amountTTC: 744000,
    status: "sent",
    date: "2024-03-25",
    dueDate: "2024-04-25",
  },
  {
    id: "7",
    number: "FAC-2024-007",
    client: "Transport Express Cotonou",
    clientId: "7",
    amountHT: 185000,
    amountTTC: 222000,
    status: "paid",
    date: "2024-03-05",
    dueDate: "2024-04-05",
  },
  {
    id: "8",
    number: "FAC-2024-008",
    client: "Hôtel Paradis Conakry",
    clientId: "8",
    amountHT: 950000,
    amountTTC: 1140000,
    status: "cancelled",
    date: "2024-03-01",
    dueDate: "2024-04-01",
  },
  {
    id: "9",
    number: "FAC-2024-009",
    client: "Pharmacie Centrale Niamey",
    clientId: "9",
    amountHT: 320000,
    amountTTC: 384000,
    status: "overdue",
    date: "2024-02-15",
    dueDate: "2024-03-15",
  },
  {
    id: "10",
    number: "FAC-2024-010",
    client: "Entreprise Diallo & Fils",
    clientId: "1",
    amountHT: 275000,
    amountTTC: 330000,
    status: "draft",
    date: "2024-03-28",
    dueDate: "2024-04-28",
  },
]

// Mock data - Clients
export const customers: Customer[] = [
  {
    id: "1",
    name: "Entreprise Diallo & Fils",
    email: "contact@diallo-fils.com",
    phone: "+221 77 123 45 67",
    address: "Dakar, Sénégal",
    invoiceCount: 12,
    initials: "ED",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Studio Graphique Bamako",
    email: "info@studiographique.ml",
    phone: "+223 66 789 01 23",
    address: "Bamako, Mali",
    invoiceCount: 5,
    initials: "SG",
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "Agence Web Dakar",
    email: "hello@agenceweb.sn",
    phone: "+221 78 456 78 90",
    address: "Dakar, Sénégal",
    invoiceCount: 8,
    initials: "AW",
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "Restaurant Le Baobab",
    email: "reservation@lebaobab.ci",
    phone: "+225 07 234 56 78",
    address: "Abidjan, Côte d&apos;Ivoire",
    invoiceCount: 3,
    initials: "RB",
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Boutique Mode Abidjan",
    email: "style@boutique-mode.ci",
    phone: "+225 05 345 67 89",
    address: "Abidjan, Côte d&apos;Ivoire",
    invoiceCount: 6,
    initials: "BM",
    color: "bg-pink-500",
  },
  {
    id: "6",
    name: "Cabinet Conseil Lomé",
    email: "conseil@cabinet-lome.tg",
    phone: "+228 90 567 89 01",
    address: "Lomé, Togo",
    invoiceCount: 4,
    initials: "CC",
    color: "bg-teal-500",
  },
  {
    id: "7",
    name: "Transport Express Cotonou",
    email: "express@transport.bj",
    phone: "+229 97 678 90 12",
    address: "Cotonou, Bénin",
    invoiceCount: 9,
    initials: "TE",
    color: "bg-yellow-500",
  },
  {
    id: "8",
    name: "Hôtel Paradis Conakry",
    email: "booking@hotel-paradis.gn",
    phone: "+224 622 789 01 23",
    address: "Conakry, Guinée",
    invoiceCount: 2,
    initials: "HP",
    color: "bg-red-500",
  },
  {
    id: "9",
    name: "Pharmacie Centrale Niamey",
    email: "pharma@centrale.ne",
    phone: "+227 96 890 12 34",
    address: "Niamey, Niger",
    invoiceCount: 7,
    initials: "PC",
    color: "bg-cyan-500",
  },
]

// Mock data - Membres
export const members: Member[] = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean.dupont@facturapro.com",
    role: "admin",
    status: "active",
    joinedAt: "2023-06-15",
    avatar: "JD",
  },
  {
    id: "2",
    name: "Marie Koffi",
    email: "marie.koffi@facturapro.com",
    role: "editor",
    status: "active",
    joinedAt: "2023-08-22",
    avatar: "MK",
  },
  {
    id: "3",
    name: "Amadou Traoré",
    email: "amadou.traore@facturapro.com",
    role: "editor",
    status: "active",
    joinedAt: "2023-10-10",
    avatar: "AT",
  },
  {
    id: "4",
    name: "Sophie Martin",
    email: "sophie.martin@facturapro.com",
    role: "viewer",
    status: "pending",
    joinedAt: "2024-03-01",
    avatar: "SM",
  },
  {
    id: "5",
    name: "Oumar Diop",
    email: "oumar.diop@facturapro.com",
    role: "viewer",
    status: "active",
    joinedAt: "2024-01-15",
    avatar: "OD",
  },
]

// Chart data - CA des 6 derniers mois
export const revenueData = [
  { month: "Oct", revenue: 2850000 },
  { month: "Nov", revenue: 3200000 },
  { month: "Dec", revenue: 2950000 },
  { month: "Jan", revenue: 3450000 },
  { month: "Fév", revenue: 3800000 },
  { month: "Mar", revenue: 4150000 },
]

// Helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA"
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
    overdue: "En retard",
    cancelled: "Annulée",
  }
  return labels[status]
}

export function getStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-orange-100 text-orange-700",
  }
  return colors[status]
}

export function getRoleLabel(role: Member["role"]): string {
  const labels: Record<Member["role"], string> = {
    admin: "Admin",
    editor: "Éditeur",
    viewer: "Lecteur",
  }
  return labels[role]
}

export function getRoleColor(role: Member["role"]): string {
  const colors: Record<Member["role"], string> = {
    admin: "bg-primary/10 text-primary",
    editor: "bg-blue-100 text-blue-700",
    viewer: "bg-muted text-muted-foreground",
  }
  return colors[role]
}
