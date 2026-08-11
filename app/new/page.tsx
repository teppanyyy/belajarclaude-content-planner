import NewPostForm from "./NewPostForm";
import { getThemeOptions } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const initialThemeOptions = await getThemeOptions();
  return <NewPostForm initialThemeOptions={initialThemeOptions} />;
}
