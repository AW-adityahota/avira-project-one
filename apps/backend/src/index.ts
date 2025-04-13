import express  from "express";
import { clerkClient, clerkMiddleware, getAuth, requireAuth, User } from '@clerk/express'
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client'
import { syncUser } from "./sync";
import cors from "cors"
import router from "./fileUpload";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import http from "http"
import Redis from 'redis';
import nodemailer from 'nodemailer';
import { createClient,RedisClientType  } from 'redis';
import swaggerUi from 'swagger-ui-express';
import { oas } from "./oas";

const app = express();
const port = 3000;
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient(); 
const redisClient = createClient({ url: process.env.REDIS_URL }); 

app.use(cors({ 
    origin: ["34.46.68.183"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
  })); 

  app.options('*', cors());
  app.use(clerkMiddleware()); 
  dotenv.config();

  const userConnections = new Map<string, WebSocket>();
  redisClient.connect().catch(console.error); 


  wss.on('connection', async (ws, req) => {
    try {
      const userId = req.url?.split('userId=')[1];
      if (!userId) {
        ws.close();
        return;
      }
  
      userConnections.set(userId, ws);
      console.log(`User ${userId} connected`);
  
      ws.on('close', () => {
        userConnections.delete(userId);
        console.log(`User ${userId} disconnected`);
      });
  
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close();
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // true for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

const redisPublisher: RedisClientType = createClient({ url: process.env.REDIS_URL });
const redisSubscriber: RedisClientType = createClient({ url: process.env.REDIS_URL });

redisPublisher.connect().catch(console.error);
redisSubscriber.connect().catch(console.error);

redisSubscriber.subscribe('blog:created', async (message: string) => {
  try {
    const { blogId, authorEmail } = JSON.parse(message);

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });

    await transporter.sendMail({
      from: '"Blog Platform" <noreply@example.com>',
      to: authorEmail,
      subject: "New Blog Published!",
      html: `<p>Your blog "<b>${blog?.title}</b>" is now live!</p>`,
    });

    console.log(`Email sent to ${authorEmail}`);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
});

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(oas));

app.get('/api/user/notifications', requireAuth(), async (req, res) => {
    try {
      const prismaUser = await  syncUser(req);
      const notifications = await prisma.notification.findMany({
        where: { userId: prismaUser.id },
        orderBy: { createdAt: 'asc' },
        take: 20
      });
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/user/notifications/:id/read', requireAuth(), async (req, res) => {
    try {
      const prismaUser = await syncUser(req);
      const notification = await prisma.notification.update({
        where: { id: req.params.id, userId: prismaUser.id },
        data: { read: true }
      });
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });
  
  app.patch('/api/user/notifications/mark-all-read', requireAuth(), async (req, res) => {
    try {
      const prismaUser = await syncUser(req);
      await prisma.notification.updateMany({
        where: { 
          userId: prismaUser.id,
          read: false
        },
        data: { read: true }
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  });


app.get('/', (req, res) => {
    res.send('Hello World')
})

app.get('/health', async (req, res) => {
  const status = {
    database: false,
    redis: false,
  };

  try {
    //pg
    await prisma.$queryRaw`SELECT 1`;
    status.database = true;

    //reddis
    const ping = await redisClient.ping();
    if (ping === 'PONG') {
      status.redis = true;
    }

    res.status(200).json({
      status: 'healthy',
      services: status,
      timestamp: new Date().toISOString(),
    });
  } 
  catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      services: status,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


app.get('/ws-health', (req, res) => {
  if (wss.clients.size > 0) {
    res.status(200).json({ ws: 'healthy' });
  } else {
    res.status(200).json({ ws: 'no-connections' });
  }
});

app.use("/api/user", router); 

app.get('/api/user',requireAuth(),async (req,res)=>{
    const prismaUser = await syncUser(req);
    res.json(prismaUser); 
})

app.get('/api/blogs',requireAuth(),async (req,res): Promise<void> =>{
    try{

        const pages = Number(req.query.pages) ||1; 
        const limit = 3; 
        const cacheKey = `blogs:${pages}`;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            (res.json(JSON.parse(cachedData))); 
            return; 
        }

        const all = await prisma.blog.findMany({
            include: {  
                author: true
            },
            orderBy: { createdAt: 'asc' },
            skip: (pages-1)*limit,
            take:limit
        }); 
        const totalItems = await prisma.blog.count(); 
        res.json({totalItems,currentPage:pages,all,totalPages: Math.ceil(totalItems / limit)})

        await redisClient.setEx(cacheKey, 600, JSON.stringify({totalItems,currentPage:pages,all,totalPages: Math.ceil(totalItems / limit)}));
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

        await redisPublisher.publish('blog:created', JSON.stringify({
          blogId: blogs.id,
          authorEmail: prismaUser.email, 
        }));
        
        const notification = await prisma.notification.create({
            data: {
              message: `Your blog "${title}" was published successfully!`,
              userId: prismaUser.id
            }
          });
      
          const userWs = userConnections.get(prismaUser.id);
          if (userWs?.readyState === WebSocket.OPEN) {
            userWs.send(JSON.stringify({
              type: 'notification',
              data: notification
            }));
          }
      
          res.json(blogs);
        } catch (error) {
          console.error("Blog creation error:", error);
          res.status(500).json({ msg: "failed to post blog" });
        }
      });

app.get("/api/blogs/:blogid",async(req,res)=>{
    try{
        const {blogid} =req.params; 
        const uniqueblog = await prisma.blog.findUnique({
            where:{id:blogid},
            include: {  
              author: true
          }
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

server.listen(port, '0.0.0.0', () => {  
  console.log(`Server running on port ${port}`);
});