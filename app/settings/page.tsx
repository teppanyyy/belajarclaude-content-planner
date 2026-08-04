import { getBrandStyleGuide } from "@/lib/brand";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const styleGuide = await getBrandStyleGuide();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Brand Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          This visual style guide is automatically included every time an image prompt
          is generated on the New Post and Weekly Plan pages, so every post stays
          consistent without needing to re-explain the brand each time.
        </p>
      </div>
      <SettingsForm initialStyleGuide={styleGuide} />
    </div>
  );
}
