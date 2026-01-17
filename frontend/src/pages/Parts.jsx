import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle } from "lucide-react";

const Parts = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    part_number: "",
    description: "",
    unit_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await api.get("/parts");
      setParts(res.data);
    } catch (error) {
      toast.error("Failed to load parts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await api.put(`/parts/${editingPart.id}`, form);
        toast.success("Part updated");
      } else {
        await api.post("/parts", form);
        toast.success("Part created");
      }
      setDialogOpen(false);
      resetForm();
      fetchParts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save part");
    }
  };

  const handleEdit = (part) => {
    setEditingPart(part);
    setForm({
      name: part.name,
      part_number: part.part_number,
      description: part.description,
      unit_price: part.unit_price,
      stock_quantity: part.stock_quantity,
      min_stock_level: part.min_stock_level,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this part?")) return;
    try {
      await api.delete(`/parts/${id}`);
      toast.success("Part deleted");
      fetchParts();
    } catch (error) {
      toast.error("Failed to delete part");
    }
  };

  const resetForm = () => {
    setEditingPart(null);
    setForm({
      name: "",
      part_number: "",
      description: "",
      unit_price: 0,
      stock_quantity: 0,
      min_stock_level: 5,
    });
  };

  const filteredParts = parts.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockParts = parts.filter((p) => p.stock_quantity <= p.min_stock_level);

  return (
    <div className="space-y-6" data-testid="parts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Parts Catalogue</h1>
          <p className="text-slate-500 text-sm">Manage your parts inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="add-part-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="heading">{editingPart ? "Edit Part" : "Add Part"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Part Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Compressor"
                    required
                    data-testid="part-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Part Number *</Label>
                  <Input
                    value={form.part_number}
                    onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                    placeholder="e.g., CP-1234"
                    required
                    className="mono"
                    data-testid="part-number-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Part description..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit Price (£)</Label>
                  <Input
                    type="number"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Qty</Label>
                  <Input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock</Label>
                  <Input
                    type="number"
                    value={form.min_stock_level}
                    onChange={(e) => setForm({ ...form, min_stock_level: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="save-part-btn">
                  {editingPart ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {lowStockParts.length} part{lowStockParts.length > 1 ? "s" : ""} at or below minimum stock level
                </p>
                <p className="text-sm text-amber-700">
                  {lowStockParts.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="part-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No parts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id} className="table-row-hover" data-testid={`part-row-${part.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Package className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium">{part.name}</span>
                          {part.description && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">{part.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="mono">{part.part_number}</TableCell>
                    <TableCell>£{part.unit_price?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{part.stock_quantity}</span>
                        {part.stock_quantity <= part.min_stock_level && (
                          <Badge className="bg-amber-100 text-amber-800">Low</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(part)}
                          data-testid={`edit-part-${part.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(part.id)}
                          data-testid={`delete-part-${part.id}`}
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

export default Parts;
