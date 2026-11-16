import { DollStage } from "@/components/doll/doll-stage";
import { Wordmark } from "@/components/layout/brand";
import { RedirectIfAuthed } from "@/components/layout/guards";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RedirectIfAuthed>
      <div className="min-h-dvh p-2.5 sm:p-5">
        <div className="grid min-h-[calc(100dvh-1.25rem)] overflow-hidden rounded-[36px] bg-surface sm:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col px-6 py-7 sm:px-12">
            <Wordmark />
            <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">{children}</div>
          </div>
          <div className="relative hidden p-3 lg:block">
            <div className="relative h-full overflow-hidden rounded-[28px] bg-accent text-white">
              <div aria-hidden className="absolute inset-0">
                {["left-[10%] top-[38%] w-48", "left-[52%] top-[48%] w-60", "left-[18%] top-[66%] w-56", "left-[60%] top-[80%] w-40"].map((p) => (
                  <span key={p} className={`absolute h-10 rounded-full bg-white/10 ${p}`} />
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 grid h-[78%] grid-cols-2">
                <DollStage url="/dolls/female.svg" alt="" size="hero" live className="[background:none]" />
                <DollStage url="/dolls/male.svg" alt="" size="hero" live className="[background:none]" />
              </div>
              <div className="absolute top-10 left-10 max-w-sm">
                <p className="text-2xl font-extrabold tracking-tight italic">Your clothes,</p>
                <p className="font-display text-7xl leading-[0.9]">On you</p>
                <p className="mt-4 text-[15px] text-white/85">
                  Outfits built only from your wardrobe, worn by a doll that looks like you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}
