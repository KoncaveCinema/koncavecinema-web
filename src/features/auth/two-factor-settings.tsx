// Client code without its own "use client": only client components import it, so its
// callbacks never cross from the server.

import { Copy, Download, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ErrorCode, toApiError } from "@/api";
import type { TwoFactorSetup, UserProfile } from "@/api/auth/auth-schemas";
import {
  beginTwoFactorSetup,
  disableTwoFactor,
  enableTwoFactor,
  getProfile,
} from "@/api/auth/auth-api";
import { QrCode } from "@/components/cinema/qr-code";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { CodeField, isSixDigits } from "./code-field";
import { FieldLabel, FormAlert, PasswordInput, fieldClass } from "./form-parts";
import { isStaff } from "./roles";
import { useSession } from "./session";

/** The secret in fours, for typing into the app by hand */
const inFours = (secret: string) => secret.match(/.{1,4}/g)?.join(" ") ?? secret;

function setupFailure(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.is(ErrorCode.TWO_FACTOR_CODE_INVALID)) {
    return "That code isn't right. Check the time on your phone is set automatically, then try the newest code.";
  }
  if (apiError.is(ErrorCode.RATE_LIMITED)) return "Too many tries. Wait a minute, then try again.";
  if (apiError.is(ErrorCode.NETWORK_ERROR)) {
    return "We couldn't reach Koncave Cinema. Check your connection and try again.";
  }
  return "That didn't work just now. Please try again.";
}

/** The ten recovery codes, shown once: copied or downloaded, and confirmed as saved */
function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const text = codes.join("\n");
  const copy = () =>
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Recovery codes copied."),
      () => toast.error("Your browser didn't allow copying. Download them instead."),
    );
  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`Koncave Cinema recovery codes\n\n${text}\n`]));
    link.download = "koncave-cinema-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/65">
        If you lose your phone, each of these signs you in once instead of a code. They won&apos;t
        be shown again, so keep them somewhere safe, like a password manager.
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/3 p-4 font-mono text-sm tracking-wider">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}>
          <Copy data-icon="inline-start" />
          Copy
        </Button>
        <Button variant="outline" onClick={download}>
          <Download data-icon="inline-start" />
          Download
        </Button>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={saved} onCheckedChange={(value) => setSaved(value === true)} />I have
        saved these codes
      </label>
      <Button className="w-full" disabled={!saved} onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

/**
 * Turning two-factor sign-in on: the app scans the QR (or takes the secret by hand), its first
 * code switches it on, then the recovery codes show once. The new session, and the profile that
 * says two-factor is on, take effect only when the codes are saved: the staff console opens
 * on that, and must not open before the codes are seen.
 */
export function TwoFactorSetupFlow({ onDone }: { onDone: () => void }) {
  const setUser = useSession((state) => state.setUser);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<{ user: UserProfile; recoveryCodes: string[] } | null>(
    null,
  );

  const start = async () => {
    setBusy(true);
    setFailure(null);
    try {
      setSetup(await beginTwoFactorSetup());
    } catch (error) {
      // Already on (another tab): the profile says so once read again
      if (toApiError(error).is(ErrorCode.TWO_FACTOR_ALREADY_ENABLED)) {
        setUser(await getProfile());
        onDone();
        return;
      }
      setFailure(setupFailure(error));
    } finally {
      setBusy(false);
    }
  };

  const enable = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      setEnabled(await enableTwoFactor(value));
    } catch (error) {
      const apiError = toApiError(error);
      setCode("");
      if (apiError.is(ErrorCode.TWO_FACTOR_SETUP_EXPIRED)) {
        setSetup(null);
        setFailure("That took more than 10 minutes. Start again for a new QR code.");
      } else if (apiError.is(ErrorCode.TWO_FACTOR_ALREADY_ENABLED)) {
        setUser(await getProfile());
        onDone();
      } else {
        setFailure(setupFailure(error));
      }
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return (
      <RecoveryCodes
        codes={enabled.recoveryCodes}
        onDone={() => {
          setUser(enabled.user);
          toast.success("Two-factor sign-in is on.");
          onDone();
        }}
      />
    );
  }

  if (!setup) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/65">
          You&apos;ll need an authenticator app on your phone: Google Authenticator, Microsoft
          Authenticator, Authy or 1Password.
        </p>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button disabled={busy} onClick={() => void start()}>
          <KeyRound data-icon="inline-start" />
          {busy ? "Starting…" : "Start"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/65">
        Scan this with Google Authenticator, Microsoft Authenticator, Authy or 1Password, then enter
        the 6-digit code it shows.
      </p>
      <div className="mx-auto size-48">
        <QrCode payload={setup.otpauthUri} label="QR code for your authenticator app" />
      </div>
      <div className="text-center text-sm">
        <p className="text-white/50">Can&apos;t scan? Type this key into the app:</p>
        <p className="mt-1 font-mono text-base tracking-wider break-all select-all">
          {inFours(setup.secret)}
        </p>
      </div>
      <div>
        <FieldLabel htmlFor="setup-code">Code from the app</FieldLabel>
        <div className="mt-2 flex justify-center">
          <CodeField
            id="setup-code"
            value={code}
            onChange={setCode}
            onComplete={(value) => void enable(value)}
            disabled={busy}
            invalid={failure !== null}
          />
        </div>
      </div>
      {failure && <FormAlert>{failure}</FormAlert>}
      <Button
        className="w-full"
        disabled={!isSixDigits(code) || busy}
        onClick={() => void enable(code)}
      >
        {busy ? "Checking…" : "Turn on"}
      </Button>
    </div>
  );
}

