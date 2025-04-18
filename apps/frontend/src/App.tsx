import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import './App.css'
import Routing from "./route";
import { BrowserRouter, Link } from "react-router-dom";
import Notify from "./pages/Notify";
import Footer from "./pages/Footer";

function App() {
  return (
    <BrowserRouter>
      <header className="backdrop-blur-lg fixed w-full z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1 p-1">
              <span className="sr-only">avira</span>
              <img className="h-9 w-auto" src="https://img.icons8.com/?size=100&id=40496&format=png&color=000000" alt="" />
            </Link>
          </div>
          <div className="flex gap-4">

            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
            <Link
                  to="/profile"
                  className=" py-2 m-1 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  My Profile
                </Link>
                
              <Notify />

              <a
                href="https://www.buymeacoffee.com/adityahota"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block py-2 m-1 text-sm font-medium text-gray-700 cursor-pointer"
              >
                ☕ Buy me a coffee
              </a>

            </SignedIn>
          </div>
        </nav>
      </header>
      
      <Routing />
      <Footer/>
    </BrowserRouter>
  )
}

export default App
