"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, UserSettings } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { getBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Save } from "lucide-react";
import { InstagramIcon, FacebookIcon, XIcon, DiscordIcon } from "@/components/ui/SocialIcons";
import Image from "next/image";

const BUCKET = "profile-pics";

const SOCIAL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  facebook:  "https://facebook.com/",
  x:         "https://x.com/",
  discord:   "https://discord.gg/",
};

function normalizeSocial(key: string, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${SOCIAL_BASE[key]}${v}`;
}

function DefaultAvatar({ name, size = 80 }: { name?: string | null; size?: number }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : null;
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id="settingsAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b57e04" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#settingsAvatarGrad)" />
      {initials ? (
        <text
          x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          fill="white" fontSize="28" fontWeight="bold" fontFamily="system-ui, sans-serif"
        >
          {initials}
        </text>
      ) : (
        /* User silhouette — head + shoulders, visually centred */
        <g fill="white" opacity="0.9">
          <circle cx="40" cy="31" r="9" />
          <path d="M16 57 C16 45 64 45 64 57" />
        </g>
      )}
    </svg>
  );
}

export default function SettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const mainPicRef = useRef<HTMLInputElement>(null);
  const coverPicRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    userName: "",
    bioBrief: "",
    bioDetail: "",
    mainPic: null as string | null,
    coverPic: null as string | null,
    instagram: "",
    facebook: "",
    x: "",
    discord: "",
  });
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState<"main" | "cover" | null>(null);
  const [userNameError, setUserNameError] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    enabled: !!user,
  });

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        name: settings.name ?? "",
        userName: settings.userName ?? "",
        bioBrief: settings.bioBrief ?? "",
        bioDetail: settings.bioDetail ?? "",
        mainPic: settings.mainPic,
        coverPic: settings.coverPic,
        instagram: settings.instagram ?? "",
        facebook: settings.facebook ?? "",
        x: settings.x ?? "",
        discord: settings.discord ?? "",
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () =>
      api.updateSettings({
        name: form.name || undefined,
        userName: form.userName || undefined,
        mainPic: form.mainPic,
        coverPic: form.coverPic,
        bioBrief: form.bioBrief || undefined,
        bioDetail: form.bioDetail || undefined,
        instagram: normalizeSocial("instagram", form.instagram),
        facebook:  normalizeSocial("facebook",  form.facebook),
        x:         normalizeSocial("x",         form.x),
        discord:   normalizeSocial("discord",   form.discord),
      }),
    onSuccess: (updated: UserSettings) => {
      qc.setQueryData(["settings"], updated);
      setUserNameError(null);
      toast({ title: "Settings saved", variant: "success" });
    },
    onError: (err: Error) => {
      if (err.message === "Username is already taken") {
        setUserNameError("This username is already taken. Please choose another.");
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const uploadImage = async (file: File, type: "main" | "cover") => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }
    setUploading(type);
    try {
      const supabase = getBrowserClient();
      const path = `${user.id}/${type}-pic`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      // Cache-bust so browser shows the updated image immediately
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setForm((f) => ({
        ...f,
        [type === "main" ? "mainPic" : "coverPic"]: url,
      }));
      // Auto-save the new URL to the backend immediately
      const field = type === "main" ? "mainPic" : "coverPic";
      const updated = await api.updateSettings({ [field]: url });
      qc.setQueryData(["settings"], updated);
      toast({ title: type === "main" ? "Profile photo updated" : "Cover photo updated", variant: "success" });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-foreground mb-1">Settings</h1>
      <p className="text-muted-foreground font-ui text-sm mb-8">Manage your public profile</p>

      {/* Cover + Avatar section */}
      <div className="relative mb-16">
        {/* Cover photo */}
        <div
          className="h-36 rounded-2xl bg-gradient-to-br from-[#b57e04]/20 to-[#d4a017]/10 border border-border overflow-hidden relative group cursor-pointer"
          onClick={() => coverPicRef.current?.click()}
        >
          {form.coverPic ? (
            <Image src={form.coverPic} alt="Cover" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-xs font-ui">Click to add cover photo</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading === "cover" ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <div className="flex items-center gap-2 text-white text-sm font-ui">
                <Camera className="w-4 h-4" />
                {form.coverPic ? "Change cover" : "Add cover"}
              </div>
            )}
          </div>
        </div>

        {/* Avatar — overlaps cover bottom */}
        <div className="absolute -bottom-10 left-6">
          <div
            className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-muted cursor-pointer relative group"
            onClick={() => mainPicRef.current?.click()}
          >
            {form.mainPic ? (
              <Image src={form.mainPic} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <DefaultAvatar name={form.name} size={80} />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploading === "main" ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={mainPicRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "main"); e.target.value = ""; }}
      />
      <input
        ref={coverPicRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "cover"); e.target.value = ""; }}
      />

      {/* Profile form */}
      <Card className="gradient-border-card bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Name</Label>
              <Input
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="focus-visible:ring-[#b57e04] font-ui"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  placeholder="your_handle"
                  value={form.userName}
                  onChange={(e) => {
                    setUserNameError(null);
                    setForm((f) => ({
                      ...f,
                      userName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    }));
                  }}
                  className={`pl-7 focus-visible:ring-[#b57e04] font-mono ${userNameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {userNameError && (
                <p className="text-destructive text-xs mt-1 font-ui">{userNameError}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">
              Bio Brief{" "}
              <span className="text-muted-foreground font-normal">(tagline, ≤200 chars)</span>
            </Label>
            <Input
              placeholder="AI automation specialist."
              value={form.bioBrief}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, bioBrief: e.target.value }))}
              className="focus-visible:ring-[#b57e04] font-ui"
            />
            <p className="text-muted-foreground text-xs mt-1 font-ui text-right">
              {form.bioBrief.length}/200
            </p>
          </div>

          <div>
            <Label className="text-foreground text-sm font-medium mb-2 block font-ui">Bio Detail</Label>
            <Textarea
              placeholder="Tell people more about you, your experience, what you've built..."
              value={form.bioDetail}
              onChange={(e) => setForm((f) => ({ ...f, bioDetail: e.target.value }))}
              className="resize-none min-h-[120px] focus-visible:ring-[#b57e04] font-ui"
            />
          </div>

          {/* Social links */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-3 block font-ui">Social Links</Label>
            <div className="space-y-3">
              {[
                { key: "instagram", Icon: InstagramIcon, placeholder: "https://instagram.com/yourhandle", label: "Instagram" },
                { key: "facebook",  Icon: FacebookIcon,  placeholder: "https://facebook.com/yourpage",   label: "Facebook"  },
                { key: "x",         Icon: XIcon,         placeholder: "https://x.com/yourhandle",        label: "X"         },
                { key: "discord",   Icon: DiscordIcon,   placeholder: "https://discord.gg/invite/...",   label: "Discord"   },
              ].map(({ key, Icon, placeholder, label }) => (
                <div key={key} className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Icon size={15} />
                  </span>
                  <Input
                    type="url"
                    placeholder={placeholder}
                    aria-label={label}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="pl-8 focus-visible:ring-[#b57e04] font-ui text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => save()}
            disabled={saving || !!uploading}
            className="w-full gap-2 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
