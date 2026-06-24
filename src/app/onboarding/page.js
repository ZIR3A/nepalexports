"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    avatarUrl: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "GB", // default
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    // Set default avatar from Google if available and not yet set
    if (session?.user?.image && !formData.avatarUrl) {
      setFormData((prev) => ({ ...prev, avatarUrl: session.user.image }));
    }
  }, [status, session, router, formData.avatarUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      if (data.url) {
        setFormData({ ...formData, avatarUrl: data.url });
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
      setError("Please enter a valid phone number.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        phoneNumber: formData.phoneNumber,
        avatarUrl: formData.avatarUrl,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        }
      };

      const res = await fetch('/api/users/kyc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local session
      await update({ kycStatus: 'COMPLETED' });
      
      // Redirect to storefront/home
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already completed, redirect away (in case they navigate back here)
  if (session.user.kycStatus === "COMPLETED") {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-8 border-b">
          <CardTitle className="text-3xl font-bold tracking-tight">Complete Your Profile</CardTitle>
          <CardDescription className="text-base">
            Welcome to ExportHub! We need a few more details before you can start shopping.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-8">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                {error}
              </div>
            )}

            {/* Profile Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
                <Avatar className="w-32 h-32 border-4 border-background shadow-sm">
                  <AvatarImage src={formData.avatarUrl || session.user.image} />
                  <AvatarFallback className="text-2xl">{session.user.name?.[0]}</AvatarFallback>
                </Avatar>
                
                <div className="relative">
                  <Input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                  <Button type="button" variant="outline" size="sm" className="w-full" disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isUploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Optional. Your Google avatar will be used by default.
                </p>
              </div>

              <div className="space-y-4 w-full md:w-2/3">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={session.user.name || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Name is synced from your Google account.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <PhoneInput
                    id="phone"
                    international
                    defaultCountry={formData.country === "UK" ? "GB" : formData.country}
                    value={formData.phoneNumber}
                    onChange={(val) => setFormData({...formData, phoneNumber: val})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    numberInputProps={{
                      className: "w-full border-none bg-transparent focus:outline-none ml-2"
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-8 space-y-6">
              <h3 className="font-semibold text-lg">Shipping Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input 
                    id="street" 
                    placeholder="123 ExportHub Street" 
                    required 
                    value={formData.street}
                    onChange={e => setFormData({...formData, street: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    placeholder="London" 
                    required 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input 
                    id="state" 
                    placeholder="Greater London" 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal">Postal / Zip Code *</Label>
                  <Input 
                    id="postal" 
                    placeholder="SW1A 1AA" 
                    required 
                    value={formData.postalCode}
                    onChange={e => setFormData({...formData, postalCode: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(val) => setFormData({...formData, country: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="NP">Nepal</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-6 border-t bg-muted/20 rounded-b-xl">
            <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                "Complete Onboarding"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
