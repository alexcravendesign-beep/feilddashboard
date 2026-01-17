import { useState, useEffect } from "react";
import { api, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Search, FileText, Download, Send, Trash2, Eye, PoundSterling } from "lucide-react";

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-amber-100 text-amber-800",
};

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [form, setForm] = useState({
    customer_id: "",
    site_id: "",
    lines: [{ description: "", quantity: 1, unit_price: 0, type: "labour" }],
    notes: "",
    valid_days: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesRes, customersRes, sitesRes] = await Promise.all([
        api.get("/quotes"),
        api.get("/customers"),
        api.get("/sites"),
      ]);
      setQuotes(quotesRes.data);
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/quotes", form);
      toast.success("Quote created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create quote");
    }
  };

  const handleStatusChange = async (quoteId, status) => {
    try {
      await api.put(`/quotes/${quoteId}/status?status=${status}`);
      toast.success("Quote status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) return;
    try {
      await api.delete(`/quotes/${id}`);
      toast.success("Quote deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete quote");
    }
  };

  const downloadPDF = (quoteId) => {
    const token = localStorage.getItem("token");
    window.open(`${API}/quotes/${quoteId}/pdf?token=${token}`, "_blank");
  };

  const resetForm = () => {
    setSelectedCustomer("");
    setForm({
      customer_id: "",
      site_id: "",
      lines: [{ description: "", quantity: 1, unit_price: 0, type: "labour" }],
      notes: "",
      valid_days: 30,
    });
  };

  const addLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { description: "", quantity: 1, unit_price: 0, type: "labour" }],
    });
  };

  const removeLine = (index) => {
    setForm({
      ...form,
      lines: form.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...form.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setForm({ ...form, lines: newLines });
  };

  const calculateTotal = () => {
    const subtotal = form.lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
    const vat = subtotal * 0.2;
    return { subtotal, vat, total: subtotal + vat };
  };

  const filteredQuotes = quotes.filter((q) => {
    const customer = customers.find((c) => c.id === q.customer_id);
    return (
      q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getCustomerName = (id) => customers.find((c) => c.id === id)?.company_name || "Unknown";
  const filteredSites = selectedCustomer ? sites.filter((s) => s.customer_id === selectedCustomer) : sites;
  const totals = calculateTotal();

  return (
    <div className="space-y-6" data-testid="quotes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Quotes</h1>
          <p className="text-slate-500 text-sm">Create and manage quotations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="create-quote-btn">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading">Create Quote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={(v) => {
                      setSelectedCustomer(v);
                      setForm({ ...form, customer_id: v, site_id: "" });
                    }}
                  >
                    <SelectTrigger data-testid="quote-customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site *</Label>
                  <Select
                    value={form.site_id}
                    onValueChange={(v) => setForm({ ...form, site_id: v })}
                    disabled={!selectedCustomer}
                  >
                    <SelectTrigger data-testid="quote-site-select">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <Label>Line Items</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {form.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Select value={line.type} onValueChange={(v) => updateLine(index, "type", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labour">Labour</SelectItem>
                            <SelectItem value="parts">Parts</SelectItem>
                            <SelectItem value="callout">Callout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={line.unit_price}
                          onChange={(e) => updateLine(index, "unit_price", parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1">
                        {form.lines.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>£{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (20%):</span>
                  <span>£{totals.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>£{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid For (days)</Label>
                  <Input
                    type="number"
                    value={form.valid_days}
                    onChange={(e) => setForm({ ...form, valid_days: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="save-quote-btn">
                  Create Quote
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="quote-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No quotes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="table-row-hover" data-testid={`quote-row-${quote.id}`}>
                    <TableCell className="font-medium mono">{quote.quote_number}</TableCell>
                    <TableCell>{getCustomerName(quote.customer_id)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <PoundSterling className="h-3 w-3" />
                        {quote.total?.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={quote.status} onValueChange={(v) => handleStatusChange(quote.id, v)}>
                        <SelectTrigger className="w-28 h-8">
                          <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{quote.valid_until?.split("T")[0]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadPDF(quote.id)}
                          title="Download PDF"
                          data-testid={`download-quote-${quote.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(quote.id)}
                          data-testid={`delete-quote-${quote.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Quotes;
