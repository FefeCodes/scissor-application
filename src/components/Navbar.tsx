import { Link } from "react-router-dom";
import {
  SignInButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6 flex justify-between items-center text-gray-200">
      <Link
        to="/"
        className="text-2xl font-extrabold text-blue-600 tracking-tight"
      >
        Scissor
      </Link>

      <div className="flex items-center gap-6">
        <SignedIn>
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-blue-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className="text-sm font-medium hover:text-blue-800 transition-colors"
          >
            Analytics
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg font-semibold text-sm">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}
