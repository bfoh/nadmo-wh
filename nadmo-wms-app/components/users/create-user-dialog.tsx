'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, roleRequiresWarehouse } from '@/lib/auth';
import type { UserRole } from '@/types';
import { createUser } from '@/app/(dashboard)/users/actions';

interface WarehouseOption {
  id: string;
  name: string;
  type: string;
  region_id: string | null;
  code: string;
}
interface RegionOption {
  id: string;
  name: string;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return `Nadmo-${out}`;
}

export function CreateUserDialog({
  assignable,
  warehouses,
  regions,
}: {
  assignable: UserRole[];
  warehouses: WarehouseOption[];
  regions: RegionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [regionId, setRegionId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [password, setPassword] = useState(generatePassword());

  const needsWarehouse = role ? roleRequiresWarehouse(role) : false;
  const warehouseOptions = warehouses.filter((w) => !regionId || w.region_id === regionId);

  // Label maps so the Select trigger shows readable text, not the UUID value.
  const roleItems = assignable.map((r) => ({ value: r, label: ROLE_LABELS[r] }));
  const regionItems = regions.map((r) => ({ value: r.id, label: r.name }));
  const warehouseItems = warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }));

  function reset() {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('');
    setRegionId('');
    setWarehouseId('');
    setPassword(generatePassword());
    setCreatedPassword(null);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      toast.error('Please select a role');
      return;
    }
    if (needsWarehouse && !warehouseId) {
      toast.error('Please assign a warehouse for this role');
      return;
    }
    setLoading(true);
    try {
      const result = await createUser({
        firstName,
        lastName,
        email,
        phone,
        role,
        warehouseId: needsWarehouse ? warehouseId : null,
        password,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to create user');
        return;
      }
      toast.success('User created');
      setCreatedPassword(password);
      router.refresh();
    } catch {
      toast.error('Something went wrong creating the user. Check the service-role configuration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button className="bg-[#006B3F] hover:bg-[#024F2E]" />}>
        <Plus className="mr-2 h-4 w-4" />
        Create User
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {createdPassword ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#006B3F]" />
                User created
              </DialogTitle>
              <DialogDescription>
                Share this temporary password with {firstName}. They&apos;ll be asked to change it.
                It won&apos;t be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="text-sm font-semibold">{createdPassword}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(createdPassword);
                  toast.success('Copied');
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="bg-[#006B3F] hover:bg-[#024F2E]">
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Add a staff member and assign their role and warehouse.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  items={roleItems}
                  value={role}
                  onValueChange={(v) => setRole((v as UserRole) || '')}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignable.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {needsWarehouse && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Region (filter)</Label>
                  <Select
                    items={regionItems}
                    value={regionId}
                    onValueChange={(v) => {
                      setRegionId(v || '');
                      setWarehouseId('');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Warehouse</Label>
                  <Select
                    items={warehouseItems}
                    value={warehouseId}
                    onValueChange={(v) => setWarehouseId(v || '')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseOptions.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <div className="flex gap-2">
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Generate new password"
                  onClick={() => setPassword(generatePassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={loading} className="bg-[#006B3F] hover:bg-[#024F2E]">
                {loading ? 'Creating…' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
