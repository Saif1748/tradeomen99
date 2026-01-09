import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-Auth"; // Fixed Import Path
import { supabase } from "@/integrations/supabase/client";
import { authApi } from "@/services/api/modules/auth"; // Import Backend API
import { Loader2, Save } from "lucide-react"; // Using Lucide for stability

export const ProfileSection = () => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Local state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  // Load real data when component mounts
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      const fullName = user.user_metadata?.full_name || "";
      const names = fullName.split(" ");
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
      // Load bio from metadata if it exists
      setBio(user.user_metadata?.bio || "");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      // 1. Update Supabase (Auth Metadata)
      const { error: supabaseError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          bio: bio 
        }
      });

      if (supabaseError) throw supabaseError;

      // 2. Update Python Backend (Postgres Database)
      // This ensures the database stays in sync with the auth session
      await authApi.updateProfile({
        preferences: {
          bio: bio,
          full_name: fullName // Persist name preference if needed by backend logic
        }
      });

      // 3. Refresh local profile context
      await refreshProfile();

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground text-xl font-medium shadow-lg">
          {firstName ? firstName[0]?.toUpperCase() : "U"}
          {lastName ? lastName[0]?.toUpperCase() : ""}
        </div>
        <div className="flex-1">
          <Button variant="outline" size="sm" disabled className="opacity-50">
            Change Avatar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={email}
          disabled 
          className="opacity-75 cursor-not-allowed bg-secondary/20"
        />
        <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio" 
          placeholder="Tell us about yourself..." 
          className="resize-none bg-background/50" 
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="glow-button text-white w-full sm:w-auto">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2"/>
        ) : (
          <Save className="w-4 h-4 mr-2"/>
        )}
        Save Changes
      </Button>
    </div>
  );
};