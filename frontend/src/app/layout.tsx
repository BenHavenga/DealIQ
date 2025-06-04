export const metadata = {
  title: "DealIQ – AI-Powered Investment Memo Generator",
  description:
    "Generate professional investment memos using real-time financial data and large language models with DealIQ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white antialiased transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
