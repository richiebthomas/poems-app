import Navbar from "../components/Navbar";
import { AuthProvider } from "../app/context/AuthContext"; // Import AuthProvider
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider> {/* Wrap everything inside AuthProvider */}
          <Navbar />
          <main className="p-4 max-w-2xl mx-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
