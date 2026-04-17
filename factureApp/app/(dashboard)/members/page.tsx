"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Loader } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"

// Types
type UserStatus = 'actif' | 'suspendu' | 'inactif'
type UserRole   = 'member' | 'admin' | 'superAdmin'

type Member = {
  id:              number
  fullname:        string
  email:           string
  role:            UserRole
  status:          UserStatus
  invited_by:      number | null
  organization_id: number
  created_at:      string
}

// Helpers
const getRoleLabel = (role: UserRole) => ({
  member:     'Membre',
  admin:      'Admin',
  superAdmin: 'Super Admin',
}[role])

const getRoleColor = (role: UserRole) => ({
  member:     'bg-gray-100 text-gray-700',
  admin:      'bg-blue-100 text-blue-700',
  superAdmin: 'bg-purple-100 text-purple-700',
}[role])

const getStatusColor = (status: UserStatus) => ({
  actif:    'bg-green-100 text-green-700',
  suspendu: 'bg-yellow-100 text-yellow-700',
  inactif:  'bg-red-100 text-red-700',
}[status])

const getStatusLabel = (status: UserStatus) => ({
  actif:    'Actif',
  suspendu: 'Suspendu',
  inactif:  'Inactif',
}[status])

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const getInitials = (fullname: string) =>
  fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function MembersPage() {
  const [members, setMembers]                   = useState<Member[]>([])
  const [selectedMember, setSelectedMember]     = useState<Member | null>(null)
  const [isDialogOpen, setIsDialogOpen]         = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete]     = useState<Member | null>(null)
  const [loading, setLoading]                   = useState(false)
  const [deleteLoading, setDeleteLoading]       = useState(false)
  const [error, setError]                       = useState("")

  const [formData, setFormData] = useState({
    fullname: '',
    email:    '',
    role:     'member' as UserRole,
    status:   'actif' as UserStatus,
  })

  // Charger les membres
  const fetchMembers = async () => {
    try {
      const res = await axiosInstance.get('/users')
      if (res.status === 200) setMembers(res.data.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // Ouvrir dialog ajout
  const openAddDialog = () => {
    setSelectedMember(null)
    setFormData({ fullname: '', email: '', role: 'member', status: 'actif' })
    setError("")
    setIsDialogOpen(true)
  }

  // Ouvrir dialog modification
  const openEditDialog = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      fullname: member.fullname,
      email:    member.email,
      role:     member.role,
      status:   member.status,
    })
    setError("")
    setIsDialogOpen(true)
  }

  // Ajouter un utilisateur
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axiosInstance.post('/users/invite', {
        fullname: formData.fullname,
        email:    formData.email,
        role:     formData.role,
      })
      if (res.status === 201) {
        await fetchMembers()
        setIsDialogOpen(false)
        setFormData({ fullname: '', email: '', role: 'member', status: 'actif' })
        toast({
          title: "Membre invité",
          description: `Une invitation a été envoyée à ${formData.email}.`,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout")
      toast({
        variant: "destructive",
        title: "Erreur lors de l'ajout",
        description: err.response?.data?.message || "Erreur lors de l'ajout",
      })
    } finally {
      setLoading(false)
    }
  }

  // Modifier un utilisateur
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return
    setLoading(true)
    setError("")
    try {
      const res = await axiosInstance.put(`/users/${selectedMember.id}`, {
        fullname: formData.fullname,
        role:     formData.role,
        status:   formData.status,
      })
      if (res.status === 200) {
        await fetchMembers()
        setIsDialogOpen(false)
        setSelectedMember(null)
        toast({
          title: "Membre mis à jour",
          description: "Les informations du membre ont été mises à jour avec succès.",
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la modification")
      toast({
        variant: "destructive",
        title: "Erreur lors de la modification",
        description: err.response?.data?.message || "Erreur lors de la modification",
      })
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un utilisateur
  const handleDelete = async () => {
    if (!memberToDelete) return
    setDeleteLoading(true)
    try {
      const res = await axiosInstance.delete(`/users/${memberToDelete.id}`)
      if (res.status === 200) {
        await fetchMembers()
        setIsDeleteDialogOpen(false)
        setMemberToDelete(null)
        toast({
          title: "Membre supprimé",
          description: "Le membre a été supprimé avec succès.",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Erreur lors de la suppression",
        description: "Une erreur est survenue lors de la suppression du membre.",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Récupérer les infos de l'org depuis localStorage
  const userRaw  = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const orgPlan  = userRaw ? JSON.parse(userRaw)?.organization?.plan : 'free'
  const maxUsers = { free: 1, pro: 5, business: '∞' }[orgPlan as string] ?? 1

  return (
    <>
      <Header title="Membres" showNewInvoice={false} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Équipe</h2>
                <p className="text-sm text-muted-foreground">
                  Gérez les membres de votre organisation.
                </p>
              </div>
              <Button className="gap-2" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead className="hidden sm:table-cell">Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Ajouté le</TableHead>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun membre trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-semibold text-primary">
                                {getInitials(member.fullname)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{member.fullname}</p>
                              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={getRoleColor(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className={getStatusColor(member.status)}>
                            {getStatusLabel(member.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(member.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => openEditDialog(member)}
                              >
                                <Edit className="h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => {
                                  setMemberToDelete(member)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Info plan */}
            <div className="mt-4 text-sm text-muted-foreground">
              {members.length} membre{members.length > 1 ? "s" : ""} sur {maxUsers} (Plan {orgPlan})
            </div>
          </CardContent>
        </Card>

        {/* Dialog ajout / modification */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMember ? 'Modifier le membre' : 'Ajouter un utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {selectedMember
                  ? 'Modifiez le rôle ou le statut de ce membre.'
                  : 'Ajoutez un nouvel utilisateur à votre organisation.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={selectedMember ? handleUpdate : handleAdd} className="grid gap-4 py-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="grid gap-2">
                <Label>Nom complet</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  required
                />
              </div>

              {/* Email seulement à l'ajout */}
              {!selectedMember && (
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jean@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statut seulement en modification */}
              {selectedMember && (
                <div className="grid gap-2">
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as UserStatus })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      {selectedMember ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    selectedMember ? 'Enregistrer' : 'Ajouter'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog suppression */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer le membre
              </DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de supprimer{" "}
                <span className="font-semibold text-foreground">
                  {memberToDelete?.fullname}
                </span>
                . Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setMemberToDelete(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="gap-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}