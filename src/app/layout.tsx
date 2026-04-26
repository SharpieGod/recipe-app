import "~/styles/globals.css";

import { type Metadata } from "next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { ourFileRouter } from "~/app/api/uploadthing/core";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Recipe Notebook",
  description: "An extensive website for keeping recipes.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`font-noto tracking-wide`}>
      <body className="bg-background-50 text-text-800 min-h-screen">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
