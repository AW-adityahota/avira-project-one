import { Route, Routes } from "react-router-dom";
import BlogEditor from "./pages/WriteBlog";
import BackgroundPaths from "./pages/home";
import AllBlogs from "./pages/AllBlogs";

export default function Routing() {
  return (
    <Routes>
      <Route path="/user/writeblog" element={<BlogEditor />} />
      <Route path="/" element={<BackgroundPaths />} />
      <Route path="/blogs" element={<AllBlogs />} />
    </Routes>
  );
}
