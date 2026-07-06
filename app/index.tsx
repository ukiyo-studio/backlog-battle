import { Redirect } from "expo-router";

import { LoadingState } from "@/components/ui";

import { useAuth } from "./_layout";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState variant="page" className="flex-1 bg-background" />;
  }

  return <Redirect href={session ? "/(app)" : "/sign-in"} />;
}
