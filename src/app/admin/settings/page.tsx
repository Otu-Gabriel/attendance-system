"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { MapPin, Plus, Edit, Trash2, Check, X } from "lucide-react";

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "100",
    address: "",
  });

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
      fetchLocations();
    }
  }, [status, session, router]);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        toast.success("Location retrieved");
      },
      (error) => {
        toast.error("Failed to get location");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.latitude || !formData.longitude || !formData.radius) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingId ? "/api/admin/locations" : "/api/admin/locations";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId && { id: editingId }),
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Location updated" : "Location added");
        setIsAdding(false);
        setEditingId(null);
        setFormData({
          name: "",
          latitude: "",
          longitude: "",
          radius: "100",
          address: "",
        });
        fetchLocations();
      } else {
        toast.error(data.error || "Failed to save location");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Location deleted");
        fetchLocations();
      } else {
        toast.error("Failed to delete location");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: location.id,
          isActive: !location.isActive,
        }),
      });

      if (res.ok) {
        toast.success("Location status updated");
        fetchLocations();
      } else {
        toast.error("Failed to update location");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius.toString(),
      address: location.address || "",
    });
    setIsAdding(true);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Location Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure allowed locations for attendance marking
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Allowed Locations</CardTitle>
            <Button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setFormData({
                  name: "",
                  latitude: "",
                  longitude: "",
                  radius: "100",
                  address: "",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Office Location"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Latitude *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    required
                    placeholder="0.0000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Longitude *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    required
                    placeholder="0.0000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Radius (meters) *</label>
                  <Input
                    type="number"
                    value={formData.radius}
                    onChange={(e) =>
                      setFormData({ ...formData, radius: e.target.value })
                    }
                    required
                    placeholder="100"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update" : "Add"} Location
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

          {locations.length === 0 ? (
            <p className="text-gray-500">No locations configured</p>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{location.name}</h3>
                      {location.isActive ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {location.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {location.address}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {location.latitude}, {location.longitude} (Radius: {location.radius}m)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(location)}
                    >
                      {location.isActive ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
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
    </div>
  );
}
