export const metadata = {
  title: "Live Football Outcome Simulator",
  description: "Live football outcome simulator with weather-aware probability modeling for Everton and beyond",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
