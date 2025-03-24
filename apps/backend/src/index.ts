import express  from "express";
import { clerkClient, clerkMiddleware, getAuth, requireAuth, User } from '@clerk/express'
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client'
import { syncUser } from "./sync";
import cors from "cors"
import router from "./fileUpload";

const app = express();
const port = 3000;
app.use(express.json());

const prisma = new PrismaClient()
app.use(cors({ 
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
  })); 
  app.options('*', cors());
  app.use(clerkMiddleware()); 
  dotenv.config();

app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.use("/api/user", router); 

app.get('/api/user',requireAuth(),async (req,res)=>{
    const prismaUser = await syncUser(req);
    res.json(prismaUser); 
})

app.get('/api/blogs',requireAuth(),async (req,res)=>{
    try{

        const pages = Number(req.query.pages) ||1; 
        const limit = 3; 

        const all = await prisma.blog.findMany({
            include: {  
                author: true
            },
            skip: (pages-1)*limit,
            take:limit
        }); 
        const totalItems = await prisma.blog.count(); 
        res.json({totalItems,currentPage:pages,all,totalPages: Math.ceil(totalItems / limit)})
    }
    catch(error){
        console.error("Error fetching blogs:", error);
        res.status(500).json({msg:"failed to get all blogs"})
    }
})

app.post("/api/user/blog",requireAuth(),async(req,res)=>{
    try{
        const prismaUser = await syncUser(req);
        const { title, content } = req.body;
        const blogs = await prisma.blog.create({
            data:{
                title,
                content,
                authorId:prismaUser.id,
                published: true 
            }
        })
        res.json(blogs);
    }
    catch(error){
        console.error("Blog creation error:", error); 
  res.status(500).json({msg:"failed to post blog"})
    }
})

app.get("/api/blogs/:blogid",async(req,res)=>{
    try{
        const {blogid} =req.params; 
        const uniqueblog = await prisma.blog.findUnique({
            where:{id:blogid},
        })
        if(!uniqueblog){
            res.status(404).json({msg :"blog not found"})
        }
        res.json({uniqueblog}); 
    }
    catch(error){
        res.status(500).json({msg:"failed to get blog"})
    }
})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
