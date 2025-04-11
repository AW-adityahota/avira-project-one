import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
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
              <UserButton />
              <Notify />

              {/* <Link
                to="/user/writeblog"
                className=" m-1 ml-4 text-sm font-medium text-gray-700 cursor-pointer"
              >
                Write Blog
              </Link>
              <Link
                to="/blogs"
                className=" m-1 text-sm font-medium text-gray-700 cursor-pointer"
              >
                Explore Blogs
              </Link> */}
              <Link
                to="/game"
                className="py-2 m-1 text-sm font-medium text-gray-700 cursor-pointer"
              >
                Feeling Bored ?
              </Link>
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
