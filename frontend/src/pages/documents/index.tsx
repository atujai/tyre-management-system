import React, { useState } from 'react'
import { FileText, Plus, AlertTriangle, Clock, XCircle, Search, Calendar, Bell, TrendingUp, List, LayoutGrid } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { useDocumentDashboard, useExpiringDocuments, useDocumentsByVehicle, useCreateDocument, useUpdateDocument, useDeleteDocument, useRenewDocument, useSendReminder } from '@/hooks/useDocuments'
import { useVehicles } from '@/hooks/useVehicles'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS, DOCUMENT_STATUS_CONFIG } from '@/types/document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

type ViewMode = 'list' | 'calendar'

export function DocumentsPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  const { data: dashboard } = useDocumentDashboard()
  const { data: expiringDocsRaw } = useExpiringDocuments(30)
  const expiringDocs = Array.isArray(expiringDocsRaw) ? expiringDocsRaw : expiringDocsRaw?.documents || []
  const { data: vehiclesRaw } = useVehicles()
  const vehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw : vehiclesRaw?.vehicles || []

  const stats = [
    { title: 'Total Documents', value: dashboard?.totalDocuments || 0, icon: FileText, color: 'bg-blue-500' },
    { title: 'Expiring in 30 Days', value: dashboard?.expiring30 || 0, icon: AlertTriangle, color: 'bg-yellow-500' },
    { title: 'Expiring in 7 Days', value: dashboard?.expiring7 || 0, icon: Clock, color: 'bg-orange-500' },
    { title: 'Expired', value: dashboard?.expired || 0, icon: XCircle, color: 'bg-red-500' },
  ]

  const handleCreate = () => {
    setModalMode('create')
    setSelectedDocument(null)
    setIsModalOpen(true)
  }

  const handleEdit = (doc: any) => {
    setModalMode('edit')
    setSelectedDocument(doc)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">Manage vehicle documents, track expiry dates & renewals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border rounded-lg p-1">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4 mr-2" />List
            </Button>
            <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
              <Calendar className="w-4 h-4 mr-2" />Calendar
            </Button>
          </div>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Add Document</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-6">
            <div className={`${stat.color} w-fit p-3 rounded-lg mb-4`}><stat.icon className="w-6 h-6 text-white" /></div>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-muted-foreground text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {dashboard?.byType?.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Documents by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard.byType.map((item: any) => (
              <div key={item.type} className="bg-muted rounded-lg p-4">
                <div className={`w-3 h-3 rounded-full ${DOCUMENT_TYPE_COLORS[item.type]} mb-2`} />
                <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[item.type]}</p>
                <p className="text-2xl font-bold mt-1">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(expiringDocs) && expiringDocs.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-500"><Bell className="w-5 h-5" />Expiring Soon ({expiringDocs.length})</h3>
          <div className="space-y-3">
            {expiringDocs.slice(0, 5).map((doc: any) => {
              const daysLeft = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0
              return (
                <div key={doc.id} className="flex items-center justify-between bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${DOCUMENT_STATUS_CONFIG[doc.status]?.color || 'bg-gray-500'}`}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                      <p className="text-sm text-muted-foreground">{doc.vehicle?.reg} {doc.number ? `• ${doc.number}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${daysLeft <= 7 ? 'text-red-500' : 'text-yellow-500'}`}>{daysLeft} days left</p>
                    <p className="text-sm text-muted-foreground">{doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles?.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.reg} - {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                  <SelectItem value="UNDER_RENEWAL">Under Renewal</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DocumentList vehicleId={selectedVehicle} searchQuery={searchQuery} filterStatus={filterStatus} onEdit={handleEdit} />
        </>
      ) : (
        <DocumentCalendar vehicleId={selectedVehicle} />
      )}

      <DocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode={modalMode} document={selectedDocument} vehicleId={selectedVehicle} />
    </div>
  )
}

function DocumentList({ vehicleId, searchQuery, filterStatus, onEdit }: any) {
  const { data: documentsRaw, isLoading } = useDocumentsByVehicle(vehicleId || 'all')
  const documents = Array.isArray(documentsRaw) ? documentsRaw : documentsRaw?.documents || []
  const deleteMutation = useDeleteDocument()
  const sendReminder = useSendReminder()
  const [renewDoc, setRenewDoc] = useState<any>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const filteredDocs = documents?.filter((doc: any) => {
    const matchesSearch = !searchQuery || 
      DOCUMENT_TYPE_LABELS[doc.type].toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.vehicle?.reg.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !filterStatus || filterStatus === 'all' || doc.status === filterStatus
    return matchesSearch && matchesStatus
  }) || []

  const getDaysBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (days < 0) return <span className="text-red-500 font-bold">Expired {Math.abs(days)}d ago</span>
    if (days === 0) return <span className="text-red-500 font-bold">Expires Today</span>
    if (days <= 7) return <span className="text-red-500 font-bold">{days}d left</span>
    if (days <= 15) return <span className="text-orange-500 font-bold">{days}d left</span>
    if (days <= 30) return <span className="text-yellow-500 font-bold">{days}d left</span>
    return <span className="text-green-500">{days}d left</span>
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      await deleteMutation.mutateAsync(id)
      toast.success('Document deleted')
    }
  }

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (filteredDocs.length === 0) return <div className="bg-card border rounded-xl p-12 text-center"><FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-muted-foreground">No documents found</h3></div>

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium">Document</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Vehicle</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Number</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Expiry</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.map((doc: any) => {
              const isExpanded = expandedDoc === doc.id
              return (
                <React.Fragment key={doc.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${DOCUMENT_STATUS_CONFIG[doc.status]?.color || 'bg-gray-500'}`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                          {doc.issuer && <p className="text-xs text-muted-foreground">{doc.issuer}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{doc.vehicle?.reg || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{doc.number || '—'}</td>
                    <td className="px-6 py-4">
                      {doc.expiryDate ? (
                        <>
                          <p className="text-sm">{format(new Date(doc.expiryDate), 'MMM dd, yyyy')}</p>
                          <p className="text-xs mt-1">{getDaysBadge(doc.expiryDate)}</p>
                        </>
                      ) : <span className="text-muted-foreground">No expiry</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                        doc.status === 'EXPIRED' ? 'bg-red-500/20 text-red-500' :
                        doc.status === 'EXPIRING_SOON' ? 'bg-yellow-500/20 text-yellow-500' :
                        doc.status === 'UNDER_RENEWAL' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {DOCUMENT_STATUS_CONFIG[doc.status]?.label || doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {doc.fileUrl && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.open(`${import.meta.env.VITE_API_URL}${doc.fileUrl}`, '_blank') }}><FileText className="w-4 h-4" /></Button>}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); sendReminder.mutate({ id: doc.id }) }}><Bell className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setRenewDoc(doc) }}><Clock className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(doc) }}><FileText className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-muted-foreground mb-2">Details</h4>
                            <p><span className="text-muted-foreground">Issue Date:</span> {doc.issueDate ? format(new Date(doc.issueDate), 'MMM dd, yyyy') : 'N/A'}</p>
                            <p><span className="text-muted-foreground">Amount:</span> {doc.amount ? `₹${doc.amount}` : 'N/A'}</p>
                            <p><span className="text-muted-foreground">Issuer:</span> {doc.issuer || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-muted-foreground mb-2">Reminders</h4>
                            {doc.reminders?.length ? doc.reminders.slice(0, 3).map((r: any) => (
                              <p key={r.id} className="text-muted-foreground">{r.type} • {r.daysBefore}d before</p>
                            )) : <p className="text-muted-foreground">No reminders sent yet</p>}
                          </div>
                          <div>
                            <h4 className="font-medium text-muted-foreground mb-2">Notes</h4>
                            <p className="text-muted-foreground">{doc.notes || 'No notes'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {renewDoc && <DocumentRenewModal document={renewDoc} onClose={() => setRenewDoc(null)} />}
    </div>
  )
}

function DocumentModal({ isOpen, onClose, mode, document, vehicleId }: any) {
  const { data: vehiclesRaw } = useVehicles()
  const vehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw : vehiclesRaw?.vehicles || []
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const [formData, setFormData] = useState<any>({
    vehicleId: vehicleId || '',
    type: 'RC',
    number: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    amount: '',
    notes: '',
  })
  const [file, setFile] = useState<File | null>(null)

  React.useEffect(() => {
    if (document && mode === 'edit') {
      setFormData({
        vehicleId: document.vehicleId,
        type: document.type,
        number: document.number || '',
        issuer: document.issuer || '',
        issueDate: document.issueDate ? format(new Date(document.issueDate), 'yyyy-MM-dd') : '',
        expiryDate: document.expiryDate ? format(new Date(document.expiryDate), 'yyyy-MM-dd') : '',
        amount: document.amount || '',
        notes: document.notes || '',
      })
    } else {
      setFormData({ vehicleId: vehicleId || '', type: 'RC', number: '', issuer: '', issueDate: '', expiryDate: '', amount: '', notes: '' })
      setFile(null)
    }
  }, [document, mode, vehicleId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = { ...formData, amount: formData.amount ? parseFloat(formData.amount) : undefined, file: file || undefined }
    if (mode === 'create') {
      await createMutation.mutateAsync(submitData)
      toast.success('Document created')
    } else if (document) {
      await updateMutation.mutateAsync({ id: document.id, formData: submitData })
      toast.success('Document updated')
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'create' ? 'Add Document' : 'Edit Document'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Vehicle *</Label>
            <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
              <SelectContent>{vehicles?.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.reg} - {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Document Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Number</Label>
              <Input value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} placeholder="e.g., MH12AB1234" />
            </div>
          </div>
          <div>
            <Label>Issuer / Authority</Label>
            <Input value={formData.issuer} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} placeholder="e.g., RTO Mumbai" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Issue Date</Label><Input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} /></div>
            <div><Label>Expiry Date *</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} required /></div>
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" step="0.01" />
          </div>
          <div>
            <Label>Attach File</Label>
            <Input type="file" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            {file && <p className="text-sm text-muted-foreground mt-1">{file.name}</p>}
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">{createMutation.isPending || updateMutation.isPending ? 'Saving...' : mode === 'create' ? 'Add Document' : 'Update Document'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentRenewModal({ document, onClose }: any) {
  const renewMutation = useRenewDocument()
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await renewMutation.mutateAsync({ id: document.id, newExpiryDate, amount: amount ? parseFloat(amount) : undefined, notes })
    toast.success('Document renewed')
    onClose()
  }

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Renew Document</DialogTitle></DialogHeader>
        <div className="bg-muted rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground">Current Document</p>
          <p className="font-medium">{DOCUMENT_TYPE_LABELS[document.type]}</p>
          <p className="text-sm text-muted-foreground">Current Expiry: {document.expiryDate ? format(new Date(document.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>New Expiry Date *</Label><Input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} required /></div>
          <div><Label>Renewal Cost (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Renewal notes..." /></div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={renewMutation.isPending} className="flex-1">{renewMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentCalendar({ vehicleId }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { data: documentsRaw } = useDocumentsByVehicle(vehicleId || 'all')
  const documents = Array.isArray(documentsRaw) ? documentsRaw : documentsRaw?.documents || []

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay())
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()))

  const days: Date[] = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }

  const getDocsForDay = (date: Date) => documents?.filter((doc: any) => doc.expiryDate && new Date(doc.expiryDate).toDateString() === date.toDateString()) || []

  const getStatusColor = (doc: any) => {
    const daysUntil = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0
    if (daysUntil < 0) return 'bg-red-500'
    if (daysUntil <= 7) return 'bg-orange-500'
    if (daysUntil <= 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const selectedDayDocs = selectedDate ? getDocsForDay(selectedDate) : []

  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" />Document Calendar</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>&lt;</Button>
            <span className="font-semibold min-w-[140px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>&gt;</Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-muted-foreground">Expired</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-muted-foreground">&lt; 7 days</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-muted-foreground">&lt; 30 days</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-muted-foreground">Active</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayDocs = getDocsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = selectedDate?.toDateString() === day.toDateString()
              return (
                <div key={i} onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all hover:bg-muted ${!isCurrentMonth ? 'opacity-30' : ''} ${isToday ? 'ring-2 ring-primary' : ''} ${isSelected ? 'bg-muted' : ''}`}>
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>{day.getDate()}</div>
                  <div className="space-y-1">
                    {dayDocs.slice(0, 2).map((doc: any) => (
                      <div key={doc.id} className={`text-xs px-1 py-0.5 rounded text-white truncate ${getStatusColor(doc)}`} title={DOCUMENT_TYPE_LABELS[doc.type]}>{DOCUMENT_TYPE_LABELS[doc.type]}</div>
                    ))}
                    {dayDocs.length > 2 && <div className="text-xs text-muted-foreground text-center">+{dayDocs.length - 2}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}</h3>
          {selectedDayDocs.length === 0 ? (
            <div className="text-center py-8"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No documents expiring</p></div>
          ) : (
            <div className="space-y-3">
              {selectedDayDocs.map((doc: any) => {
                const daysUntil = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0
                return (
                  <div key={doc.id} className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(doc)}`}><FileText className="w-4 h-4 text-white" /></div>
                      <div>
                        <h4 className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[doc.type]}</h4>
                        <p className="text-xs text-muted-foreground">{doc.vehicle?.reg} {doc.number ? `• ${doc.number}` : ''}</p>
                        <p className={`text-xs mt-1 ${daysUntil < 0 ? 'text-red-500' : daysUntil <= 7 ? 'text-orange-500' : 'text-green-500'}`}>
                          {daysUntil < 0 ? 'Expired' : `${daysUntil} days left`}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}