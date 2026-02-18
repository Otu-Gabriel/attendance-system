"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import WebcamCapture from "@/components/face-recognition/WebcamCapture";
import { descriptorToString } from "@/lib/face-recognition";

interface Employee {
  id: string;
  email: string;
  name: string;
  employeeId: string | null;
  department: string | null;
  position: string | null;
  isActive: boolean;
  faceImageUrl: string | null;
}

export default function AdminEmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    employeeId: "",
    department: "",
    position: "",
  });
  const [faceImageData, setFaceImageData] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/employee/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchEmployees();
    }
  }, [status, session, router]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceCapture = (imageData: string, descriptor: Float32Array) => {
    setFaceImageData(imageData);
    setFaceDescriptor(descriptor);
    toast.success("Face captured successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name || (!editingId && !formData.password)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = "/api/employees";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId && { id: editingId }),
          ...formData,
          ...(faceImageData && { faceImageUrl: faceImageData }),
          ...(faceDescriptor && { faceDescriptor: Array.from(faceDescriptor) }),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Employee updated" : "Employee added");
        setIsAdding(false);
        setEditingId(null);
        setFormData({
          email: "",
          name: "",
          password: "",
          employeeId: "",
          department: "",
          position: "",
        });
        setFaceImageData(null);
        setFaceDescriptor(null);
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to save employee");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Employee deleted");
        fetchEmployees();
      } else {
        toast.error("Failed to delete employee");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const startEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      email: employee.email,
      name: employee.name,
      password: "",
      employeeId: employee.employeeId || "",
      department: employee.department || "",
      position: employee.position || "",
    });
    setFaceImageData(employee.faceImageUrl);
    setIsAdding(true);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] dark:border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-[#64748B] dark:text-[#94A3B8]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
          Employee Management
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg">
          Manage employees and register their faces
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employees</CardTitle>
            <Button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setFormData({
                  email: "",
                  name: "",
                  password: "",
                  employeeId: "",
                  department: "",
                  position: "",
                });
                setFaceImageData(null);
                setFaceDescriptor(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border border-[#E2E8F0] dark:border-[#334155] rounded-lg bg-[#F8FAFC] dark:bg-[#1E293B]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={!!editingId}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password {!editingId && "*"}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingId}
                    placeholder={editingId ? "Leave blank to keep current" : ""}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Employee ID</label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Department</label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Position</label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Face Registration</label>
                <WebcamCapture onCapture={handleFaceCapture} />
                {faceImageData && (
                  <div className="mt-2">
                    <img
                      src={faceImageData}
                      alt="Captured face"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update" : "Add"} Employee
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {employees.length === 0 ? (
            <p className="text-[#64748B] dark:text-[#94A3B8]">No employees registered</p>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border border-[#E2E8F0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {employee.faceImageUrl && (
                      <img
                        src={employee.faceImageUrl}
                        alt={employee.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{employee.name}</h3>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                        {employee.email}
                      </p>
                      {employee.employeeId && (
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          ID: {employee.employeeId}
                        </p>
                      )}
                      {employee.department && (
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          {employee.department} - {employee.position}
                        </p>
                      )}
                    </div>
                    {employee.isActive ? (
                      <span className="text-xs bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7] px-2 py-1 rounded font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-[#F1F5F9] text-[#475569] dark:bg-[#334155] dark:text-[#94A3B8] px-2 py-1 rounded font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