/** Turning it off: the password and a current code (or a recovery code) */
function TurnOff({ staff, onDone }: { staff: boolean; onDone: () => void }) {
  const setUser = useSession((state) => state.setUser);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<ReactNode>(null);
  const [busy, setBusy] = useState(false);
  const ready = password.length > 0 && code.trim().length >= 6;

  const turnOff = async () => {
    setBusy(true);
    setFailure(null);
    try {
      setUser(await disableTwoFactor(password, code.trim()));
      toast.success("Two-factor sign-in is off.");
      onDone();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.is(ErrorCode.TWO_FACTOR_NOT_ENABLED)) {
        setUser(await getProfile());
        onDone();
        return;
      }
      setFailure(
        apiError.is(ErrorCode.INVALID_CREDENTIALS)
          ? "That password isn't right."
          : apiError.is(ErrorCode.TWO_FACTOR_CODE_INVALID)
            ? "That code isn't right, or it has been used."
            : setupFailure(error),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && !busy) void turnOff();
      }}
    >
      {staff && <FormAlert>The admin tools stop working until you turn it on again.</FormAlert>}
      <div>
        <FieldLabel htmlFor="off-password">Password</FieldLabel>
        <div className="mt-2">
          <PasswordInput
            id="off-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="off-code">Code from the app, or a recovery code</FieldLabel>
        <input
          id="off-code"
          autoComplete="one-time-code"
          autoCapitalize="off"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className={cn(fieldClass, "mt-2 font-mono tracking-wider")}
        />
      </div>
      {failure && <FormAlert>{failure}</FormAlert>}
      <Button type="submit" variant="destructive" className="w-full" disabled={!ready || busy}>
        {busy ? "Turning off…" : "Turn off two-factor sign-in"}
      </Button>
    </form>
  );
}

/** Settings: the "Two-factor sign-in" section, for any signed-in member */
export function TwoFactorSettings() {
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const [open, setOpen] = useState<"on" | "off" | null>(null);
  if (!user) return null;
  const on = user.twoFactorEnabled;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2.5 text-sm text-white/65">
        {on ? (
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lobby" />
        ) : (
          <ShieldOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white/45" />
        )}
        {on
          ? "On. Signing in asks for a code from your authenticator app as well as your password."
          : "Off. Turn it on and signing in also asks for a code from an app on your phone, so a stolen password alone can't get in."}
      </p>
      <Button variant={on ? "outline" : "default"} onClick={() => setOpen(on ? "off" : "on")}>
        {on ? "Turn off" : "Turn on"}
      </Button>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (next) return;
          // Closed part-way (even on the recovery codes): the profile says where things stand
          if (open === "on") void getProfile().then(setUser, () => {});
          setOpen(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open === "off" ? "Turn off two-factor sign-in?" : "Turn on two-factor sign-in"}
            </DialogTitle>
            <DialogDescription>
              {open === "off"
                ? "Signing in will ask for your password only."
                : "Every other device you're signed in on will be signed out."}
            </DialogDescription>
          </DialogHeader>
          {open === "on" && <TwoFactorSetupFlow onDone={() => setOpen(null)} />}
          {open === "off" && <TurnOff staff={isStaff(user.role)} onDone={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
