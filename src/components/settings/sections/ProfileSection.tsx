import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, FloppyDisk } from "@phosphor-icons/react";

export const ProfileSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Local state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState(""); // Note: Requires a 'bio' column in your profiles table if you want to persist this

  // Load real data when component mounts
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      const fullName = user.user_metadata?.full_name || "";
      const names = fullName.split(" ");
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
      // If you have metadata for bio: setBio(user.user_metadata?.bio || "");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          // bio: bio // Add this to user_metadata if you want to save it
        }
      });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center text-primary-foreground text-xl font-medium">
          {firstName ? firstName[0]?.toUpperCase() : "U"}
          {lastName ? lastName[0]?.toUpperCase() : ""}
        </div>
        <div className="flex-1">
          <Button variant="outline" size="sm" disabled>Change Avatar</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
        <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio" 
          placeholder="Tell us about yourself..." 
          className="resize-none" 
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="glow-button text-white">
        {loading ? <Spinner className="w-4 h-4 animate-spin mr-2"/> : <FloppyDisk className="w-4 h-4 mr-2"/>}
        Save Changes
      </Button>
    </div>
  );
};