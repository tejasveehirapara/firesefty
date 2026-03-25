import { Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AuthLayout from "@/components/layout/AuthLayout";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});


export const metadata = {
  title: "Universal Safety Solutions",
  description: "Administrative panel for Universal Safety Solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} font-sans antialiased text-gray-900 bg-gray-50`}>
        <AuthLayout>
          {children}
        </AuthLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
