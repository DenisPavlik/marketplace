"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { updateProfile } from "@/app/actions/profile";

export function ProfileForm({ initialName, initialBio }: { initialName: string; initialBio: string }) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [errors, setErrors] = useState<{ displayName?: string; bio?: string }>({});
  const [pending, startTransition] = useTransition();
  const dirty = name !== initialName || bio !== initialBio;

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ displayName: name, bio });
      if (!res.ok) {
        setErrors({ displayName: res.fieldErrors?.displayName?.[0], bio: res.fieldErrors?.bio?.[0] });
        toast.error(res.error);
        return;
      }
      setErrors({});
      toast.success("Profile saved");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Display name" htmlFor="display-name" error={errors.displayName} hint="Shown on your listings and in messages.">
        <Input id="display-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.displayName)} />
      </Field>
      <Field label="About you" htmlFor="bio" error={errors.bio} hint={`${bio.length} / 500 · Neighborhood, what you usually sell, best pickup times`}>
        <Textarea id="bio" value={bio} maxLength={500} rows={4} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
